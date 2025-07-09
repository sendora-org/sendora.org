// Wallet types and interfaces | 钱包类型和接口定义
import type { Address, Chain, PublicClient, WalletClient } from 'viem';

// Wallet provider types | 钱包提供者类型
export type WalletType = 'injected' | 'walletconnect' | 'coinbase';

// Wallet info interface | 钱包信息接口
export interface WalletInfo {
	// Wallet unique identifier | 钱包唯一标识符
	uuid: string;
	// Wallet display name | 钱包显示名称
	name: string;
	// Wallet icon URL | 钱包图标 URL
	icon: string;
	// Wallet description | 钱包描述
	description?: string;
	// Wallet type | 钱包类型
	type: WalletType;
}

// Connection state interface | 连接状态接口
export interface ConnectionState {
	// Connected account addresses | 已连接的账户地址
	accounts: Address[];
	// Current chain ID | 当前链 ID
	chainId: number;
	// Connection status | 连接状态
	connected: boolean;
	// Connected wallet info | 已连接的钱包信息
	wallet?: WalletInfo;
	// Connection timestamp | 连接时间戳
	timestamp?: number;
}

// Wallet provider interface | 钱包提供者接口
export interface WalletProvider {
	// Get provider info | 获取提供者信息
	getInfo(): WalletInfo;
	// Connect wallet | 连接钱包
	connect(): Promise<ConnectionState>;
	// Disconnect wallet | 断开钱包连接
	disconnect(): Promise<void>;
	// Get current accounts | 获取当前账户
	getAccounts(): Promise<Address[]>;
	// Get current chain ID | 获取当前链 ID
	getChainId(): Promise<number>;
	// Switch to a different chain | 切换到不同的链
	switchChain(chainId: number): Promise<void>;
	// Get public client for reading blockchain data | 获取用于读取区块链数据的公共客户端
	getPublicClient(chain?: Chain): PublicClient;
	// Get wallet client for transactions | 获取用于交易的钱包客户端
	getWalletClient(chain?: Chain): Promise<WalletClient>;
	// Subscribe to account changes | 订阅账户变化
	onAccountsChanged(callback: (accounts: Address[]) => void): () => void;
	// Subscribe to chain changes | 订阅链变化
	onChainChanged(callback: (chainId: number) => void): () => void;
	// Subscribe to disconnect events | 订阅断开连接事件
	onDisconnect(callback: () => void): () => void;
}

// EIP-6963 provider announcement event | EIP-6963 提供者通告事件
export interface EIP6963ProviderDetail {
	// Provider info | 提供者信息
	info: {
		uuid: string;
		name: string;
		icon: string;
		rdns: string;
	};
	// EIP-1193 provider | EIP-1193 提供者
	provider: any;
}

// Wallet connection options | 钱包连接选项
export interface WalletConnectOptions {
	// WalletConnect project ID | WalletConnect 项目 ID
	projectId?: string;
	// Show QR modal | 显示二维码弹窗
	showQrModal?: boolean;
	// Custom RPC URLs | 自定义 RPC URLs
	rpcMap?: Record<number, string>;
}

// Coinbase wallet options | Coinbase 钱包选项
export interface CoinbaseWalletOptions {
	// App name | 应用名称
	appName?: string;
	// App logo URL | 应用 logo URL
	appLogoUrl?: string;
	// Supported chain IDs | 支持的链 ID
	appChainIds?: number[];
	// Wallet preference | 钱包偏好
	preference?: 'all' | 'smartWalletOnly' | 'eoaOnly';
}
