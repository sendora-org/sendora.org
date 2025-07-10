// Wallet connection store and management | 钱包连接存储和管理
import { writable, derived, get } from 'svelte/store';
import type { ConnectionState, WalletInfo, WalletProvider } from '$lib/modules/wallet/types';
import { InjectedWalletProvider } from '$lib/modules/wallet/providers/injected-provider';
import { WalletConnectProvider } from '$lib/modules/wallet/providers/walletconnect-provider';
import { CoinbaseWalletProvider } from '$lib/modules/wallet/providers/coinbase-provider';
import { browser } from '$app/environment';

// Connection state store | 连接状态存储
export const connectionState = writable<ConnectionState>({
	accounts: [],
	chainId: 1,
	connected: false
});

// Current provider store | 当前提供者存储
export const currentProvider = writable<WalletProvider | null>(null);

// Available wallets store | 可用钱包存储
export const availableWallets = writable<WalletInfo[]>([]);

// Derived stores | 派生存储
export const isConnected = derived(connectionState, ($state) => $state.connected);
export const currentAccount = derived(connectionState, ($state) => $state.accounts[0] || null);
export const currentChainId = derived(connectionState, ($state) => $state.chainId);
export const connectedWallet = derived(connectionState, ($state) => $state.wallet || null);

// Local storage key | 本地存储键
const STORAGE_KEY = 'sendora_wallet_connection';

// Save connection state to localStorage | 保存连接状态到 localStorage
function saveConnectionState(state: ConnectionState): void {
	if (!browser) return;
	try {
		console.log('💾 Saving wallet connection state:', state);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		console.log('✅ Wallet connection state saved successfully');

		// Verify it was saved | 验证是否已保存
		const saved = localStorage.getItem(STORAGE_KEY);
		console.log('🔍 Verification - saved state:', saved ? JSON.parse(saved) : null);
	} catch (error) {
		console.error('❌ Failed to save connection state:', error);
	}
}

// Load connection state from localStorage | 从 localStorage 加载连接状态
function loadConnectionState(): ConnectionState | null {
	if (!browser) return null;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			return JSON.parse(saved);
		}
	} catch (error) {
		console.error('Failed to load connection state:', error);
	}
	return null;
}

// Clear connection state from localStorage | 从 localStorage 清除连接状态
function clearConnectionState(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (error) {
		console.error('Failed to clear connection state:', error);
	}
}

// Discover available wallets | 发现可用钱包
export async function discoverWallets(): Promise<void> {
	if (!browser) return;

	const wallets: WalletInfo[] = [];

	// Always add WalletConnect | 始终添加 WalletConnect
	wallets.push({
		uuid: 'walletconnect',
		name: 'WalletConnect',
		icon: '/images/wallet-icons/walletconnect.svg',
		description: 'Connect via WalletConnect protocol',
		type: 'walletconnect'
	});

	// Always add Coinbase Wallet | 始终添加 Coinbase 钱包
	wallets.push({
		uuid: 'coinbase',
		name: 'Coinbase Wallet',
		icon: '/images/wallet-icons/coinbase.svg',
		description: 'Connect via Coinbase Wallet',
		type: 'coinbase'
	});

	// Discover EIP-6963 wallets | 发现 EIP-6963 钱包
	const injectedProviders = await InjectedWalletProvider.discoverWallets();
	injectedProviders.forEach((provider) => {
		wallets.push(provider.getInfo());
	});

	// Check for legacy injected wallet if no EIP-6963 wallets found | 如果没有发现 EIP-6963 钱包，检查旧版注入式钱包
	if (injectedProviders.length === 0) {
		const legacyProvider = InjectedWalletProvider.getLegacyProvider();
		if (legacyProvider) {
			wallets.push(legacyProvider.getInfo());
		}
	}

	availableWallets.set(wallets);
}

