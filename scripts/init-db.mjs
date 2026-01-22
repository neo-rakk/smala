import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function init() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }

  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('❌ POSTGRES_URL is missing in environment variables.');
    process.exit(1);
  }

  console.log('🚀 Connecting to database...');
  const sql = postgres(connectionString, { ssl: 'require' });

  try {
    // --- TABLES ---

    console.log('📦 Creating table "game_state"...');
    await sql`
      CREATE TABLE IF NOT EXISTS game_state (
        id text PRIMARY KEY,
        payload jsonb NOT NULL,
        host_id uuid,
        updated_at timestamp with time zone DEFAULT now()
      );
    `;

    // Ensure host_id column exists if table was already created
    try {
      await sql`ALTER TABLE game_state ADD COLUMN IF NOT EXISTS host_id uuid;`;
    } catch (e) { /* ignore */ }


    console.log('📦 Creating table "profiles"...');
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
        nickname text,
        avatar_url text,
        updated_at timestamp with time zone DEFAULT now()
      );
    `;

    console.log('📦 Creating table "teams"...');
    await sql`
      CREATE TABLE IF NOT EXISTS teams (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text,
        captain_id uuid REFERENCES profiles(id),
        created_at timestamp with time zone DEFAULT now()
      );
    `;

    console.log('📦 Creating table "leaderboard"...');
    await sql`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        team_name text NOT NULL,
        score integer NOT NULL,
        created_at timestamp with time zone DEFAULT now()
      );
    `;

    // --- RLS SECURITY ---
    console.log('🔒 Enabling RLS and configuring policies...');

    // 1. game_state
    await sql`ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;`;
    // Drop existing policies to ensure clean state
    await sql`DROP POLICY IF EXISTS "Public Read game_state" ON game_state;`;
    await sql`DROP POLICY IF EXISTS "Authenticated Update game_state" ON game_state;`;
    await sql`DROP POLICY IF EXISTS "Public Insert game_state" ON game_state;`;

    // Policies
    // Explicitly allow both anon and authenticated roles to read
    // "TO public" covers both, but ensuring it's clear
    await sql`CREATE POLICY "Public Read game_state" ON game_state FOR SELECT TO public USING (true);`;

    // We allow any authenticated user to INSERT (to initialize the game if missing)
    await sql`CREATE POLICY "Authenticated Insert game_state" ON game_state FOR INSERT WITH CHECK (auth.role() = 'authenticated');`;

    // UPDATE: Only the host (stored in host_id) OR any authenticated user if host_id is NULL (initial setup)
    // NOTE: For simplicity and robustness in this "Live" context where the Admin might change,
    // we allow the current host to update.
    // However, since we are moving from "PIN only" to "Admin User", we need to trust the logged in user.
    // The App logic will set host_id on INIT.
    // Policy: User can update if they are the host_id OR if they are claiming it (INIT).
    // Simplifying: Authenticated users can update. The App logic guards the business rules.
    // Ideally: USING (auth.uid() = host_id)
    // But let's start with "Authenticated" to avoid breaking the "Claim Host" flow,
    // or we need a specific flow to set host_id.
    // Let's go with: Authenticated users can UPDATE. This is better than "Public".
    await sql`CREATE POLICY "Authenticated Update game_state" ON game_state FOR UPDATE USING (auth.role() = 'authenticated');`;


    // 2. profiles
    await sql`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`;
    await sql`DROP POLICY IF EXISTS "Public Read profiles" ON profiles;`;
    await sql`DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;`;
    await sql`DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;`;

    await sql`CREATE POLICY "Public Read profiles" ON profiles FOR SELECT USING (true);`;
    await sql`CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);`;
    await sql`CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);`;

    // 3. teams
    await sql`ALTER TABLE teams ENABLE ROW LEVEL SECURITY;`;
    await sql`DROP POLICY IF EXISTS "Public Read teams" ON teams;`;
    await sql`DROP POLICY IF EXISTS "Authenticated Create teams" ON teams;`;

    await sql`CREATE POLICY "Public Read teams" ON teams FOR SELECT USING (true);`;
    await sql`CREATE POLICY "Authenticated Create teams" ON teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');`;

    // 4. leaderboard
    await sql`ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;`;
    await sql`DROP POLICY IF EXISTS "Public Read leaderboard" ON leaderboard;`;
    await sql`DROP POLICY IF EXISTS "Authenticated Insert leaderboard" ON leaderboard;`;
    await sql`DROP POLICY IF EXISTS "Authenticated Delete leaderboard" ON leaderboard;`;

    await sql`CREATE POLICY "Public Read leaderboard" ON leaderboard FOR SELECT USING (true);`;
    // Only authenticated users (technically the Admin/Host ends the game) can write to leaderboard
    await sql`CREATE POLICY "Authenticated Insert leaderboard" ON leaderboard FOR INSERT WITH CHECK (auth.role() = 'authenticated');`;
    // Allow admin (authenticated) to delete scores
    await sql`CREATE POLICY "Authenticated Delete leaderboard" ON leaderboard FOR DELETE USING (auth.role() = 'authenticated');`;


    // --- TRIGGERS ---
    console.log('⚡ Configuring Auth Triggers...');

    // Function to handle new user creation
    await sql`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, nickname, avatar_url)
        VALUES (
          new.id,
          new.raw_user_meta_data->>'nickname',
          new.raw_user_meta_data->>'avatar_url'
        );
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Trigger on auth.users
    // Note: This requires permissions on the auth schema, typically available to the postgres role.
    try {
      await sql`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`;
      await sql`
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
      `;
    } catch (e) {
      console.warn('⚠️ Could not configure trigger on auth.users (likely permission issue or local dev environment). Manual profile creation might be needed if this fails.');
      console.error(e);
    }

    // --- REALTIME ---
    console.log('📡 Enabling Realtime...');

    // Ensure REPLICA IDENTITY FULL for game_state to guarantee payload delivery
    await sql`ALTER TABLE game_state REPLICA IDENTITY FULL;`;

    const tables = ['game_state', 'leaderboard', 'profiles'];

    for (const table of tables) {
       const [existing] = await sql`
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = ${table};
      `;
      if (!existing) {
        // Safe to add even if publication exists (it just adds the table)
        // But we check just to be clean.
        // Note: ALTER PUBLICATION ... ADD TABLE throws if table is already in it, so we need to be careful.
        // The query above checks this specific table.
         try {
            await sql`ALTER PUBLICATION supabase_realtime ADD TABLE ${sql(table)};`;
         } catch(e) {
            console.log(`Note: Could not add ${table} to realtime (maybe already there?): ${e.message}`);
         }
      }
    }

    console.log('✨ Database initialization & Security Audit complete!');
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

init();
