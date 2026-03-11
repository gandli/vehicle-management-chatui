import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Check if we have a database URL
const connectionString = process.env.POSTGRES_URL || 'postgresql://localhost:5432/chatbot';

// For development/testing without a real database, we'll use a mock
let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

try {
  // Only create connection if URL is properly configured
  if (process.env.POSTGRES_URL && !process.env.POSTGRES_URL.includes('localhost')) {
    client = postgres(connectionString);
    db = drizzle(client, { schema });
  }
} catch (error) {
  console.warn('Database connection failed, using mock mode:', error);
}

// Export a mock db for when database is not available
export { db };

// Re-export schema
export * from './schema';