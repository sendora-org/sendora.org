#!/bin/bash
# Version-based deployment script with rollback support | 支持版本回退的部署脚本

set -e

# Arguments | 参数
VERSION=$1
ENVIRONMENT=$2

# Colors | 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration | 配置
DEPLOY_DIR="/opt/sendora"
REPO_DIR="$DEPLOY_DIR/repo"
VERSIONS_DIR="$DEPLOY_DIR/versions"
MAX_VERSIONS=5  # Keep last 5 versions | 保留最近5个版本

# Print functions | 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Ensure directories exist | 确保目录存在
mkdir -p "$VERSIONS_DIR"

# Build new version | 构建新版本
build_version() {
    print_step "Building version $VERSION..."
    
    # Create version directory | 创建版本目录
    VERSION_DIR="$VERSIONS_DIR/$VERSION"
    if [ -d "$VERSION_DIR" ]; then
        print_warning "Version $VERSION already exists, rebuilding..."
        rm -rf "$VERSION_DIR"
    fi
    
    # Copy source code | 复制源代码
    cp -r "$REPO_DIR" "$VERSION_DIR"
    cd "$VERSION_DIR"
    
    # Create Dockerfile for specific environment | 为特定环境创建 Dockerfile
    if [ "$ENVIRONMENT" = "production" ]; then
        PORT=7000
    else
        PORT=7001
    fi
    
    # Build Docker image with version tag | 构建带版本标签的 Docker 镜像
    print_info "Building Docker image sendora:$VERSION..."
    docker build -t sendora:$VERSION .
    
    # Tag as environment-specific | 标记为环境特定版本
    docker tag sendora:$VERSION sendora:$ENVIRONMENT
    
    # Create deployment info | 创建部署信息
    cat > "$VERSION_DIR/deploy-info.json" << EOF
{
    "version": "$VERSION",
    "environment": "$ENVIRONMENT",
    "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "gitCommit": "$(cd $REPO_DIR && git rev-parse HEAD)",
    "gitBranch": "$(cd $REPO_DIR && git rev-parse --abbrev-ref HEAD)"
}
EOF
    
    print_info "Build completed successfully"
}

# Deploy version | 部署版本
deploy_version() {
    print_step "Deploying version $VERSION to $ENVIRONMENT..."
    
    # Create docker-compose file for this version | 为此版本创建 docker-compose 文件
    cat > "$DEPLOY_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
  sendora:
    image: sendora:$VERSION
    container_name: sendora-$ENVIRONMENT
    ports:
      - "${PORT}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - PUBLIC_ENVIRONMENT=$ENVIRONMENT
      - PUBLIC_VERSION=$VERSION
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "sendora.version=$VERSION"
      - "sendora.environment=$ENVIRONMENT"
      - "sendora.deployed=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
EOF
    
    # Stop current version | 停止当前版本
    print_info "Stopping current version..."
    cd "$DEPLOY_DIR"
    docker compose down --remove-orphans || true
    
    # Start new version | 启动新版本
    print_info "Starting new version..."
    docker compose up -d
    
    # Wait for health check | 等待健康检查
    print_info "Waiting for application to be ready..."
    ATTEMPTS=0
    MAX_ATTEMPTS=30
    
    while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
        if docker exec sendora-$ENVIRONMENT wget --spider -q http://localhost:3000 2>/dev/null; then
            print_info "Application is ready!"
            break
        fi
        ATTEMPTS=$((ATTEMPTS + 1))
        print_info "Waiting... ($ATTEMPTS/$MAX_ATTEMPTS)"
        sleep 2
    done
    
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
        print_error "Application failed to start!"
        docker logs sendora-$ENVIRONMENT --tail 50
        return 1
    fi
    
    # Save current version | 保存当前版本
    echo "$VERSION" > "$DEPLOY_DIR/current-version"
    
    print_info "Deployment completed successfully!"
}

