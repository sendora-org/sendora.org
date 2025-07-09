// WalletConnect provider implementation | WalletConnect 提供者实现
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { BaseWalletProvider } from './base-provider';
import type { ConnectionState, WalletConnectOptions } from '../types';
import type { Address } from 'viem';
import { availableNetworks } from '$lib/stores/networks';
import { get } from 'svelte/store';
import type { EthereumProvider as BaseEthereumProvider } from '$lib/types/ethereum';

// Extended type for WalletConnect provider | WalletConnect 提供者的扩展类型
interface WalletConnectEthereumProvider extends Omit<BaseEthereumProvider, 'chainId'> {
	// WalletConnect specific properties | WalletConnect 特定属性
	session?: any;
	accounts?: string[];
	chainId?: number; // WalletConnect uses number instead of string | WalletConnect 使用数字而非字符串
	removeAllListeners(event?: string): void;
}

// WalletConnect provider class | WalletConnect 提供者类
export class WalletConnectProvider extends BaseWalletProvider {
	// WalletConnect options | WalletConnect 选项
	private options: WalletConnectOptions;
	// QR code URI for connection | 连接用的二维码 URI
	private qrCodeUri?: string;
	// QR code callback | 二维码回调
	private qrCodeCallback?: (uri: string | undefined) => void;

	constructor(options: WalletConnectOptions = {}) {
		super({
			uuid: 'walletconnect',
			name: 'WalletConnect',
			icon: '/images/wallet-icons/walletconnect.svg',
			description: 'Connect via WalletConnect protocol',
			type: 'walletconnect'
		});
		this.options = options;
	}

	// Set QR code callback | 设置二维码回调
	setQrCodeCallback(callback: (uri: string | undefined) => void): void {
		this.qrCodeCallback = callback;
	}

	// Connect wallet | 连接钱包
	async connect(): Promise<ConnectionState> {
		try {
			// Get available chains from networks store | 从网络存储获取可用链
			const networks = get(availableNetworks);
			const chains = networks.map((n) => parseInt(n.chainId));

			// Build RPC map from available networks | 从可用网络构建 RPC 映射
			const rpcMap: Record<number, string> = {};
			networks.forEach((network) => {
				const chainId = parseInt(network.chainId);
				if (network.rpcURL) {
					rpcMap[chainId] = network.rpcURL;
				}
			});

			// Initialize WalletConnect provider | 初始化 WalletConnect 提供者
			const provider = await (EthereumProvider as any).init({
				// Type cast required for init method | init 方法需要类型转换
				projectId: this.options.projectId || 'a1fab8b3829c9cf8508dd3ca9ca13a42', // Default project ID | 默认项目 ID
				chains: chains.length > 0 ? chains : [1], // Default to mainnet if no chains | 如果没有链，默认主网
				showQrModal: this.options.showQrModal !== false, // Default to true | 默认为 true
				rpcMap: { ...rpcMap, ...this.options.rpcMap }, // Merge custom RPC URLs | 合并自定义 RPC URLs
				methods: [
					'eth_accounts',
					'eth_requestAccounts',
					'eth_chainId',
					'eth_sendTransaction',
					'eth_signTransaction',
					'eth_sign',
					'eth_signTypedData',
					'eth_signTypedData_v1',
					'eth_signTypedData_v3',
					'eth_signTypedData_v4',
					'personal_sign',
					'wallet_switchEthereumChain',
					'wallet_addEthereumChain',
					'wallet_getPermissions',
					'wallet_requestPermissions',
					'wallet_registerOnboarding',
					'wallet_watchAsset',
					'wallet_scanQRCode'
				],
				events: [
					'chainChanged',
					'accountsChanged',
					'connect',
					'disconnect',
					'message',
					'display_uri'
				]
			});

			this.provider = provider as unknown as BaseEthereumProvider;

			// Handle display URI for QR code | 处理二维码的显示 URI
			provider.on('display_uri', (uri: string) => {
				this.qrCodeUri = uri;
				if (this.qrCodeCallback) {
					this.qrCodeCallback(uri);
				}
			});

			// Handle session request events to prevent warnings | 处理会话请求事件以防止警告
			const sessionRequestHandler = (payload: any) => {
				console.log('WalletConnect session request:', payload);
			};
			provider.on('session_request', sessionRequestHandler);

			// Handle session request sent events | 处理会话请求发送事件
			const sessionRequestSentHandler = (payload: any) => {
				console.log('WalletConnect session request sent:', payload);
			};
			provider.on('session_request_sent', sessionRequestSentHandler);

			// If no existing session, connect | 如果没有现有会话，连接
			if (!provider.session) {
				await provider.connect();
			}

			// Get accounts and chain ID | 获取账户和链 ID
			console.log('🔍 WalletConnect: Getting accounts...');
			const accounts = await this.getAccounts();
			console.log('✅ WalletConnect: Got accounts:', accounts);

			console.log('🔍 WalletConnect: Getting chain ID...');
			const chainId = await this.getChainId();
			console.log('✅ WalletConnect: Got chain ID:', chainId);

			// Clear QR code | 清除二维码
			this.qrCodeUri = undefined;
			if (this.qrCodeCallback) {
				this.qrCodeCallback(undefined);
			}

			const state: ConnectionState = {
				accounts: accounts as Address[],
				chainId,
				connected: true,
				wallet: this.info,
				timestamp: Date.now()
			};

			console.log('🔗 WalletConnect: Creating connection state:', state);

			// Save connection options for restoration | 保存连接选项以便恢复
			this.saveOptions({
				...this.options,
				projectId: this.options.projectId || 'a1fab8b3829c9cf8508dd3ca9ca13a42'
			});

			// Ensure all synchronous operations are complete | 确保所有同步操作都已完成
			await new Promise((resolve) => setTimeout(resolve, 0));

			console.log('✅ WalletConnect: Connection completed, returning state');
			console.log('🚀 WalletConnect: About to return to wallet store...');
			console.log('🔍 WalletConnect: State object to return:', JSON.stringify(state));

			// Add artificial delay to ensure all operations complete | 添加人工延迟以确保所有操作完成
			await new Promise((resolve) => setTimeout(resolve, 100));
			console.log('🎯 WalletConnect: Final return statement executing...');

			return state;
		} catch (error) {
			// Clear QR code on error | 出错时清除二维码
			this.qrCodeUri = undefined;
			if (this.qrCodeCallback) {
				this.qrCodeCallback(undefined);
			}
			console.error('Failed to connect WalletConnect:', error);
			throw error;
		}
	}

