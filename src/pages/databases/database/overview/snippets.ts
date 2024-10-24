import { CodeLang } from '@koyeb/design-system';

export enum DatabaseClient {
  psql = 'psql',
  dotenv = 'dotenv',
  nextJs = 'nextJs',
  prisma = 'prisma',
  node = 'node',
  django = 'django',
  sqlAlchemy = 'sqlAlchemy',
  java = 'java',
  symfony = 'symfony',
  pq = 'pq',
  rubyOnRails = 'rubyOnRails',
}

export type DatabaseConnectionDetails = {
  role: string;
  host: string;
  password: string;
  database: string;
};

export type DatabaseSnippetFn = (details: DatabaseConnectionDetails) => string;

type DatabaseClientSnippets = Array<{
  filename: string;
  lang: CodeLang;
  snippet: DatabaseSnippetFn;
}>;

export const databaseClientSnippets = new Map<DatabaseClient, DatabaseClientSnippets>();

const dotenv: DatabaseSnippetFn = ({ role, password, host, database }) =>
  `
DATABASE_HOST=${host}
DATABASE_USER=${encodeURIComponent(role)}
DATABASE_PASSWORD=${password}
DATABASE_NAME=${encodeURIComponent(database)}
`.trim();

databaseClientSnippets.set(DatabaseClient.psql, [
  {
    filename: 'postgres',
    lang: 'text',
    snippet: ({ role, password, host, database }) =>
      `
postgres://${encodeURIComponent(role)}:${password}@${host}/${encodeURIComponent(database)}
    `.trim(),
  },
]);

databaseClientSnippets.set(DatabaseClient.dotenv, [
  {
    filename: '.env',
    lang: 'dotenv',
    snippet: dotenv,
  },
]);

databaseClientSnippets.set(DatabaseClient.nextJs, [
  {
    filename: '.env',
    lang: 'dotenv',
    snippet: dotenv,
  },
  {
    filename: 'app/page.tsx',
    lang: 'javascript',
    snippet: () =>
      `
import postgres from 'postgres'

export function Page() {
  const sql = postgres({
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: 'require',
  })

  return <>...</>
}
    `.trim(),
  },
]);

databaseClientSnippets.set(DatabaseClient.prisma, [
  {
    filename: '.env',
    lang: 'dotenv',
    snippet: ({ role, password, host, database }) =>
      `
DATABASE_URL=postgres://${encodeURIComponent(role)}:${password}@${host}/${encodeURIComponent(database)}?sslmode=require&pgbouncer=true&connect_timeout=10
DIRECT_URL=postgres://${encodeURIComponent(role)}:${password}@${host}/${encodeURIComponent(database)}?sslmode=require&connect_timeout=10
    `.trim(),
  },
  {
    filename: 'schema.prisma',
    lang: 'prisma',
    snippet: () =>
      `
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
    `.trim(),
  },
]);

databaseClientSnippets.set(DatabaseClient.node, [
  {
    filename: '.env',
    lang: 'text',
    snippet: dotenv,
  },
  {
    filename: 'index.ts',
    lang: 'javascript',
    snippet: () =>
      `
import postgres from 'postgres'

const sql = postgres({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: 'require',
})
    `.trim(),
  },
]);

databaseClientSnippets.set(DatabaseClient.django, [
  {
    filename: 'settings.py',
    lang: 'python',
    snippet: ({ role, password, host, database }) =>
      `
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': '${encodeURIComponent(database)}',
        'USER': '${encodeURIComponent(role)}',
        'PASSWORD': '${password}',
        'HOST': '${host}',
        'OPTIONS': {'sslmode': 'require'},
    }
}
    `.trim(),
  },
]);

databaseClientSnippets.set(DatabaseClient.sqlAlchemy, [
  {
    filename: 'db.py',
    lang: 'python',
    snippet: ({ role, password, host, database }) =>
      `
from sqlalchemy import URL, create_engine

connection_string = URL.create(
    'postgresql',
    username='${encodeURIComponent(role)}',
    password='${password}',
    host='${host}',
    database='${encodeURIComponent(database)}',
)

engine = create_engine(connection_string)
    `.trim(),
  },
]);

databaseClientSnippets.set(DatabaseClient.java, [
  {
    filename: '.env',
    lang: 'dotenv',
    snippet: ({ role, password, host, database }) =>
      `
JDBC_URI=jdbc:postgresql://${host}/${encodeURIComponent(database)}?user=${encodeURIComponent(role)}&password=${password}
    `.trim(),
  },
]);

databaseClientSnippets.set(DatabaseClient.symfony, [
  {
    filename: '.env',
    lang: 'dotenv',
    snippet: ({ role, password, host, database }) =>
      `
DATABASE_URL="postgresql://${encodeURIComponent(role)}:${password}@${host}/${encodeURIComponent(database)}?charset=utf8"
    `.trim(),
  },
]);

databaseClientSnippets.set(DatabaseClient.pq, [
  {
    filename: 'main.go',
    lang: 'go',
    snippet: ({ role, password, host, database }) =>
      `
import (
	"database/sql"

	_ "github.com/lib/pq"
)

func main() {
	connStr := "user='${encodeURIComponent(role)}' password=${password} host=${host} dbname='${encodeURIComponent(database)}'"
	db, err := sql.Open("postgres", connStr)
}
    `.trim(),
  },
]);

databaseClientSnippets.set(DatabaseClient.rubyOnRails, [
  {
    filename: '.env',
    lang: 'dotenv',
    snippet: ({ role, password, host, database }) =>
      `
DATABASE_URL='postgres://${encodeURIComponent(role)}:${password}@${host}/${encodeURIComponent(database)}'
    `.trim(),
  },
  {
    filename: 'config/database.yml',
    lang: 'yaml',
    snippet: () =>
      `
production:
  adapter: postgresql
  url: <%= ENV['DATABASE_URL'] =%>
    `.trim(),
  },
]);
