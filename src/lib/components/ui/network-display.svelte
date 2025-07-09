<script lang="ts">
	// Types | 类型
	import type { NetworkInfo } from '$lib/stores/networks';

	// Props | 属性
	let {
		network,
		showNoWalletNote = false,
		class: className = ''
	}: {
		network: NetworkInfo | null;
		showNoWalletNote?: boolean;
		class?: string;
	} = $props();
</script>

<div class={`space-y-2 ${className} `}>
	{#if network}
		<div class="flex items-center justify-center gap-2">
			<span class="text-sm font-medium">{network.name}</span>
			<span class="text-muted-foreground text-xs">{network.chainId}</span>
			{#if !network.isTestnet}
				<span
					class="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
				>
					Testnet
				</span>
			{/if}
		</div>
	{:else}
		<div class="text-muted-foreground text-sm">No network selected</div>
	{/if}

	{#if showNoWalletNote}
		<div class="text-xs text-blue-600 dark:text-blue-400">No wallet connection required</div>
	{/if}
</div>