	// Disconnect wallet | 断开钱包连接
	async disconnect(): Promise<void> {
		if (this.provider) {
			// Remove all event listeners before disconnecting | 断开前移除所有事件监听器
			try {
				// Remove session request event listeners | 移除会话请求事件监听器
				const wcProvider = this.provider as any;
				if (wcProvider && typeof wcProvider.removeAllListeners === 'function') {
					wcProvider.removeAllListeners('session_request');
					wcProvider.removeAllListeners('session_request_sent');
					wcProvider.removeAllListeners('display_uri');
					console.log('✅ WalletConnect: Event listeners removed');
				}
			} catch (error) {
				console.warn('Failed to remove some event listeners:', error);
			}

			// Disconnect if method exists | 如果方法存在则断开连接
			if (typeof this.provider.disconnect === 'function') {
				await this.provider.disconnect();
			}
		}

		this.cleanup();
		this.provider = null;
		// Clear saved options on explicit disconnect | 明确断开连接时清除保存的选项
		this.clearSavedOptions();
	}

	// Get current QR code URI | 获取当前二维码 URI
	getQrCodeUri(): string | undefined {
		return this.qrCodeUri;
	}

	// Check if provider has an active session | 检查提供者是否有活动会话
	hasSession(): boolean {
		return (this.provider as any)?.session ? true : false;
	}

