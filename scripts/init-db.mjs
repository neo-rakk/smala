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
    console.warn('⚠️ POSTGRES_URL is missing. Skipping automatic database initialization.');
    console.warn('To enable automatic schema creation, set POSTGRES_URL in your environment variables.');
    return; // Exit function gracefully instead of process.exit(1)
  }

  console.log('🚀 Connecting to database...');
  const sql = postgres(connectionString, { ssl: 'require' });

  try {
    console.log('📦 Creating table "game_state"...');
    await sql`
      CREATE TABLE IF NOT EXISTS game_state (
        id text PRIMARY KEY,
        payload jsonb NOT NULL,
        updated_at timestamp with time zone DEFAULT now()
      );
    `;

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

    console.log('🔒 Disabling RLS for simplicity (Demo mode)...');
    await sql`ALTER TABLE game_state DISABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE teams DISABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;`;

    console.log('📡 Enabling Realtime for "game_state"...');
    const [existing] = await sql`
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'game_state';
    `;
    if (!existing) {
      await sql`ALTER PUBLICATION supabase_realtime ADD TABLE game_state;`;
    }

    // Also enable for leaderboard to have live updates if someone is watching
    const [existingLb] = await sql`
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'leaderboard';
    `;
    if (!existingLb) {
      await sql`ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;`;
    }

    console.log('✨ Database initialization complete!');
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

init();
