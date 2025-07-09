// Injected wallet provider implementation | 注入式钱包提供者实现
import { BaseWalletProvider } from './base-provider';
import type { ConnectionState, EIP6963ProviderDetail, WalletInfo } from '../types';
import type { EthereumProvider } from '$lib/types/ethereum';

// Injected wallet provider class | 注入式钱包提供者类
export class InjectedWalletProvider extends BaseWalletProvider {
	// EIP-6963 provider detail | EIP-6963 提供者详情
	private providerDetail?: EIP6963ProviderDetail;

	constructor(
		provider: EthereumProvider,
		info?: WalletInfo,
		providerDetail?: EIP6963ProviderDetail
	) {
		super(
			info || {
				uuid: 'injected',
				name: 'Injected Wallet',
				icon: '/images/wallet-icons/browser.svg',
				type: 'injected'
			}
		);
		this.provider = provider;
		this.providerDetail = providerDetail;

		// Update info from EIP-6963 if available | 如果可用，从 EIP-6963 更新信息
		if (providerDetail?.info) {
			this.info = {
				uuid: providerDetail.info.uuid,
				name: providerDetail.info.name,
				icon: providerDetail.info.icon,
				description: providerDetail.info.rdns,
				type: 'injected'
			};
		}
	}

	// Connect wallet | 连接钱包
	async connect(): Promise<ConnectionState> {
		if (!this.provider) {
			throw new Error('No injected provider found');
		}

		try {
			// Request accounts | 请求账户
			const accounts = await this.provider.request({
				method: 'eth_requestAccounts'
			});

			// Get chain ID | 获取链 ID
			const chainId = await this.getChainId();

			const state: ConnectionState = {
				accounts: accounts as `0x${string}`[],
				chainId,
				connected: true,
				wallet: this.info,
				timestamp: Date.now()
			};

			return state;
		} catch (error) {
			console.error('Failed to connect:', error);
			throw error;
		}
	}

	// Disconnect wallet | 断开钱包连接
	async disconnect(): Promise<void> {
		// Injected wallets typically don't have a disconnect method | 注入式钱包通常没有断开连接方法
		// Just clean up listeners | 只需清理监听器
		this.cleanup();
	}

	// Static method to discover EIP-6963 wallets | 发现 EIP-6963 钱包的静态方法
	static async discoverWallets(): Promise<InjectedWalletProvider[]> {
		return new Promise((resolve) => {
			const wallets: InjectedWalletProvider[] = [];
			const timeout = setTimeout(() => resolve(wallets), 1000); // 1 second timeout | 1 秒超时

			// Listen for wallet announcements | 监听钱包通告
			const handleAnnouncement = (event: CustomEvent<EIP6963ProviderDetail>) => {
				const detail = event.detail;
				if (detail?.provider) {
					const provider = new InjectedWalletProvider(detail.provider, undefined, detail);
					wallets.push(provider);
				}
			};

			window.addEventListener('eip6963:announceProvider', handleAnnouncement as EventListener);

			// Request wallets to announce themselves | 请求钱包自我通告
			window.dispatchEvent(new Event('eip6963:requestProvider'));

			// Clean up after timeout | 超时后清理
			setTimeout(() => {
				window.removeEventListener('eip6963:announceProvider', handleAnnouncement as EventListener);
				clearTimeout(timeout);
				resolve(wallets);
			}, 500);
		});
	}

	// Static method to get legacy injected provider | 获取旧版注入式提供者的静态方法
	static getLegacyProvider(): InjectedWalletProvider | null {
		if (typeof window === 'undefined' || !window.ethereum) {
			return null;
		}

		// Detect specific wallets by their properties | 通过属性检测特定钱包
		let name = 'Browser Wallet';
		let icon = '/images/wallet-icons/browser.svg';

		if ((window.ethereum as { isMetaMask?: boolean }).isMetaMask) {
			name = 'MetaMask';
			icon = '/images/wallet-icons/metamask.svg';
		} else if ((window.ethereum as { isRabby?: boolean }).isRabby) {
			name = 'Rabby';
			icon = '/images/wallet-icons/rabby.svg';
		} else if ((window.ethereum as { isBraveWallet?: boolean }).isBraveWallet) {
			name = 'Brave Wallet';
			icon = '/images/wallet-icons/brave.svg';
		} else if ((window.ethereum as { isCoinbaseWallet?: boolean }).isCoinbaseWallet) {
			name = 'Coinbase Wallet';
			icon = '/images/wallet-icons/coinbase.svg';
		}

		return new InjectedWalletProvider(window.ethereum, {
			uuid: 'legacy-injected',
			name,
			icon,
			type: 'injected'
		});
	}
}

// Type already declared in $lib/types/ethereum.d.ts
