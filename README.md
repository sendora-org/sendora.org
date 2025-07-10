# Sendora - Web3 Developer Tools Platform

[English](./README.md) | [中文](./README.zh.md)

<p align="center">
  <img src="./static/logo.svg" alt="Sendora Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Professional Web3 Developer Tools for Smart Contract Deployment, Transaction Broadcasting, and DeFi Operations</strong>
</p>

<p align="center">
  <a href="https://sendora.org">Live Demo</a> •
  <a href="/docs">Documentation</a> •
  <a href="https://discord.gg/YQp7fzv2G5">Discord</a>
</p>

## 🌟 Overview

Sendora is a comprehensive Web3 developer tools platform built with SvelteKit 5, providing professional-grade tools for blockchain developers and DeFi enthusiasts. The platform offers a suite of essential tools for smart contract interaction, transaction management, and multi-chain operations.

## ✨ Key Features

### 🛠️ Core Tools

- **Deploy Contracts** - Deploy smart contracts across multiple EVM chains with constructor parameter support
- **Broadcast Transaction** - Broadcast pre-signed transactions with real-time status tracking
- **Signthis** - Sign messages and transactions with multiple wallet providers
- **Callthis** - Interact with deployed smart contracts, including read/write operations

### 🔗 Multi-Chain Support

- Ethereum Mainnet & Testnets
- Polygon (MATIC)
- BNB Smart Chain
- Arbitrum & Optimism
- Base
- 100+ EVM-compatible chains

### 💼 Wallet Integration

- MetaMask
- WalletConnect v2
- Coinbase Wallet
- Injected Web3 Providers

### 🎨 User Experience

- **Responsive Design** - Optimized for desktop and mobile devices
- **Dark/Light Mode** - Comfortable viewing in any environment
- **Multi-Language** - English and Chinese support
- **Real-time Updates** - Live transaction status and gas prices
- **Dark/Light Theme** - Automatic theme detection with manual override
- **Internationalization** - Full support for English and Chinese languages
- **Real-time Updates** - Live transaction status and gas price tracking

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+ (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/sendora-org/sendora-next.git
cd sendora-next

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the application
pnpm build

# Preview production build
pnpm preview
```

## 🏗️ Tech Stack

- **Framework**: [SvelteKit 5](https://kit.svelte.dev/) with Svelte 5 runes
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with [shadcn-svelte](https://www.shadcn-svelte.com/)
- **Blockchain**: [viem](https://viem.sh/) for Ethereum interactions
- **Wallet Connection**: Custom providers with WalletConnect v2 support
- **Internationalization**: [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
- **Testing**: Vitest + Playwright

## 📖 Documentation

Comprehensive documentation is available in the `/docs` directory:

- [Getting Started Guide](/docs/getting-started)
- [API Reference](/docs/api-reference)
- [Tools Overview](/docs/tools-overview)
- [Examples](/docs/examples)

## 🐳 Docker Deployment

### Quick Server Setup

```bash
# One-click server setup
curl -fsSL https://raw.githubusercontent.com/yourusername/sendora/main/server-setup.sh | bash
```

### Build and Deploy

The system automatically builds Docker images on your server when you push code:

- `main` branch → Deploys to staging environment
- `prod` branch or tags → Deploys to production environment

### Local Development with Docker

```bash
# Build Docker image
docker build -t sendora:local .

# Run with docker-compose
docker compose up -d

# View logs
docker logs -f sendora
```

### Management Commands

```bash
# Check deployment status
sendora-manage status

# View application logs
sendora-manage logs

# Rollback to previous version
sendora-manage rollback

# List available versions
sendora-manage versions
```

See [Deployment Guide](.github/DEPLOYMENT.md) for detailed instructions.

## 🧪 Testing

```bash
# Run unit tests
pnpm test:unit

# Run E2E tests
pnpm test:e2e

# Run all tests
pnpm test
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- UI components from [shadcn-svelte](https://www.shadcn-svelte.com/)
- Blockchain interactions powered by [viem](https://viem.sh/)
- Icons from [Lucide](https://lucide.dev/)

## 📞 Support

- [Discord Community](https://discord.gg/YQp7fzv2G5)
- [GitHub Issues](https://github.com/sendora-org/sendora-next/issues)
- Email: garyshay@proton.me

---

<p align="center">
  Made with ❤️ by the Sendora Team
</p>
