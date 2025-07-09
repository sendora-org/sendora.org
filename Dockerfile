# Build stage | 构建阶段
FROM node:20-alpine AS builder

# Install pnpm | 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory | 设置工作目录
WORKDIR /app

# Copy package files | 复制包文件
COPY package.json pnpm-lock.yaml ./

# Install dependencies | 安装依赖
RUN pnpm install --frozen-lockfile

# Copy source code | 复制源代码
COPY . .

# Build application | 构建应用
RUN pnpm build

# Production stage | 生产阶段
FROM node:20-alpine

# Install wget for healthcheck | 安装 wget 用于健康检查
RUN apk add --no-cache wget

# Install pnpm | 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory | 设置工作目录
WORKDIR /app

# Copy package files | 复制包文件
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only | 仅安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# Copy built application | 复制构建的应用
COPY --from=builder /app/build ./build

# Expose port | 暴露端口
EXPOSE 3000

# Set environment to production | 设置环境为生产
ENV NODE_ENV=production

# Set default port | 设置默认端口
ENV PORT=3000

# Start application | 启动应用
CMD ["node", "build"]