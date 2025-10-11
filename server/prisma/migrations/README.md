Initial migrations should be generated and applied by running:

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your MySQL connection.
2. pnpm install
3. pnpm --filter pos-server prisma migrate dev --name init

This folder is a placeholder: run `prisma migrate dev` to create migration files based on `schema.prisma`.
