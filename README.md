# POS App

Monorepo with Electron (main), Vite + React + TypeScript renderer, and Express + Prisma server.

- Install: pnpm install
- Development: pnpm dev

Server:
- cd server
- copy .env.example to .env and set DATABASE_URL
- pnpm prisma migrate dev --name init
- pnpm dev

Renderer:
- cd renderer
- pnpm dev

Electron:
- cd electron
- pnpm dev