# Clean old versions | 清理旧版本
cleanup_old_versions() {
    print_step "Cleaning up old versions..."
    
    # List versions sorted by date | 按日期排序列出版本
    cd "$VERSIONS_DIR"
    VERSIONS=($(ls -t))
    VERSION_COUNT=${#VERSIONS[@]}
    
    if [ $VERSION_COUNT -gt $MAX_VERSIONS ]; then
        print_info "Found $VERSION_COUNT versions, keeping last $MAX_VERSIONS"
        
        # Remove old versions | 删除旧版本
        for ((i=$MAX_VERSIONS; i<$VERSION_COUNT; i++)); do
            OLD_VERSION="${VERSIONS[$i]}"
            print_info "Removing old version: $OLD_VERSION"
            
            # Remove directory | 删除目录
            rm -rf "$VERSIONS_DIR/$OLD_VERSION"
            
            # Remove Docker image if not in use | 如果未使用则删除 Docker 镜像
            if ! docker ps | grep -q "sendora:$OLD_VERSION"; then
                docker rmi sendora:$OLD_VERSION 2>/dev/null || true
            fi
        done
    fi
    
    # Clean unused Docker images | 清理未使用的 Docker 镜像
    docker image prune -f
}

# List available versions | 列出可用版本
list_versions() {
    print_step "Available versions:"
    
    cd "$VERSIONS_DIR"
    for version in $(ls -t); do
        if [ -f "$version/deploy-info.json" ]; then
            INFO=$(cat "$version/deploy-info.json")
            BUILD_TIME=$(echo "$INFO" | grep -o '"buildTime": "[^"]*"' | cut -d'"' -f4)
            
            if [ "$version" = "$(cat $DEPLOY_DIR/current-version 2>/dev/null)" ]; then
                echo -e "  ${GREEN}► $version${NC} (current) - Built: $BUILD_TIME"
            else
                echo -e "    $version - Built: $BUILD_TIME"
            fi
        fi
    done
}

# Rollback to previous version | 回退到上一个版本
rollback() {
    print_step "Rolling back to previous version..."
    
    # Get current version | 获取当前版本
    CURRENT_VERSION=$(cat "$DEPLOY_DIR/current-version" 2>/dev/null)
    if [ -z "$CURRENT_VERSION" ]; then
        print_error "No current version found!"
        return 1
    fi
    
    # Find previous version | 查找上一个版本
    cd "$VERSIONS_DIR"
    VERSIONS=($(ls -t))
    PREVIOUS_VERSION=""
    
    for ((i=0; i<${#VERSIONS[@]}; i++)); do
        if [ "${VERSIONS[$i]}" = "$CURRENT_VERSION" ] && [ $((i+1)) -lt ${#VERSIONS[@]} ]; then
            PREVIOUS_VERSION="${VERSIONS[$((i+1))]}"
            break
        fi
    done
    
    if [ -z "$PREVIOUS_VERSION" ]; then
        print_error "No previous version found!"
        return 1
    fi
    
    print_info "Rolling back from $CURRENT_VERSION to $PREVIOUS_VERSION"
    
    # Deploy previous version | 部署上一个版本
    VERSION=$PREVIOUS_VERSION
    deploy_version
}

# Show deployment status | 显示部署状态
show_status() {
    print_step "Deployment Status"
    
    # Current version | 当前版本
    CURRENT_VERSION=$(cat "$DEPLOY_DIR/current-version" 2>/dev/null || echo "none")
    echo -e "Current version: ${GREEN}$CURRENT_VERSION${NC}"
    
    # Container status | 容器状态
    if docker ps | grep -q sendora-$ENVIRONMENT; then
        echo -e "Container status: ${GREEN}Running${NC}"
        
        # Show container info | 显示容器信息
        docker ps --filter "name=sendora-$ENVIRONMENT" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        echo -e "Container status: ${RED}Not running${NC}"
    fi
    
    # Disk usage | 磁盘使用
    echo -e "\nDisk usage:"
    du -sh "$VERSIONS_DIR" 2>/dev/null || echo "Versions directory not found"
    
    # Docker images | Docker 镜像
    echo -e "\nDocker images:"
    docker images | grep sendora || echo "No sendora images found"
}

# Main logic | 主逻辑
case "${3:-deploy}" in
    "deploy")
        build_version
        deploy_version
        cleanup_old_versions
        list_versions
        ;;
    "rollback")
        rollback
        ;;
    "list")
        list_versions
        ;;
    "status")
        show_status
        ;;
    *)
        print_error "Unknown command: $3"
        echo "Usage: $0 <version> <environment> [deploy|rollback|list|status]"
        exit 1
        ;;
esac