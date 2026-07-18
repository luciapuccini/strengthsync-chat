FROM node:22-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "pnpm migrate:dev && pnpm gen:prisma && pnpm dev"]
