#!/bin/bash
# Server setup script for Sendora deployment | Sendora 部署服务器设置脚本

set -e

# Colors | 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root | 检查是否以 root 运行
if [ "$EUID" -eq 0 ]; then 
   print_error "Please do not run this script as root!"
   exit 1
fi

print_info "Starting Sendora server setup..."

# Update system | 更新系统
print_step "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker | 安装 Docker
print_step "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    print_info "Docker installed. You may need to log out and back in for group changes to take effect."
else
    print_info "Docker is already installed"
fi

# Install Docker Compose | 安装 Docker Compose
print_step "Installing Docker Compose..."
if ! command -v docker compose &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
else
    print_info "Docker Compose is already installed"
fi

# Install Git | 安装 Git
print_step "Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt-get install -y git
else
    print_info "Git is already installed"
fi

# Install other useful tools | 安装其他有用工具
print_step "Installing additional tools..."
sudo apt-get install -y curl wget htop net-tools

# Create deployment directory | 创建部署目录
print_step "Creating deployment directory..."
sudo mkdir -p /opt/sendora
sudo chown $USER:$USER /opt/sendora

# Copy deployment script | 复制部署脚本
print_step "Setting up deployment scripts..."
if [ -f "deploy-version.sh" ]; then
    cp deploy-version.sh /opt/sendora/
    chmod +x /opt/sendora/deploy-version.sh
else
    print_info "Downloading deployment script..."
    curl -fsSL https://raw.githubusercontent.com/sendora-org/sendora.org/main/deploy-version.sh -o /opt/sendora/deploy-version.sh
    chmod +x /opt/sendora/deploy-version.sh
fi

# Create management script | 创建管理脚本
print_step "Creating management script..."
cat > /opt/sendora/sendora-manage.sh << 'EOF'
#!/bin/bash
# Sendora management script | Sendora 管理脚本

DEPLOY_DIR="/opt/sendora"

case "$1" in
    "deploy")
        shift
        $DEPLOY_DIR/deploy-version.sh "$@"
        ;;
    "rollback")
        VERSION=$(cat $DEPLOY_DIR/current-version 2>/dev/null)
        ENV=${2:-staging}
        $DEPLOY_DIR/deploy-version.sh "$VERSION" "$ENV" rollback
        ;;
    "status")
        VERSION=$(cat $DEPLOY_DIR/current-version 2>/dev/null)
        ENV=${2:-staging}
        $DEPLOY_DIR/deploy-version.sh "$VERSION" "$ENV" status
        ;;
    "logs")
        ENV=${2:-staging}
        docker logs -f sendora-$ENV
        ;;
    "restart")
        ENV=${2:-staging}
        docker restart sendora-$ENV
        ;;
    "stop")
        ENV=${2:-staging}
        docker stop sendora-$ENV
        ;;
    "start")
        ENV=${2:-staging}
        docker start sendora-$ENV
        ;;
    "versions")
        VERSION="dummy"
        ENV=${2:-staging}
        $DEPLOY_DIR/deploy-version.sh "$VERSION" "$ENV" list
        ;;
    *)
        echo "Sendora Management Tool"
        echo ""
        echo "Usage: sendora-manage <command> [options]"
        echo ""
        echo "Commands:"
        echo "  deploy <version> <env>    Deploy a specific version"
        echo "  rollback [env]            Rollback to previous version"
        echo "  status [env]              Show deployment status"
        echo "  logs [env]                Show application logs"
        echo "  restart [env]             Restart application"
        echo "  stop [env]                Stop application"
        echo "  start [env]               Start application"
        echo "  versions [env]            List available versions"
        echo ""
        echo "Environment defaults to 'staging' if not specified"
        ;;
esac
EOF

chmod +x /opt/sendora/sendora-manage.sh

# Create symlink for easy access | 创建符号链接以便访问
print_step "Creating system-wide command..."
sudo ln -sf /opt/sendora/sendora-manage.sh /usr/local/bin/sendora-manage

# Setup firewall (optional) | 设置防火墙（可选）
print_step "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw allow 3000/tcp  # Production app
    sudo ufw allow 3001/tcp  # Staging app
    print_info "Firewall rules added (not enabled)"
else
    print_info "UFW not installed, skipping firewall setup"
fi

# Create systemd service (optional) | 创建 systemd 服务（可选）
print_step "Creating systemd service..."
sudo cat > /etc/systemd/system/sendora-monitor.service << EOF
[Unit]
Description=Sendora Docker Monitor
After=docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=30
ExecStart=/usr/bin/docker events --filter 'container=sendora-production' --filter 'container=sendora-staging' --format 'Container {{.Actor.Attributes.name}} {{.Action}}'

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable sendora-monitor.service

# Setup log rotation | 设置日志轮转
print_step "Setting up log rotation..."
sudo cat > /etc/logrotate.d/sendora << EOF
/var/lib/docker/containers/*-json.log {
    daily
    rotate 7
    compress
    missingok
    delaycompress
    copytruncate
}
EOF

print_info "Server setup completed!"
print_info ""
print_info "Next steps:"
print_info "1. Log out and back in to apply Docker group changes"
print_info "2. Clone your repository to /opt/sendora/repo"
print_info "3. Use 'sendora-manage deploy <version> <environment>' to deploy"
print_info ""
print_info "Available commands:"
print_info "  sendora-manage status     - Check deployment status"
print_info "  sendora-manage logs       - View application logs"
print_info "  sendora-manage rollback   - Rollback to previous version"
print_info "  sendora-manage versions   - List available versions"