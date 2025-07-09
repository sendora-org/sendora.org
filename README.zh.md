# Sendora - Web3 开发者工具平台

[English](./README.md) | [中文](./README.zh.md)

<p align="center">
  <img src="./static/logo.svg" alt="Sendora Logo" width="120" height="120">
</p>

<p align="center">
  <strong>专业的 Web3 开发者工具，用于智能合约部署、交易广播和 DeFi 操作</strong>
</p>

<p align="center">
  <a href="https://sendora.org">在线演示</a> •
  <a href="/docs">文档</a> •
  <a href="https://discord.gg/YQp7fzv2G5">Discord</a>
</p>

## 🌟 概述

Sendora 是一个基于 SvelteKit 5 构建的综合性 Web3 开发者工具平台，为区块链开发者和 DeFi 爱好者提供专业级工具。该平台提供了一套完整的智能合约交互、交易管理和多链操作的必备工具。

## ✨ 核心功能

### 🛠️ 核心工具

- **部署合约（Deploy Contracts）** - 在多个 EVM 链上部署智能合约，支持构造函数参数
- **广播交易（Broadcast Transaction）** - 广播预签名交易，实时跟踪状态
- **签名工具（Signthis）** - 使用多种钱包提供商签署消息和交易
- **调用工具（Callthis）** - 与已部署的智能合约交互，包括读写操作

### 🔗 多链支持

- 以太坊主网和测试网
- Polygon（MATIC）
- BNB 智能链
- Arbitrum 和 Optimism
- Base
- 100+ EVM 兼容链

### 💼 钱包集成

- MetaMask
- WalletConnect v2
- Coinbase Wallet
- 注入式 Web3 提供商

### 🎨 用户体验

- **响应式设计** - 为桌面和移动设备优化
- **深色/浅色主题** - 自动主题检测，支持手动切换
- **国际化** - 完整支持中英文语言
- **实时更新** - 实时交易状态和 gas 价格跟踪

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+（推荐）或 npm

### 安装

```bash
# 克隆仓库
git clone https://github.com/sendora-org/sendora-next.git
cd sendora-next

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

应用程序将在 `http://localhost:5173` 上可用

### 生产构建

```bash
# 构建应用程序
pnpm build

# 预览生产构建
pnpm preview
```

## 🏗️ 技术栈

- **框架**：[SvelteKit 5](https://kit.svelte.dev/)，使用 Svelte 5 runes
- **样式**：[Tailwind CSS v4](https://tailwindcss.com/) 配合 [shadcn-svelte](https://www.shadcn-svelte.com/)
- **区块链**：[viem](https://viem.sh/) 用于以太坊交互
- **钱包连接**：自定义提供商，支持 WalletConnect v2
- **国际化**：[Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
- **测试**：Vitest + Playwright

## 📖 文档

完整的文档位于 `/docs` 目录：

- [入门指南](/docs/getting-started)
- [API 参考](/docs/api-reference)
- [工具概览](/docs/tools-overview)
- [示例](/docs/examples)

## 🧪 测试

```bash
# 运行单元测试
pnpm test:unit

# 运行端到端测试
pnpm test:e2e

# 运行所有测试
pnpm test
```

## 🤝 贡献

我们欢迎贡献！请查看我们的[贡献指南](CONTRIBUTING.md)了解详情。

1. Fork 本仓库
2. 创建您的功能分支（`git checkout -b feature/amazing-feature`）
3. 提交您的更改（`git commit -m 'feat: 添加惊人功能'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 开启一个 Pull Request

## 📄 许可证

本项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 使用 [SvelteKit](https://kit.svelte.dev/) 构建
- UI 组件来自 [shadcn-svelte](https://www.shadcn-svelte.com/)
- 区块链交互由 [viem](https://viem.sh/) 提供支持
- 图标来自 [Lucide](https://lucide.dev/)

## 📞 支持

- [Discord 社区](https://discord.gg/YQp7fzv2G5)
- [GitHub Issues](https://github.com/sendora-org/sendora-next/issues)
- 邮箱：garyshay@proton.me

---

<p align="center">
  由 Sendora 团队用 ❤️ 制作
</p>
