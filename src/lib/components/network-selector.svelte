<!-- Network selector component with search, logo display, and network management | 网络选择器组件，支持搜索、logo 显示和网络管理 -->
<script lang="ts">
	import { ChevronDown, Plus, Search, Settings, Trash2, AlertCircle } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import * as m from '$lib/paraglide/messages.js';
	import {
		availableNetworks,
		selectedNetwork,
		selectNetwork,
		removeCustomNetwork,
		isBuiltInNetwork,
		type NetworkInfo
	} from '$lib/stores/networks';
	import NetworkForm from './network-form.svelte';
	import { get } from 'svelte/store';

	// Component props | 组件属性
	interface Props {
		/** Show testnet networks | 是否显示测试网络 */
		showTestnets?: boolean;
		/** Custom class for styling | 自定义样式类名 */
		class?: string;
	}

	let { showTestnets = true, class: className = '' }: Props = $props();

	// Local state | 本地状态
	let searchQuery = $state('');
	let showNetworkForm = $state(false);
	let editingNetwork = $state<NetworkInfo | null>(null);
	let dropdownOpen = $state(false);
	let switchError = $state<string | null>(null);
	let showErrorAlert = $state(false);

	// Filtered networks based on search query and testnet preference | 根据搜索查询和测试网偏好过滤网络
	let filteredNetworks = $derived.by(() => {
		let networks = $availableNetworks;

		// Filter by testnet preference | 根据测试网偏好过滤
		if (!showTestnets) {
			networks = networks.filter((n: NetworkInfo) => !n.isTestnet);
		}

		// Filter by search query | 根据搜索查询过滤
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			networks = networks.filter(
				(n: NetworkInfo) =>
					n.name.toLowerCase().includes(query) ||
					n.symbol.toLowerCase().includes(query) ||
					n.chainId.includes(query)
			);
		}

		return networks;
	});

	// Handle network selection | 处理网络选择
	async function handleNetworkSelect(network: NetworkInfo) {
		const previousNetwork = get(selectedNetwork);
		selectNetwork(network);
		dropdownOpen = false;

		// Clear any previous errors | 清除之前的错误
		switchError = null;
		showErrorAlert = false;

		// Switch wallet to the selected network if connected | 如果已连接，切换钱包到选定网络
		// const { isConnected, switchChain } = await import('$lib/stores/wallet.js');
		// if (get(isConnected)) {
		// 	try {
		// 		await switchChain(parseInt(network.chainId));
		// 		console.log(`✅ Successfully switched to ${network.name} (Chain ID: ${network.chainId})`);
		// 	} catch (error: any) {
		// 		console.error('Failed to switch network:', error);

		// 		// Determine error type and show appropriate message | 确定错误类型并显示相应消息
		// 		let errorMessage = '';

		// 		if (error?.code === 4902) {
		// 			// Network not found in wallet - wallet doesn't support this network | 钱包中未找到网络 - 钱包不支持此网络
		// 			errorMessage = m.network_switch_unsupported();
		// 		} else if (error?.code === 4001) {
		// 			// User rejected the request | 用户拒绝了请求
		// 			errorMessage = 'Network switch was cancelled by user';
		// 		} else {
		// 			// Generic error | 通用错误
		// 			errorMessage = `${m.network_switch_error()}: ${error?.message || m.network_switch_generic_error()}`;
		// 		}

		// 		switchError = errorMessage;
		// 		showErrorAlert = true;

		// 		// Auto-hide error after 8 seconds | 8 秒后自动隐藏错误
		// 		setTimeout(() => {
		// 			showErrorAlert = false;
		// 			setTimeout(() => {
		// 				switchError = null;
		// 			}, 300); // Wait for fade out animation | 等待淡出动画
		// 		}, 8000);
		// 	}
		// }
	}

	// Handle network edit | 处理网络编辑
	function handleNetworkEdit(network: NetworkInfo) {
		editingNetwork = network;
		showNetworkForm = true;
		dropdownOpen = false;
	}

	// Handle network delete | 处理网络删除
	function handleNetworkDelete(network: NetworkInfo) {
		if (isBuiltInNetwork(network.chainId)) {
			return; // Cannot delete built-in networks | 无法删除内置网络
		}

		removeCustomNetwork(network.chainId);
		dropdownOpen = false;
	}

	// Handle add new network | 处理添加新网络
	function handleAddNetwork() {
		editingNetwork = null;
		showNetworkForm = true;
		dropdownOpen = false;
	}

	// Handle form close | 处理表单关闭
	function handleFormClose() {
		showNetworkForm = false;
		editingNetwork = null;
	}

	// Handle form save | 处理表单保存
	function handleFormSave(network: NetworkInfo) {
		// Form already handles the save operation, we just need to close the form | 表单已经处理保存操作，我们只需要关闭表单
		handleFormClose();
	}

	// Handle switching from add to edit mode | 处理从添加切换到编辑模式
	function handleSwitchToEdit(network: NetworkInfo) {
		// Set the network to edit | 设置要编辑的网络
		editingNetwork = network;
		// Keep the form open | 保持表单打开
		showNetworkForm = true;
	}

	// Get network logo path | 获取网络 logo 路径
	function getNetworkLogo(network: NetworkInfo): string {
		return `/chain-logo/evm_${network.chainId}.png`;
	}

	// Handle logo error | 处理 logo 加载错误
	function handleLogoError(event: Event) {
		const img = event.target as HTMLImageElement;
		img.src = '/chain-logo/unknown.png';
	}
