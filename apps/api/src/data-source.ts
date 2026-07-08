import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * TypeORM data source for CLI migrations.
 * Usage: npx typeorm -d src/data-source.ts migration:generate src/migrations/InitialSchema
 *
 * NOTE: This file is only used by the TypeORM CLI, not by the NestJS app at runtime.
 * The NestJS app configures TypeORM via TypeOrmModule.forRootAsync in app.module.ts.
 */
const isNeon = !!process.env.DATABASE_URL;

export default new DataSource(isNeon ? {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: ['src/**/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
} : {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'changeme',
  database: process.env.DB_NAME ?? 'taskflow',
  entities: ['src/**/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
