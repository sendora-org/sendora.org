<script lang="ts">
	import ToolsSidebar from '$lib/components/tools-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	import NetworkSelector from '$lib/components/network-selector.svelte';
	import WalletConnectButton from '$lib/components/wallet-connect-button.svelte';
	import { initializeNetworkUrlSync } from '$lib/stores/networks';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Initialize URL synchronization when component mounts | 组件挂载时初始化 URL 同步
	onMount(() => {
		const cleanup = initializeNetworkUrlSync();

		// Return cleanup function for onDestroy | 返回清理函数给 onDestroy
		return cleanup;
	});
</script>

<Sidebar.Provider>
	<ToolsSidebar />
	<Sidebar.Inset>
		<header
			class="border-foreground/10 flex h-16 shrink-0 items-center justify-between gap-2 border-b"
		>
			<div class="flex items-center gap-2 pl-4">
				<Sidebar.Trigger class="-ml-1" />
			</div>
			<!-- Network and wallet controls | 网络和钱包控制 -->
			<div class="flex items-center gap-1 pr-4">
				<NetworkSelector class="" />
				<WalletConnectButton />
			</div>
		</header>
		<main class="flex-1 p-4">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