	// Restore previous session if available | 如果可用，恢复之前的会话
	async restoreSession(): Promise<ConnectionState | null> {
		console.log('🔄 WalletConnect: Starting session restoration...');

		try {
			// Check if we already have a provider instance | 检查是否已经有提供者实例
			if (this.provider && (this.provider as any).session) {
				console.log('🔍 WalletConnect: Found existing provider with session');
				// Verify the session is still valid | 验证会话是否仍然有效
				try {
					const accounts = await this.getAccounts();
					const chainId = await this.getChainId();

					console.log('✅ WalletConnect: Existing session is valid', { accounts, chainId });

					// Setup event listeners if not already done | 如果尚未完成，设置事件监听器
					this.setupEventListeners();

					return {
						accounts: accounts as Address[],
						chainId,
						connected: true,
						wallet: this.info,
						timestamp: Date.now()
					};
				} catch (error) {
					console.warn('❌ WalletConnect: Existing session is invalid:', error);
					// Clear invalid session | 清除无效会话
					this.provider = null;
				}
			}

			// Check for existing WalletConnect sessions in localStorage | 检查 localStorage 中现有的 WalletConnect 会话
			console.log('🔍 WalletConnect: Checking localStorage for existing sessions...');
			this.logWalletConnectStorage();

			// Initialize provider to check for existing session | 初始化提供者以检查现有会话
			const networks = get(availableNetworks);
			const chains = networks.map((n) => parseInt(n.chainId));

			// Build RPC map from available networks | 从可用网络构建 RPC 映射
			const rpcMap: Record<number, string> = {};
			networks.forEach((network) => {
				const chainId = parseInt(network.chainId);
				if (network.rpcURL) {
					rpcMap[chainId] = network.rpcURL;
				}
			});

			// Get saved options if any | 获取保存的选项（如果有）
			const savedOptions = this.getSavedOptions();
			const initOptions = { ...this.options, ...savedOptions };

			console.log('🔧 WalletConnect: Initializing provider with options:', initOptions);

			const provider = await (EthereumProvider as any).init({
				projectId: initOptions.projectId || 'a1fab8b3829c9cf8508dd3ca9ca13a42',
				chains: chains.length > 0 ? chains : [1],
				showQrModal: false, // Don't show QR for session restore | 会话恢复时不显示二维码
				rpcMap: { ...rpcMap, ...initOptions.rpcMap },
				// Add metadata for better session persistence | 添加元数据以获得更好的会话持久性
				metadata: {
					name: 'Sendora',
					description: 'DeFi Tools Platform',
					url: typeof window !== 'undefined' ? window.location.origin : 'https://sendora.app',
					icons: [
						`${typeof window !== 'undefined' ? window.location.origin : 'https://sendora.app'}/favicon.ico`
					]
				}
			});

			console.log('🔍 WalletConnect: Provider initialized, checking session...', {
				hasSession: !!provider.session,
				session: provider.session
			});

			if (provider.session && provider.session.namespaces) {
				console.log('✅ WalletConnect: Found valid session');
				this.provider = provider as unknown as BaseEthereumProvider;

				// Wait for session to stabilize | 等待会话稳定
				await new Promise((resolve) => setTimeout(resolve, 200));

				// Setup event listeners | 设置事件监听器
				this.setupEventListeners();

				try {
					const accounts = await this.getAccounts();
					const chainId = await this.getChainId();

					console.log('✅ WalletConnect: Session restored successfully', { accounts, chainId });

					// Save current options for future restoration | 保存当前选项以供将来恢复
					this.saveOptions(initOptions);

					return {
						accounts: accounts as Address[],
						chainId,
						connected: true,
						wallet: this.info,
						timestamp: Date.now()
					};
				} catch (accountError) {
					console.error('❌ WalletConnect: Failed to get accounts/chainId:', accountError);
					// Even if we can't get accounts, the session exists, so try to use it | 即使无法获取账户，会话存在，尝试使用它
					return null;
				}
			}

			console.log('❌ WalletConnect: No valid session found');
			return null;
		} catch (error) {
			console.error('❌ WalletConnect: Failed to restore session:', error);
			// Clear any potentially corrupted state | 清除任何可能损坏的状态
			this.clearSavedOptions();
			return null;
		}
	}

