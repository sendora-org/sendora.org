<!-- Wallet account details component | 钱包账户详情组件 -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Copy, ExternalLink, Loader2, RefreshCw } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as m from '$lib/paraglide/messages.js';
	import {
		currentAccount,
		connectedWallet,
		currentChainId,
		currentProvider
	} from '$lib/stores/wallet';
	import { selectedNetwork } from '$lib/stores/networks.js';
	import { formatEther } from 'viem';
	import { get } from 'svelte/store';
	// import SubscriptionNFTDisplay from '$lib/components/wallet/SubscriptionNFTDisplay.svelte';

	// Component props | 组件属性
	interface Props {
		onclose?: () => void;
	}

	let { onclose }: Props = $props();

	// Local state | 本地状态
	let balance = $state<string | null>(null);
	let loading = $state(true);
	let refreshing = $state(false);
	let copied = $state(false);

	// Format address for display | 格式化地址用于显示
	function formatAddress(address: string): string {
		if (!address) return '';
		return `${address.slice(0, 10)}...${address.slice(-8)}`;
	}

	// Load account balance | 加载账户余额
	async function loadBalance() {
		if (!$currentAccount || !$currentProvider) return;

		try {
			loading = true;
			const publicClient = $currentProvider.getPublicClient();
			const balanceWei = await publicClient.getBalance({ address: $currentAccount });
			balance = formatEther(balanceWei);
		} catch (error) {
			console.error('Failed to load balance:', error);
			balance = null;
		} finally {
			loading = false;
		}
	}

	// Refresh balance | 刷新余额
	async function refreshBalance() {
		refreshing = true;
		await loadBalance();
		refreshing = false;
	}

	// Copy address to clipboard | 复制地址到剪贴板
	async function copyAddress() {
		if (!$currentAccount) return;

		try {
			await navigator.clipboard.writeText($currentAccount);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (error) {
			console.error('Failed to copy address:', error);
		}
	}

	// Open address in explorer | 在浏览器中打开地址
	function openInExplorer() {
		if ($currentAccount && $selectedNetwork?.explorerURL) {
			const explorerUrl = `${$selectedNetwork.explorerURL}/address/${$currentAccount}`;
			window.open(explorerUrl, '_blank');
		}
	}

	// Load balance on mount and when account changes | 挂载时和账户变化时加载余额
	onMount(() => {
		loadBalance();
	});

	// Reload balance when account or chain changes | 账户或链变化时重新加载余额
	$effect(() => {
		if ($currentAccount && $currentChainId) {
			loadBalance();
		}
	});
</script>

<div class="space-y-6 p-6">
	{#if $connectedWallet && $currentAccount}
		<!-- Wallet info | 钱包信息 -->
		<div class="flex items-center gap-3">
			<img src={$connectedWallet.icon} alt={$connectedWallet.name} class="h-12 w-12 rounded-full" />
			<div>
				<h3 class="font-semibold">{$connectedWallet.name}</h3>
				<p class="text-muted-foreground text-sm">{$connectedWallet.type}</p>
			</div>
		</div>

		<Separator />

		<!-- Account address | 账户地址 -->
		<div class="space-y-2">
			<div class="text-sm font-medium">{m.wallet_address()}</div>
			<div class="flex items-center gap-2">
				<code class="bg-muted flex-1 rounded px-3 py-2 text-sm">
					{formatAddress($currentAccount)}
				</code>
				<Button variant="ghost" size="icon" onclick={copyAddress}>
					<Copy class="h-4 w-4" />
				</Button>
				{#if $selectedNetwork?.explorerURL}
					<Button variant="ghost" size="icon" onclick={openInExplorer}>
						<ExternalLink class="h-4 w-4" />
					</Button>
				{/if}
			</div>
			{#if copied}
				<p class="text-muted-foreground text-xs">{m.wallet_address_copied()}</p>
			{/if}
		</div>

		<!-- Network info | 网络信息 -->
		<div class="space-y-2">
			<div class="text-sm font-medium">{m.wallet_network()}</div>
			<div class="flex items-center gap-2">
				{#if $selectedNetwork}
					<img
						src={$selectedNetwork.avatar || `/chain-logo/evm_${$selectedNetwork.chainId}.png`}
						alt={$selectedNetwork.name}
						class="h-6 w-6 rounded-full"
						onerror={(e) => ((e.currentTarget as HTMLImageElement).src = '/chain-logo/unknown.png')}
					/>
					<span class="font-medium">{$selectedNetwork.name}</span>
					{#if $selectedNetwork.isTestnet}
						<Badge variant="secondary" class="text-xs">Testnet</Badge>
					{/if}
					<span class="text-muted-foreground text-sm">
						(Chain ID: {$currentChainId})
					</span>
				{/if}
			</div>
		</div>

		<!-- Balance | 余额 -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<div class="text-sm font-medium">{m.wallet_balance()}</div>
				<Button
					variant="ghost"
					size="sm"
					onclick={refreshBalance}
					disabled={refreshing}
					class="h-8 gap-1 px-2"
				>
					<RefreshCw class={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
					{m.refresh()}
				</Button>
			</div>
			<div class="bg-muted rounded px-3 py-2">
				{#if loading}
					<div class="flex items-center gap-2">
						<Loader2 class="h-4 w-4 animate-spin" />
						<span class="text-muted-foreground text-sm">{m.loading()}</span>
					</div>
				{:else if balance !== null}
					<div class="flex items-center justify-between">
						<span class="text-lg font-semibold">{balance}</span>
						<span class="text-muted-foreground text-sm">
							{$selectedNetwork?.symbol || 'ETH'}
						</span>
					</div>
				{:else}
					<span class="text-muted-foreground text-sm">{m.wallet_balance_error()}</span>
				{/if}
			</div>
		</div>

		<Separator />

		<!-- Subscription Plans | 订阅计划 -->
		<div class="space-y-2">
			<!-- <label class="text-sm font-medium">{m.subscription_display_title()}</label> -->
			<!-- <SubscriptionNFTDisplay userAddress={$currentAccount} /> -->
		</div>
	{:else}
		<p class="text-muted-foreground text-center">{m.wallet_not_connected()}</p>
	{/if}

	<!-- Close button | 关闭按钮 -->
	<div class="border-t pt-6">
		<Button variant="outline" class="w-full" onclick={onclose}>
			{m.close()}
		</Button>
	</div>
</div>
