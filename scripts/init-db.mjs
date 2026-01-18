import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function init() {
  // Load .env if it exists (for local development)
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
    console.log('📦 Creating table "game_state" if it doesn\'t exist...');
    await sql`
      CREATE TABLE IF NOT EXISTS game_state (
        id text PRIMARY KEY,
        payload jsonb NOT NULL,
        updated_at timestamp with time zone DEFAULT now()
      );
    `;

    console.log('🔒 Disabling RLS for "game_state" (simplification)...');
    await sql`ALTER TABLE game_state DISABLE ROW LEVEL SECURITY;`;

    console.log('📡 Enabling Realtime for "game_state"...');
    // Check if table is already in publication to avoid errors
    const [existing] = await sql`
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'game_state';
    `;

    if (!existing) {
      await sql`ALTER PUBLICATION supabase_realtime ADD TABLE game_state;`;
      console.log('✅ Realtime enabled.');
    } else {
      console.log('ℹ️ Realtime already enabled.');
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
