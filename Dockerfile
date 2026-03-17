# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# 安装 yarn berry 所需工具
RUN apk add --no-cache libc6-compat python3 make g++

# 复制完整源码（含 .yarn/releases、.yarn/patches、所有 package.json）
COPY . .

# 安装全部依赖
RUN yarn install

# ─── Stage 2: builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

# 从 deps 阶段复制完整工程（含 node_modules）
COPY --from=deps /app ./

# 先构建所有 workspace 包
RUN yarn workspaces foreach --all --exclude next-app run build

# 再构建 Next.js（standalone 模式）
RUN cd apps/next && yarn next build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8151

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standalone 产物
COPY --from=builder /app/apps/next/.next/standalone ./
# 静态资源
COPY --from=builder --chown=nextjs:nodejs /app/apps/next/.next/static ./apps/next/.next/static
# public 目录
COPY --from=builder --chown=nextjs:nodejs /app/apps/next/public ./apps/next/public

USER nextjs

EXPOSE 8151

CMD ["node", "apps/next/server.js"]
