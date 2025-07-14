<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button';
	import { callHistoryStorage, type ContractInfo } from '$lib/services/call-history-storage';
	import { formatDistanceToNow } from 'date-fns';
	import { HistoryIcon, Trash2Icon, XIcon } from '@lucide/svelte/icons';
	import { toast } from 'svelte-sonner';
	import type { Address, Abi } from 'viem';
	import { selectedNetwork } from '$lib/stores/networks';

	// Props | 属性
	let {
		onSelectContract = () => {}
	}: {
		onSelectContract?: (address: Address, abi: Abi, name?: string) => void;
	} = $props();

	// State | 状态
	let open = $state(false);
	let recentContracts = $state<ContractInfo[]>([]);

	// Load history when sheet opens | 打开时加载历史
	$effect(() => {
		if (open) {
			// 只显示当前网络的历史记录 | Only show current network history
			const currentChainId = $selectedNetwork?.chainId;
			if (currentChainId) {
				recentContracts = callHistoryStorage.getRecentContractsByChainId(Number(currentChainId), 5);
			} else {
				recentContracts = [];
			}
		}
	});

	// Clear all history | 清除所有历史
	function clearHistory() {
		callHistoryStorage.clearAllHistory();
		recentContracts = [];
		toast.success(m.callthis_clear_history());
	}

	// Use contract from history | 使用历史合约
	function useContract(contract: ContractInfo) {
		onSelectContract(contract.address, contract.abi, contract.name);
		open = false;
	}

	// Delete contract from history | 从历史中删除合约
	function deleteContract(contract: ContractInfo) {
		callHistoryStorage.removeContract(contract.address, contract.chainId);
		// 更新显示列表 | Update display list
		recentContracts = recentContracts.filter(
			(c) =>
				!(
					c.address.toLowerCase() === contract.address.toLowerCase() &&
					c.chainId === contract.chainId
				)
		);
		toast.success('Contract removed from history');
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger>
		<Button variant="outline" size="sm">
			<HistoryIcon class="mr-2 h-4 w-4" />
			{m.callthis_history()}
		</Button>
	</Sheet.Trigger>

	<Sheet.Content class="w-full overflow-y-auto px-4 sm:w-[400px]">
		<Sheet.Header>
			<Sheet.Title>{m.callthis_history()}</Sheet.Title>
		</Sheet.Header>

		<div class="mt-6">
			{#if recentContracts.length === 0}
				<p class="text-muted-foreground py-8 text-center">{m.callthis_no_history()}</p>
			{:else}
				{#each recentContracts as contract (contract.address + contract.chainId)}
					<div class="mb-4 space-y-2 rounded-lg border p-4">
						<div class="flex items-start justify-between">
							<div class="flex-1 space-y-1 overflow-hidden">
								{#if contract.name}
									<h4 class="font-medium">{contract.name}</h4>
								{/if}
								<p class="text-muted-foreground font-mono text-sm break-all">
									{contract.address}
								</p>
								<p class="text-muted-foreground text-xs">
									Chain ID: {contract.chainId} • {m.callthis_last_used()}: {formatDistanceToNow(
										contract.lastUsed,
										{ addSuffix: true }
									)}
								</p>
							</div>
							<!-- Delete button | 删除按钮 -->
							<Button
								size="icon"
								variant="ghost"
								class="h-8 w-8 shrink-0"
								onclick={() => deleteContract(contract)}
								title="Delete this contract"
							>
								<XIcon class="h-4 w-4" />
							</Button>
						</div>
						<!-- Use contract button | 使用合约按钮 -->
						<div class="flex justify-end">
							<Button size="sm" variant="outline" onclick={() => useContract(contract)}>
								{m.callthis_use_contract()}
							</Button>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<Sheet.Footer class="mt-6">
			<Button variant="destructive" size="sm" onclick={clearHistory}>
				<Trash2Icon class="mr-2 h-4 w-4" />
				{m.callthis_clear_history()}
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