	// Debug helper to log WalletConnect localStorage entries | 调试辅助函数，记录 WalletConnect localStorage 条目
	private logWalletConnectStorage(): void {
		if (typeof window === 'undefined') return;

		try {
			const wcKeys: string[] = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (
					key &&
					(key.startsWith('wc@2') || key.includes('walletconnect') || key.includes('WALLETCONNECT'))
				) {
					wcKeys.push(key);
				}
			}

			console.log('🔍 WalletConnect: Found localStorage keys:', wcKeys);

			// Log some session data if available | 如果可用，记录一些会话数据
			wcKeys.forEach((key) => {
				try {
					const value = localStorage.getItem(key);
					if (value) {
						const parsed = JSON.parse(value);
						console.log(`📄 WalletConnect: ${key}:`, parsed);
					}
				} catch (e) {
					console.log(`📄 WalletConnect: ${key}: (non-JSON data)`);
				}
			});
		} catch (error) {
			console.warn('Failed to debug WalletConnect storage:', error);
		}
	}

	// Save WalletConnect options to localStorage | 将 WalletConnect 选项保存到 localStorage
	private saveOptions(options: WalletConnectOptions): void {
		if (typeof window === 'undefined') return;

		try {
			const optionsToSave = {
				projectId: options.projectId,
				rpcMap: options.rpcMap,
				timestamp: Date.now()
			};
			localStorage.setItem('sendora_walletconnect_options', JSON.stringify(optionsToSave));
		} catch (error) {
			console.warn('Failed to save WalletConnect options:', error);
		}
	}

	// Get saved WalletConnect options from localStorage | 从 localStorage 获取保存的 WalletConnect 选项
	private getSavedOptions(): Partial<WalletConnectOptions> {
		if (typeof window === 'undefined') return {};

		try {
			const saved = localStorage.getItem('sendora_walletconnect_options');
			if (!saved) return {};

			const parsed = JSON.parse(saved);
			// Check if options are not too old (24 hours) | 检查选项是否不太旧（24 小时）
			if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
				this.clearSavedOptions();
				return {};
			}

			return {
				projectId: parsed.projectId,
				rpcMap: parsed.rpcMap
			};
		} catch (error) {
			console.warn('Failed to load saved WalletConnect options:', error);
			this.clearSavedOptions();
			return {};
		}
	}

	// Clear saved WalletConnect options | 清除保存的 WalletConnect 选项
	private clearSavedOptions(): void {
		if (typeof window === 'undefined') return;

		try {
			localStorage.removeItem('sendora_walletconnect_options');
		} catch (error) {
			console.warn('Failed to clear WalletConnect options:', error);
		}
	}

	// Override getAccounts for WalletConnect specific handling | 为 WalletConnect 特定处理覆盖 getAccounts
	async getAccounts(): Promise<Address[]> {
		if (!this.provider) {
			return [];
		}
		try {
			// WalletConnect provider has accounts property | WalletConnect 提供者有 accounts 属性
			const wcProvider = this.provider as any;
			if (wcProvider.accounts && Array.isArray(wcProvider.accounts)) {
				return wcProvider.accounts as Address[];
			}
			// Fallback to base implementation | 回退到基础实现
			return await super.getAccounts();
		} catch (error) {
			console.error('WalletConnect getAccounts error:', error);
			return [];
		}
	}

	// Override getChainId for WalletConnect specific handling | 为 WalletConnect 特定处理覆盖 getChainId
	async getChainId(): Promise<number> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}
		try {
			// WalletConnect provider has chainId property | WalletConnect 提供者有 chainId 属性
			const wcProvider = this.provider as any;
			if (typeof wcProvider.chainId === 'number') {
				return wcProvider.chainId;
			}
			// Fallback to base implementation | 回退到基础实现
			return await super.getChainId();
		} catch (error) {
			console.error('WalletConnect getChainId error:', error);
			throw error;
		}
	}

	// Setup event listeners for WalletConnect provider | 为 WalletConnect 提供者设置事件监听器
	setupEventListeners(): void {
		if (!this.provider) {
			console.warn('WalletConnect: Cannot setup event listeners, provider not initialized');
			return;
		}

		try {
			// Clean up existing listeners first | 首先清理现有监听器
			this.cleanup();

			// Listen for account changes | 监听账户变化
			const accountsChangedHandler = (...args: unknown[]) => {
				const accounts = args[0] as string[];
				console.log('WalletConnect: Accounts changed:', accounts);
			};
			this.provider.on('accountsChanged', accountsChangedHandler);
			this.listeners.push(() =>
				this.provider?.removeListener('accountsChanged', accountsChangedHandler)
			);

			// Listen for chain changes | 监听链变化
			const chainChangedHandler = (...args: unknown[]) => {
				const chainId = args[0] as string | number;
				const numericChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
				console.log('WalletConnect: Chain changed:', numericChainId);
			};
			this.provider.on('chainChanged', chainChangedHandler);
			this.listeners.push(() => this.provider?.removeListener('chainChanged', chainChangedHandler));

			// Listen for disconnect events | 监听断开连接事件
			const disconnectHandler = () => {
				console.log('WalletConnect: Disconnected');
			};
			this.provider.on('disconnect', disconnectHandler);
			this.listeners.push(() => this.provider?.removeListener('disconnect', disconnectHandler));

			console.log('✅ WalletConnect: Event listeners set up successfully');
		} catch (error) {
			console.error('❌ WalletConnect: Failed to setup event listeners:', error);
		}
	}
}
