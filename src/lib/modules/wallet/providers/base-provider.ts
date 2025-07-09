// Base wallet provider implementation | 基础钱包提供者实现
import {
	createPublicClient,
	createWalletClient,
	custom,
	http,
	type Address,
	type Chain,
	type PublicClient,
	type WalletClient
} from 'viem';
import type { ConnectionState, WalletInfo, WalletProvider } from '../types';
import type { EthereumProvider } from '$lib/types/ethereum';
import { availableNetworks } from '$lib/stores/networks';
import { get } from 'svelte/store';

// Base wallet provider class | 基础钱包提供者类
export abstract class BaseWalletProvider implements WalletProvider {
	// Provider instance | 提供者实例
	protected provider: EthereumProvider | null = null;
	// Wallet info | 钱包信息
	protected info: WalletInfo;
	// Event listener cleanup functions | 事件监听清理函数
	protected listeners: (() => void)[] = [];

	constructor(info: WalletInfo) {
		this.info = info;
	}

	// Get provider info | 获取提供者信息
	getInfo(): WalletInfo {
		return this.info;
	}

	// Abstract methods to be implemented by subclasses | 需要子类实现的抽象方法
	abstract connect(): Promise<ConnectionState>;
	abstract disconnect(): Promise<void>;

	// Get current accounts | 获取当前账户
	async getAccounts(): Promise<Address[]> {
		if (!this.provider) {
			return [];
		}
		try {
			const accounts = await this.provider.request({ method: 'eth_accounts' });
			return accounts as Address[];
		} catch (error) {
			console.error('Error getting accounts:', error);
			return [];
		}
	}

	// Get current chain ID | 获取当前链 ID
	async getChainId(): Promise<number> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}
		try {
			const chainId = await this.provider.request({ method: 'eth_chainId' });
			return parseInt(chainId as string, 16);
		} catch (error) {
			console.error('Error getting chain ID:', error);
			throw error;
		}
	}

	// Switch to a different chain | 切换到不同的链
	async switchChain(chainId: number): Promise<void> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}
		try {
			await this.provider.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: `0x${chainId.toString(16)}` }]
			});
		} catch (error: any) {
			// If chain doesn't exist, try to add it | 如果链不存在，尝试添加它
			if (error.code === 4902) {
				const networks = get(availableNetworks);
				const network = networks.find((n) => parseInt(n.chainId) === chainId);
				if (network) {
					await this.addChain(network);
				} else {
					throw new Error(`Chain ${chainId} not found in available networks`);
				}
			} else {
				throw error;
			}
		}
	}

	// Add a new chain to the wallet | 向钱包添加新链
	protected async addChain(network: any): Promise<void> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}
		await this.provider.request({
			method: 'wallet_addEthereumChain',
			params: [
				{
					chainId: `0x${parseInt(network.chainId).toString(16)}`,
					chainName: network.name,
					nativeCurrency: {
						name: network.symbol,
						symbol: network.symbol,
						decimals: 18
					},
					rpcUrls: network.rpcURLs || [network.rpcURL],
					blockExplorerUrls: network.explorerURL ? [network.explorerURL] : []
				}
			]
		});
	}

	// Get chain configuration | 获取链配置
	protected getChainConfig(chainId?: number): Chain | undefined {
		if (!chainId) return undefined;
		const networks = get(availableNetworks);
		const network = networks.find((n) => parseInt(n.chainId) === chainId);
		if (!network) return undefined;

		return {
			id: chainId,
			name: network.name,
			nativeCurrency: {
				name: network.symbol,
				symbol: network.symbol,
				decimals: 18
			},
			rpcUrls: {
				default: {
					http: network.rpcURLs || [network.rpcURL]
				}
			},
			blockExplorers: network.explorerURL
				? {
						default: {
							name: 'Explorer',
							url: network.explorerURL
						}
					}
				: undefined
		} as Chain;
	}

	// Get public client for reading blockchain data | 获取用于读取区块链数据的公共客户端
	getPublicClient(chain?: Chain): PublicClient {
		const chainConfig = chain || this.getChainConfig();
		if (chainConfig) {
			return createPublicClient({
				chain: chainConfig,
				transport: http()
			});
		}
		// Fallback to provider transport | 回退到提供者传输
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}
		return createPublicClient({
			transport: custom(this.provider)
		});
	}

	// Get wallet client for transactions | 获取用于交易的钱包客户端
	async getWalletClient(chain?: Chain): Promise<WalletClient> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}
		// Get current chain ID if no chain is provided | 如果没有提供链配置，获取当前链 ID
		let chainConfig = chain;
		if (!chainConfig) {
			try {
				const currentChainId = await this.getChainId();
				chainConfig = this.getChainConfig(currentChainId);
			} catch (error) {
				console.warn('Failed to get current chain ID for wallet client', error);
				// Continue without chain config - viem will use the provider's chain
			}
		}
		const accounts = await this.getAccounts();
		if (accounts.length === 0) {
			throw new Error('No accounts connected');
		}
		return createWalletClient({
			account: accounts[0],
			chain: chainConfig,
			transport: custom(this.provider)
		});
	}

	// Subscribe to account changes | 订阅账户变化
	onAccountsChanged(callback: (accounts: Address[]) => void): () => void {
		if (!this.provider) {
			return () => {};
		}
		const handler = (...args: unknown[]) => {
			const accounts = args[0] as string[];
			callback(accounts as Address[]);
		};
		this.provider.on('accountsChanged', handler);
		const cleanup = () => this.provider?.removeListener('accountsChanged', handler);
		this.listeners.push(cleanup);
		return cleanup;
	}

	// Subscribe to chain changes | 订阅链变化
	onChainChanged(callback: (chainId: number) => void): () => void {
		if (!this.provider) {
			return () => {};
		}
		const handler = (chainId: unknown) => {
			if (typeof chainId === 'string') {
				callback(parseInt(chainId, 16));
			}
		};
		this.provider.on('chainChanged', handler);
		const cleanup = () => this.provider?.removeListener('chainChanged', handler);
		this.listeners.push(cleanup);
		return cleanup;
	}

	// Subscribe to disconnect events | 订阅断开连接事件
	onDisconnect(callback: () => void): () => void {
		if (!this.provider) {
			return () => {};
		}
		this.provider.on('disconnect', callback);
		const cleanup = () => this.provider?.removeListener('disconnect', callback);
		this.listeners.push(cleanup);
		return cleanup;
	}

	// Clean up all event listeners | 清理所有事件监听器
	protected cleanup(): void {
		this.listeners.forEach((cleanup) => cleanup());
		this.listeners = [];
	}
}
