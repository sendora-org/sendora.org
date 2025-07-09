// Coinbase wallet provider implementation | Coinbase 钱包提供者实现
import { createCoinbaseWalletSDK } from '@coinbase/wallet-sdk';
import { BaseWalletProvider } from './base-provider';
import type { ConnectionState, CoinbaseWalletOptions } from '../types';

// Coinbase wallet provider class | Coinbase 钱包提供者类
export class CoinbaseWalletProvider extends BaseWalletProvider {
	// Coinbase SDK instance | Coinbase SDK 实例
	private sdk: any;
	// Coinbase wallet options | Coinbase 钱包选项
	private options: CoinbaseWalletOptions;

	constructor(options: CoinbaseWalletOptions = {}) {
		super({
			uuid: 'coinbase',
			name: 'Coinbase Wallet',
			icon: '/images/wallet-icons/coinbase.svg',
			description: 'Connect via Coinbase Wallet',
			type: 'coinbase'
		});
		this.options = options;
		this.initializeSDK();
	}

	// Initialize Coinbase SDK | 初始化 Coinbase SDK
	private initializeSDK(): void {
		this.sdk = createCoinbaseWalletSDK({
			appName: this.options.appName || 'Sendora',
			appLogoUrl: this.options.appLogoUrl || 'https://sendora.app/logo.png',
			appChainIds: this.options.appChainIds || [1, 137, 8453], // Ethereum, Polygon, Base | 以太坊、Polygon、Base
			preference: { options: this.options.preference || 'all' }
		});
	}

	// Connect wallet | 连接钱包
	async connect(): Promise<ConnectionState> {
		try {
			// Create provider | 创建提供者
			this.provider = this.sdk.getProvider();

			// Request accounts | 请求账户
			const accounts = (await this.provider!.request({
				method: 'eth_requestAccounts'
			})) as `0x${string}`[];

			// Get chain ID | 获取链 ID
			const chainId = await this.getChainId();

			const state: ConnectionState = {
				accounts,
				chainId,
				connected: true,
				wallet: this.info,
				timestamp: Date.now()
			};

			return state;
		} catch (error) {
			console.error('Failed to connect Coinbase Wallet:', error);
			throw error;
		}
	}

	// Disconnect wallet | 断开钱包连接
	async disconnect(): Promise<void> {
		if (this.provider && typeof this.provider.disconnect === 'function') {
			await this.provider.disconnect();
		}
		this.cleanup();
		this.provider = null;
	}

	// Check if Coinbase Wallet extension is installed | 检查是否安装了 Coinbase 钱包扩展
	static isInstalled(): boolean {
		if (typeof window === 'undefined') return false;

		// Check for Coinbase Wallet browser extension | 检查 Coinbase 钱包浏览器扩展
		return !!((window.ethereum as any)?.isCoinbaseWallet || window.coinbaseWalletExtension);
	}

	// Get preference display name | 获取偏好显示名称
	getPreferenceDisplay(): string {
		switch (this.options.preference) {
			case 'smartWalletOnly':
				return 'Smart Wallet';
			case 'eoaOnly':
				return 'EOA Wallet';
			default:
				return 'All Wallets';
		}
	}
}

// Type declaration is already provided in src/lib/types/ethereum.d.ts | 类型声明已在 src/lib/types/ethereum.d.ts 中提供
