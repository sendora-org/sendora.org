<!-- Wallet connect button component | 钱包连接按钮组件 -->
<script lang="ts">
	import {
		Wallet,
		ChevronDown,
		Copy,
		ExternalLink,
		LogOut,
		Users,
		Crown,
		Zap
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as m from '$lib/paraglide/messages.js';
	import {
		isConnected,
		currentAccount,
		connectedWallet,
		disconnectWallet
	} from '$lib/stores/wallet.js';
	import { selectedNetwork } from '$lib/stores/networks.js';
	import { currentProvider } from '$lib/stores/wallet.js';
	import { get } from 'svelte/store';
	import WalletSelector from './wallet-selector.svelte';
	import WalletAccount from './wallet-account.svelte';
	// import ReferralProgram from './wallet/ReferralProgram.svelte';
	import { getUserSubscription, PlanTier } from '$lib/modules/contracts/subscription-contract';

	// Component props | 组件属性
	interface Props {
		/** Custom class for styling | 自定义样式类名 */
		class?: string;
		/** Variant of the button | 按钮变体 */
		variant?: 'default' | 'outline' | 'ghost' | 'secondary';
		/** Size of the button | 按钮大小 */
		size?: 'default' | 'sm' | 'lg' | 'icon';
	}

	let { class: className = '', variant = 'outline', size = 'default' }: Props = $props();

	// Local state | 本地状态
	let showWalletSelector = $state(false);
	let showAccountInfo = $state(false);
	let showReferralProgram = $state(false);
	let dropdownOpen = $state(false);

	// User status state | 用户状态
	let userStatus = $state<{
		hasValidSubscription: boolean;
		hasSendoraNFT: boolean;
		subscriptionTier: PlanTier | null;
	}>({
		hasValidSubscription: false,
		hasSendoraNFT: false,
		subscriptionTier: null
	});
	let statusLoading = $state(false);

	// Format address for display | 格式化地址用于显示
	function formatAddress(address: string): string {
		if (!address) return '';
		return `${address.slice(0, 4)}...${address.slice(-4)}`;
	}

	// Copy address to clipboard | 复制地址到剪贴板
	async function copyAddress() {
		if ($currentAccount) {
			try {
				await navigator.clipboard.writeText($currentAccount);
				// TODO: Show toast notification | 显示提示通知
			} catch (error) {
				console.error('Failed to copy address:', error);
			}
		}
	}

	// Open address in explorer | 在浏览器中打开地址
	function openInExplorer() {
		if ($currentAccount && $selectedNetwork?.explorerURL) {
			const explorerUrl = `${$selectedNetwork.explorerURL}/address/${$currentAccount}`;
			window.open(explorerUrl, '_blank');
		}
	}

	// Handle disconnect | 处理断开连接
	async function handleDisconnect() {
		dropdownOpen = false;
		await disconnectWallet();
	}

	// Handle connect click | 处理连接点击
	function handleConnectClick() {
		showWalletSelector = true;
	}

	// Handle account info click | 处理账户信息点击
	function handleAccountClick() {
		dropdownOpen = false;
		showAccountInfo = true;
	}

	// Handle referral program click | 处理推荐计划点击
	function handleReferralClick() {
		dropdownOpen = false;
		showReferralProgram = true;
	}

	// Check user status when account changes | 账户变化时检查用户状态
	$effect(() => {
		if ($currentAccount && $isConnected) {
			// 异步检查用户状态 | Async check user status
			(async () => {
				statusLoading = true;
				try {
					const provider = get(currentProvider);
					if (provider && $currentAccount) {
						const status = await getUserSubscription($currentAccount);
						userStatus = status;
					}
				} catch (error) {
					console.error('Failed to check user status:', error);
					userStatus = {
						hasValidSubscription: false,
						hasSendoraNFT: false,
						subscriptionTier: null
					};
				} finally {
					statusLoading = false;
				}
			})();
		} else {
			userStatus = { hasValidSubscription: false, hasSendoraNFT: false, subscriptionTier: null };
			statusLoading = false;
		}
	});

	$effect(() => {
		console.log({ userStatus });
	});
</script>

{#if $isConnected && $currentAccount}
	<!-- Connected state | 已连接状态 -->
	<DropdownMenu.Root bind:open={dropdownOpen}>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} {variant} {size} class="gap-2 {className}">
					{#if $connectedWallet?.icon}
						<img
							src={$connectedWallet.icon}
							alt={$connectedWallet.name}
							class="h-4 w-4 rounded-full"
						/>
					{:else}
						<Wallet class="h-4 w-4" />
					{/if}
					<span>{formatAddress($currentAccount)}</span>
					<ChevronDown class="h-4 w-4 opacity-50" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Content align="end" class="w-64">
			<!-- Wallet info | 钱包信息 -->
			<div class="px-2 py-1.5">
				<div class="flex items-center gap-2">
					{#if $connectedWallet}
						<img
							src={$connectedWallet.icon}
							alt={$connectedWallet.name}
							class="h-6 w-6 rounded-full"
						/>
						<div class="flex-1">
							<div class="flex items-center justify-between">
								<p class="text-sm font-medium">{$connectedWallet.name}</p>
								<!-- Status badge | 状态徽章 -->
								{#if !statusLoading && (userStatus.hasSendoraNFT || userStatus.hasValidSubscription)}
									{#if userStatus.hasSendoraNFT}
										<div class="flex items-center gap-1">
											<Crown class="h-3 w-3 text-yellow-500" />
											<Badge
												variant="secondary"
												class="bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700"
											>
												{m.status_genesis()}
											</Badge>
										</div>
									{:else if userStatus.hasValidSubscription && userStatus.subscriptionTier}
										{#if userStatus.subscriptionTier === PlanTier.PRO || userStatus.subscriptionTier === PlanTier.ULTIMATE}
											<div class="flex items-center gap-1">
												<Zap class="h-3 w-3 text-green-500" />
												<Badge
													variant="secondary"
													class="bg-green-100 px-1.5 py-0.5 text-xs text-green-700"
												>
													{m.status_pro()}
												</Badge>
											</div>
										{:else if userStatus.subscriptionTier === PlanTier.BASIC}
											<div class="flex items-center gap-1">
												<Zap class="h-3 w-3 text-blue-500" />
												<Badge
													variant="secondary"
													class="bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700"
												>
													{m.status_basic()}
												</Badge>
											</div>
										{/if}
									{/if}
								{/if}
							</div>
							<p class="text-muted-foreground text-xs">{formatAddress($currentAccount)}</p>
						</div>
					{/if}
				</div>
			</div>

			<DropdownMenu.Separator />

			<!-- Actions | 操作 -->
			<DropdownMenu.Item onclick={handleAccountClick} class="gap-2">
				<Wallet class="h-4 w-4" />
				{m.wallet_account_details()}
			</DropdownMenu.Item>

			<DropdownMenu.Item onclick={copyAddress} class="gap-2">
				<Copy class="h-4 w-4" />
				{m.wallet_copy_address()}
			</DropdownMenu.Item>

			<DropdownMenu.Item onclick={handleReferralClick} class="gap-2">
				<Users class="h-4 w-4" />
				{m.referral_program_title()}
			</DropdownMenu.Item>

			{#if $selectedNetwork?.explorerURL}
				<DropdownMenu.Item onclick={openInExplorer} class="gap-2">
					<ExternalLink class="h-4 w-4" />
					{m.wallet_view_explorer()}
				</DropdownMenu.Item>
			{/if}

			<DropdownMenu.Separator />

			<!-- Disconnect | 断开连接 -->
			<DropdownMenu.Item onclick={handleDisconnect} class="text-destructive gap-2">
				<LogOut class="h-4 w-4" />
				{m.wallet_disconnect()}
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<!-- Disconnected state | 未连接状态 -->
	<Button {variant} {size} class="gap-2 {className}" onclick={handleConnectClick}>
		<Wallet class="h-4 w-4" />
		{m.wallet_connect()}
	</Button>
{/if}

<!-- Wallet selector sheet | 钱包选择器弹窗 -->
<Sheet.Root bind:open={showWalletSelector}>
	<Sheet.Content side="right" class="flex max-h-screen w-[400px] flex-col p-0">
		<Sheet.Header class="flex-shrink-0 px-6 pt-6">
			<Sheet.Title>{m.wallet_connect_title()}</Sheet.Title>
			<Sheet.Description>{m.wallet_connect_description()}</Sheet.Description>
		</Sheet.Header>

		<div class="flex-1 overflow-y-auto">
			<WalletSelector
				onconnect={() => (showWalletSelector = false)}
				oncancel={() => (showWalletSelector = false)}
			/>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Account info sheet | 账户信息弹窗 -->
<Sheet.Root bind:open={showAccountInfo}>
	<Sheet.Content side="right" class="flex max-h-screen w-[400px] flex-col p-0">
		<Sheet.Header class="flex-shrink-0 px-6 pt-6">
			<Sheet.Title>{m.wallet_account_title()}</Sheet.Title>
		</Sheet.Header>

		<div class="flex-1 overflow-y-auto">
			<WalletAccount onclose={() => (showAccountInfo = false)} />
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Referral program sheet | 推荐计划弹窗 -->
<Sheet.Root bind:open={showReferralProgram}>
	<Sheet.Content side="right" class="flex max-h-screen w-[400px] flex-col p-0">
		<Sheet.Header class="flex-shrink-0 px-6 pt-6">
			<Sheet.Title>{m.referral_program_title()}</Sheet.Title>
			<Sheet.Description>{m.referral_program_description()}</Sheet.Description>
		</Sheet.Header>

		<div class="flex-1 overflow-y-auto px-6 pb-6">
			<!-- <ReferralProgram userAddress={$currentAccount} /> -->
		</div>

		<!-- Close button | 关闭按钮 -->
		<div class="flex-shrink-0 border-t px-6 py-4">
			<Button variant="outline" class="w-full" onclick={() => (showReferralProgram = false)}>
				{m.close()}
			</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>