</script>

<!-- Network selector dropdown | 网络选择器下拉菜单 -->
<DropdownMenu.Root bind:open={dropdownOpen}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" class="h-9 justify-between {className}">
				{#if $selectedNetwork}
					<!-- Selected network display | 选中网络显示 -->
					<div class="flex items-center gap-2">
						<img
							src={getNetworkLogo($selectedNetwork)}
							alt={$selectedNetwork.name}
							class="h-5 w-5 rounded-full"
							onerror={handleLogoError}
						/>
						<span class="hidden font-medium sm:block">{$selectedNetwork.name}</span>
					</div>
				{:else}
					<span class="text-muted-foreground">{m.network_selector_title()}</span>
				{/if}
				<ChevronDown class="h-4 w-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="start" class="w-[var(--radix-dropdown-menu-trigger-width)]">
		<!-- Search input | 搜索输入框 -->
		<div class="p-2">
			<div class="relative">
				<Search class="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
				<Input placeholder={m.network_selector_search()} bind:value={searchQuery} class="pl-8" />
			</div>
		</div>

		<Separator />

		<!-- Network list | 网络列表 -->
		<div
			class="[&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
		>
			{#each filteredNetworks as network (network.chainId)}
				<div class="group relative">
					<!-- Network item | 网络项 -->
					<DropdownMenu.Item
						class="flex cursor-pointer items-center gap-3 p-3"
						onclick={() => handleNetworkSelect(network)}
					>
						<img
							src={getNetworkLogo(network)}
							alt={network.name}
							class="h-6 w-6 flex-shrink-0 rounded-full"
							onerror={handleLogoError}
						/>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="truncate font-medium">{network.name}</span>
								{#if network.isTestnet}
									<Badge variant="secondary" class="text-xs">Testnet</Badge>
								{/if}
								{#if isBuiltInNetwork(network.chainId)}
									<Badge variant="outline" class="text-xs">{m.network_selector_built_in()}</Badge>
								{/if}
							</div>
							<div class="text-muted-foreground flex items-center gap-2 text-sm">
								<span>{network.symbol}</span>
								<span>•</span>
								<span>ID: {network.chainId}</span>
							</div>
						</div>

						<!-- Network actions | 网络操作 -->
						<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<Button
								variant="ghost"
								size="sm"
								class="h-6 w-6 p-0"
								onclick={(e) => {
									e.stopPropagation();
									handleNetworkEdit(network);
								}}
							>
								<Settings class="h-3 w-3" />
							</Button>
							{#if !isBuiltInNetwork(network.chainId)}
								<Button
									variant="ghost"
									size="sm"
									class="text-destructive hover:text-destructive h-6 w-6 p-0"
									onclick={(e) => {
										e.stopPropagation();
										handleNetworkDelete(network);
									}}
								>
									<Trash2 class="h-3 w-3" />
								</Button>
							{/if}
						</div>
					</DropdownMenu.Item>
				</div>
			{/each}

			{#if filteredNetworks.length === 0}
				<div class="text-muted-foreground p-6 text-center text-sm">No networks found</div>
			{/if}
		</div>

		<Separator />

		<!-- Add network button | 添加网络按钮 -->
		<DropdownMenu.Item
			class="flex cursor-pointer items-center gap-2 p-3"
			onclick={handleAddNetwork}
		>
			<Plus class="h-4 w-4" />
			<span>{m.network_selector_add_network()}</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- Network switching error alert | 网络切换错误提醒 -->
{#if showErrorAlert && switchError}
	<div class="fixed right-4 bottom-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
		<Alert variant="destructive" class="animate-in slide-in-from-bottom-2 fade-in-0 duration-300">
			<AlertCircle class="h-4 w-4" />
			<AlertDescription class="pr-2">
				{switchError}
				<Button
					variant="ghost"
					size="sm"
					class="ml-2 h-auto p-1 text-xs underline hover:no-underline"
					onclick={() => {
						showErrorAlert = false;
						setTimeout(() => {
							switchError = null;
						}, 300);
					}}
				>
					Dismiss
				</Button>
			</AlertDescription>
		</Alert>
	</div>
{/if}

<!-- Network form sheet | 网络表单页面 -->
<Sheet.Root bind:open={showNetworkForm}>
	<Sheet.Content side="right" class="w-[400px]">
		<Sheet.Header>
			<Sheet.Title>
				{editingNetwork ? m.network_selector_edit_network() : m.network_selector_add_network()}
			</Sheet.Title>
		</Sheet.Header>

		<NetworkForm
			network={editingNetwork}
			onclose={handleFormClose}
			onsave={handleFormSave}
			onswitchtoedit={handleSwitchToEdit}
		/>
	</Sheet.Content>
</Sheet.Root>
