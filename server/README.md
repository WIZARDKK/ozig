Server (Express + Prisma)

- Copy `.env.example` to `.env` and set `DATABASE_URL`.
- pnpm install
- pnpm prisma generate
- pnpm prisma migrate dev --name init
- pnpm dev
