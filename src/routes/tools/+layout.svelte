<script lang="ts">
	import ToolsSidebar from '$lib/components/tools-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	import NetworkSelector from '$lib/components/network-selector.svelte';
	// import WalletConnectButton from '$lib/components/wallet-connect-button.svelte';

	let { children } = $props();
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
				<!-- <WalletConnectButton /> -->
			</div>
		</header>
		<main class="flex-1 p-4">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
