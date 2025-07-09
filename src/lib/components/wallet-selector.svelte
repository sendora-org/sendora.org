<!-- Wallet selector component | 钱包选择器组件 -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Loader2, AlertCircle, QrCode } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as m from '$lib/paraglide/messages.js';
	import { availableWallets, connectWallet, discoverWallets } from '$lib/stores/wallet.js';
	import type { WalletInfo } from '$lib/modules/wallet/types';
	import WalletQRCode from './wallet-qrcode.svelte';

	// Component props | 组件属性
	interface Props {
		onconnect?: () => void;
		oncancel?: () => void;
	}

	let { onconnect, oncancel }: Props = $props();

	// Local state | 本地状态
	let loading = $state(false);
	let error = $state<string | null>(null);
	let connectingWallet = $state<WalletInfo | null>(null);
	let showQRCode = $state(false);
	let qrCodeUri = $state<string | undefined>(undefined);

	// Refresh wallet list on mount | 挂载时刷新钱包列表
	onMount(() => {
		discoverWallets();
	});

	// Group wallets by type | 按类型分组钱包
	let groupedWallets = $derived.by(() => {
		const wallets = $availableWallets;
		const injected = wallets.filter((w) => w.type === 'injected');
		const walletconnect = wallets.filter((w) => w.type === 'walletconnect');
		const coinbase = wallets.filter((w) => w.type === 'coinbase');

		return { injected, walletconnect, coinbase };
	});

	// Handle wallet selection | 处理钱包选择
	async function handleWalletSelect(wallet: WalletInfo) {
		loading = true;
		error = null;
		connectingWallet = wallet;

		// Track wallet connection initiated | 跟踪钱包连接开始
		const startTime = Date.now();

		try {
			// Special handling for WalletConnect | WalletConnect 的特殊处理
			if (wallet.type === 'walletconnect') {
				// Set up QR code callback before connecting | 连接前设置二维码回调
				showQRCode = true;

				const options = {
					walletconnect: {
						showQrModal: false, // We'll show our own QR code | 我们将显示自己的二维码
						projectId: '82de9b28b665d7e644540021561bc212' // Default project ID | 默认项目 ID
					},
					qrCodeCallback: (uri: string | undefined) => {
						qrCodeUri = uri;
						if (!uri) {
							showQRCode = false;
						}
					}
				};

				// Use the store's connectWallet function to ensure proper state management | 使用存储的 connectWallet 函数确保正确的状态管理
				await connectWallet(wallet, options);
			} else {
				// For other wallet types | 对于其他钱包类型
				await connectWallet(wallet);
			}

			// Success - emit connect event | 成功 - 触发连接事件
			const connectionTime = Date.now() - startTime;
			onconnect?.();
		} catch (err: any) {
			console.error('Failed to connect wallet:', err);
			error = err.message || m.wallet_connect_error();
			showQRCode = false;
			qrCodeUri = undefined;
		} finally {
			loading = false;
			connectingWallet = null;
		}
	}

	// Handle QR code close | 处理二维码关闭
	function handleQRCodeClose() {
		showQRCode = false;
		qrCodeUri = undefined;
		loading = false;
		connectingWallet = null;
	}
</script>

<div class="space-y-6 p-6">
	{#if error}
		<!-- Error message | 错误消息 -->
		<Alert variant="destructive">
			<AlertCircle class="h-4 w-4" />
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if showQRCode && qrCodeUri}
		<!-- QR Code display | 二维码显示 -->
		<WalletQRCode uri={qrCodeUri} onclose={handleQRCodeClose} />
	{:else}
		<!-- Wallet list | 钱包列表 -->
		<div class="space-y-6">
			{#if groupedWallets.injected.length > 0}
				<!-- Browser wallets | 浏览器钱包 -->
				<div>
					<h3 class="text-muted-foreground mb-3 text-sm font-medium">
						{m.wallet_browser_wallets()}
					</h3>
					<div class="space-y-2">
						{#each groupedWallets.injected as wallet}
							<Button
								variant="outline"
								class="h-auto w-full justify-start gap-3 p-3"
								onclick={() => handleWalletSelect(wallet)}
								disabled={loading}
							>
								{#if loading && connectingWallet?.uuid === wallet.uuid}
									<Loader2 class="h-5 w-5 animate-spin" />
								{:else}
									<img src={wallet.icon} alt={wallet.name} class="h-5 w-5 rounded-full" />
								{/if}
								<div class="flex-1 text-left">
									<div class="font-medium">{wallet.name}</div>
									{#if wallet.description}
										<div class="text-muted-foreground text-xs">{wallet.description}</div>
									{/if}
								</div>
							</Button>
						{/each}
					</div>
				</div>
			{/if}

			{#if groupedWallets.injected.length > 0 && (groupedWallets.walletconnect.length > 0 || groupedWallets.coinbase.length > 0)}
				<Separator />
			{/if}

			<!-- Other wallet options | 其他钱包选项 -->
			<div>
				{#if groupedWallets.injected.length === 0}
					<h3 class="text-muted-foreground mb-3 text-sm font-medium">
						{m.wallet_connect_options()}
					</h3>
				{:else}
					<h3 class="text-muted-foreground mb-3 text-sm font-medium">
						{m.wallet_other_options()}
					</h3>
				{/if}

				<div class="space-y-2">
					{#each [...groupedWallets.walletconnect, ...groupedWallets.coinbase] as wallet}
						<Button
							variant="outline"
							class="h-auto w-full justify-start gap-3 p-3"
							onclick={() => handleWalletSelect(wallet)}
							disabled={loading}
						>
							{#if loading && connectingWallet?.uuid === wallet.uuid}
								<Loader2 class="h-5 w-5 animate-spin" />
							{:else if wallet.type === 'walletconnect'}
								<img src={wallet.icon} alt={wallet.name} class="h-5 w-5 rounded-full" />
							{:else}
								<img src={wallet.icon} alt={wallet.name} class="h-5 w-5 rounded-full" />
							{/if}
							<div class="flex-1 text-left">
								<div class="font-medium">{wallet.name}</div>
								{#if wallet.description}
									<div class="text-muted-foreground text-xs">{wallet.description}</div>
								{/if}
							</div>
						</Button>
					{/each}
				</div>
			</div>

			{#if $availableWallets.length === 0}
				<!-- No wallets found | 未找到钱包 -->
				<div class="py-8 text-center">
					<p class="text-muted-foreground text-sm">{m.wallet_no_wallets_found()}</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Cancel button | 取消按钮 -->
	<div class="border-t pt-6">
		<Button variant="ghost" class="w-full" onclick={oncancel} disabled={loading}>
			{m.cancel()}
		</Button>
	</div>
</div>