// Connect to a wallet | 连接钱包
export async function connectWallet(
	walletInfo: WalletInfo,
	options?: {
		walletconnect?: unknown;
		coinbase?: unknown;
		qrCodeCallback?: (uri: string | undefined) => void;
	}
): Promise<void> {
	console.log('🚀 STORE: connectWallet function called with:', walletInfo);
	console.log('🚀 STORE: Options:', options);

	try {
		console.log('🚀 STORE: Inside try block, creating provider...');
		let provider: WalletProvider;

		// Create provider based on wallet type | 根据钱包类型创建提供者
		switch (walletInfo.type) {
			case 'injected': {
				// Find the provider from discovered wallets | 从发现的钱包中找到提供者
				const injectedProviders = await InjectedWalletProvider.discoverWallets();
				const injectedProvider = injectedProviders.find(
					(p) => p.getInfo().uuid === walletInfo.uuid
				);
				if (injectedProvider) {
					provider = injectedProvider;
				} else {
					// Fallback to legacy provider | 回退到旧版提供者
					const legacyProvider = InjectedWalletProvider.getLegacyProvider();
					if (!legacyProvider) {
						throw new Error('No injected wallet found');
					}
					provider = legacyProvider;
				}
				break;
			}

			case 'walletconnect': {
				const wcProvider = new WalletConnectProvider(options?.walletconnect || {});
				// Set up QR code callback if provided in options | 如果选项中提供了二维码回调，则设置
				if (options?.qrCodeCallback && typeof wcProvider.setQrCodeCallback === 'function') {
					wcProvider.setQrCodeCallback(options.qrCodeCallback);
				}
				provider = wcProvider;
				break;
			}

			case 'coinbase': {
				const cbProvider = new CoinbaseWalletProvider(options?.coinbase || {});
				provider = cbProvider;
				break;
			}

			default:
				throw new Error(`Unknown wallet type: ${walletInfo.type}`);
		}

		// Connect to the wallet | 连接钱包
		console.log(`🔗 Attempting to connect to ${walletInfo.type} wallet...`);

		let state: ConnectionState;
		try {
			console.log(`⏳ ${walletInfo.type}: Calling provider.connect()...`);
			state = await provider.connect();

			console.log(`✅ ${walletInfo.type} wallet connected successfully:`, state);
		} catch (connectError) {
			console.error(`❌ ${walletInfo.type} wallet connection failed:`, connectError);
			throw connectError;
		}

		// Validate state object | 验证状态对象
		if (!state || !state.accounts || state.accounts.length === 0) {
			console.error('❌ Invalid connection state returned:', state);
			throw new Error('Invalid connection state: no accounts found');
		}

		// Update stores | 更新存储
		try {
			connectionState.set(state);
			currentProvider.set(provider);
			console.log('📊 Stores updated with new connection state');
		} catch (storeError) {
			console.error('❌ Failed to update stores:', storeError);
			throw storeError;
		}

		// Save connection state | 保存连接状态
		try {
			console.log('💾 About to save connection state...');
			saveConnectionState(state);
		} catch (saveError) {
			console.error('❌ Failed to save connection state:', saveError);
			// Don't throw here, connection is still valid | 这里不抛出异常，连接仍然有效
		}

		// Set up event listeners | 设置事件监听器
		try {
			setupEventListeners(provider);
			console.log('🎧 Event listeners set up successfully');
		} catch (listenerError) {
			console.error('❌ Failed to set up event listeners:', listenerError);
			// Don't throw here, connection is still valid | 这里不抛出异常，连接仍然有效
		}

		console.log('🎉 Wallet connection process completed successfully!');

		// Try to switch to currently selected network after successful connection | 连接成功后尝试切换到当前选择的网络
		trySwitchToSelectedNetwork();
	} catch (error) {
		console.error('🚀 STORE: Failed to connect wallet - caught error:', error);
		console.error(
			'🚀 STORE: Error stack:',
			error instanceof Error ? error.stack : 'No stack trace'
		);
		throw error;
	} finally {
		console.log('🚀 STORE: connectWallet function completed (finally block)');
	}
}

// Disconnect current wallet | 断开当前钱包连接
export async function disconnectWallet(): Promise<void> {
	const provider = get(currentProvider);
	if (provider) {
		try {
			await provider.disconnect();
		} catch (error) {
			console.error('Error disconnecting wallet:', error);
		}
	}

	// Reset stores | 重置存储
	connectionState.set({
		accounts: [],
		chainId: 1,
		connected: false
	});
	currentProvider.set(null);

	// Clear saved state | 清除保存的状态
	clearConnectionState();
}

// Switch to a different chain | 切换到不同的链
export async function switchChain(chainId: number): Promise<void> {
	const provider = get(currentProvider);
	if (!provider) {
		throw new Error('No wallet connected');
	}

	await provider.switchChain(chainId);

	// Update chain ID in state | 更新状态中的链 ID
	connectionState.update((state) => ({
		...state,
		chainId
	}));

	// Update saved state | 更新保存的状态
	const state = get(connectionState);
	if (state.connected) {
		saveConnectionState(state);
	}
}

// Set up event listeners for wallet events | 为钱包事件设置事件监听器
function setupEventListeners(provider: WalletProvider): void {
	// Listen for account changes | 监听账户变化
	provider.onAccountsChanged((accounts) => {
		connectionState.update((state) => ({
			...state,
			accounts
		}));

		// If no accounts, disconnect | 如果没有账户，断开连接
		if (accounts.length === 0) {
			disconnectWallet();
		} else {
			// Update saved state | 更新保存的状态
			const state = get(connectionState);
			if (state.connected) {
				saveConnectionState(state);
			}
		}
	});

	// Listen for chain changes | 监听链变化
	provider.onChainChanged((chainId) => {
		connectionState.update((state) => ({
			...state,
			chainId
		}));

		// Update saved state | 更新保存的状态
		const state = get(connectionState);
		if (state.connected) {
			saveConnectionState(state);
		}
	});

	// Listen for disconnect events | 监听断开连接事件
	provider.onDisconnect(() => {
		disconnectWallet();
	});
}

