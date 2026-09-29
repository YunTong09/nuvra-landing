import type { PoolClient } from "pg";

export async function migratePostgresUserRoles(db: PoolClient) {
  // The startup transaction and advisory lock also protect this schema upgrade.
  await db.query(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('user', 'employee', 'admin'));
  `);
}