// Try to switch to currently selected network after wallet connection | 钱包连接后尝试切换到当前选择的网络
async function trySwitchToSelectedNetwork(): Promise<void> {
	try {
		// Import selectedNetwork to avoid circular dependency | 导入 selectedNetwork 以避免循环依赖
		const { selectedNetwork } = await import('$lib/stores/networks.js');
		const { get } = await import('svelte/store');

		const currentNetwork = get(selectedNetwork);
		if (currentNetwork) {
			const targetChainId = parseInt(currentNetwork.chainId);
			const currentState = get(connectionState);

			// Only switch if we're not already on the target network | 只有在不在目标网络时才切换
			if (currentState.chainId !== targetChainId) {
				console.log(
					`🔄 Attempting to switch wallet to selected network: ${currentNetwork.name} (Chain ID: ${targetChainId})`
				);
				await switchChain(targetChainId);
				console.log(`✅ Successfully switched wallet to ${currentNetwork.name}`);
			}
		}
	} catch (error) {
		// Don't fail on network switch errors | 网络切换错误时不要失败
		console.warn('Failed to switch to selected network after wallet restoration:', error);
	}
}

// Restore connection on app load | 应用加载时恢复连接
export async function restoreConnection(): Promise<void> {
	if (!browser) return;

	const savedState = loadConnectionState();
	console.log('🔄 Attempting to restore connection, saved state:', savedState);

	if (!savedState || !savedState.connected || !savedState.wallet) {
		console.log('❌ No valid saved connection state found');
		return;
	}

	// Check if connection is still recent (within 24 hours) | 检查连接是否仍然是最近的（24 小时内）
	if (savedState.timestamp && Date.now() - savedState.timestamp > 24 * 60 * 60 * 1000) {
		console.log('⏰ Saved connection state expired, clearing');
		clearConnectionState();
		return;
	}

	console.log(`🔧 Restoring ${savedState.wallet.type} wallet connection...`);

	try {
		// Try to restore connection based on wallet type | 尝试根据钱包类型恢复连接
		if (savedState.wallet.type === 'walletconnect') {
			// WalletConnect requires special handling for session restoration | WalletConnect 需要特殊处理会话恢复
			console.log('🔗 Starting WalletConnect session restoration...');

			// Set a loading state to show restoration in progress | 设置加载状态以显示恢复进行中
			connectionState.set({
				...savedState,
				connected: false // Temporarily set to false during restoration | 恢复期间暂时设置为 false
			});

			const provider = new WalletConnectProvider();

			// Try restoration with longer timeout | 带更长超时的恢复尝试
			const restorePromise = provider.restoreSession();
			const timeoutPromise = new Promise<null>((_, reject) =>
				setTimeout(() => reject(new Error('WalletConnect restoration timeout')), 15000)
			);

			try {
				const state = await Promise.race([restorePromise, timeoutPromise]);
				if (state && state.accounts && state.accounts.length > 0) {
					console.log('✅ WalletConnect session restored successfully:', state);
					connectionState.set(state);
					currentProvider.set(provider);
					setupEventListeners(provider);

					// Update saved state with new timestamp | 用新时间戳更新保存的状态
					saveConnectionState(state);

					// Try to switch to currently selected network | 尝试切换到当前选择的网络
					trySwitchToSelectedNetwork();
				} else {
					console.log('❌ No valid WalletConnect session to restore, clearing saved state');
					clearConnectionState();
					connectionState.set({
						accounts: [],
						chainId: 1,
						connected: false
					});
				}
			} catch (restoreError) {
				console.warn('❌ WalletConnect session restoration failed:', restoreError);
				// Clear the saved state if restoration fails | 如果恢复失败则清除保存的状态
				clearConnectionState();
				connectionState.set({
					accounts: [],
					chainId: 1,
					connected: false
				});
			}
		} else {
			// For other wallet types, try to connect again | 对于其他钱包类型，尝试重新连接
			console.log(`🔧 Restoring ${savedState.wallet.type} wallet...`);
			await connectWallet(savedState.wallet);

			// Try to switch to currently selected network after successful restoration | 恢复成功后尝试切换到当前选择的网络
			trySwitchToSelectedNetwork();
		}
	} catch (error) {
		console.error('❌ Failed to restore wallet connection:', error);
		clearConnectionState();
		connectionState.set({
			accounts: [],
			chainId: 1,
			connected: false
		});
	}
}

// Initialize wallet discovery on app load | 应用加载时初始化钱包发现
if (browser) {
	// Run wallet discovery immediately | 立即运行钱包发现
	discoverWallets();

	// Delay connection restoration to ensure all providers are ready | 延迟连接恢复以确保所有提供者都准备就绪
	setTimeout(() => {
		restoreConnection();
	}, 500);
}
