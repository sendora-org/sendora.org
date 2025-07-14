<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { callHistoryStorage, type CallHistoryItem } from '$lib/services/call-history-storage';
	import { formatDistanceToNow } from 'date-fns';
	import { HistoryIcon, Trash2Icon, XIcon } from '@lucide/svelte/icons';
	import { toast } from 'svelte-sonner';

	// Props | 属性
	let {
		functionSignature,
		contractAddress,
		contractName,
		onSelectParameters = () => {}
	}: {
		functionSignature: string;
		contractAddress: string;
		contractName?: string;
		onSelectParameters?: (params: Record<string, unknown>) => void;
	} = $props();

	// State | 状态
	let open = $state(false);
	let recentCalls = $state<CallHistoryItem[]>([]);

	// Load parameter history when sheet opens | 打开时加载参数历史
	$effect(() => {
		if (open && functionSignature && contractAddress) {
			// 获取该合约该函数的历史调用记录 | Get call history for this contract and function
			const allCalls = callHistoryStorage.getCallHistory();
			recentCalls = allCalls
				.filter(
					(call) =>
						call.contractAddress.toLowerCase() === contractAddress.toLowerCase() &&
						call.functionSignature === functionSignature
				)
				.slice(0, 20); // 最多显示20个历史记录 | Show max 20 history records
		}
	});

	// Use parameters from history | 使用历史参数
	function useParameters(call: CallHistoryItem) {
		if (!call.args || call.args.length === 0) return;

		// 将参数数组转换为对象格式 | Convert parameter array to object format
		const params: Record<string, unknown> = {};

		// 从 functionSignature 获取参数名 | Get parameter names from functionSignature
		const funcMatch = functionSignature.match(/\((.*?)\)/);
		if (funcMatch && funcMatch[1]) {
			// 解析参数定义 | Parse parameter definitions
			const paramDefs = funcMatch[1].split(',').map((p) => p.trim());

			call.args.forEach((arg: unknown, index: number) => {
				if (paramDefs[index]) {
					// 从参数定义中提取参数名 | Extract parameter name from definition
					const paramParts = paramDefs[index].split(' ');
					// 最后一个部分通常是参数名 | Last part is usually the parameter name
					const paramName = paramParts[paramParts.length - 1];
					params[paramName] = arg;
				} else {
					// 如果无法获取参数名，使用索引 | Use index if can't get parameter name
					params[`param${index}`] = arg;
				}
			});
		} else {
			// 如果无法解析函数签名，使用索引 | Use index if can't parse function signature
			call.args.forEach((arg: unknown, index: number) => {
				params[`param${index}`] = arg;
			});
		}

		onSelectParameters(params);
		open = false;
		toast.success('Parameters loaded from history');
	}

	// Clear parameter history for this function | 清除此函数的参数历史
	function clearParameterHistory() {
		if (functionSignature && contractAddress) {
			// 清除此函数的所有历史记录 | Clear all history for this function
			const allCalls = callHistoryStorage.getCallHistory();
			const filteredCalls = allCalls.filter(
				(call) =>
					!(
						call.contractAddress.toLowerCase() === contractAddress.toLowerCase() &&
						call.functionSignature === functionSignature
					)
			);

			// 保存过滤后的历史记录 | Save filtered history
			localStorage.setItem('sendora_call_history', JSON.stringify(filteredCalls));

			recentCalls = [];
			toast.success('Parameter history cleared');
		}
	}

	// Delete a specific history item | 删除特定的历史项
	function deleteHistoryItem(id: string) {
		callHistoryStorage.removeCallHistoryItem(id);
		// 更新显示列表 | Update display list
		recentCalls = recentCalls.filter((call) => call.id !== id);
		toast.success('History item removed');
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger>
		<Button size="sm" variant="outline" title="Load parameter history">
			<HistoryIcon class="h-4 w-4" />
		</Button>
	</Sheet.Trigger>

	<Sheet.Content class="w-full overflow-y-auto px-4 sm:w-[400px]">
		<Sheet.Header>
			<Sheet.Title>Parameter History</Sheet.Title>
			<Sheet.Description>
				{contractName ? `${contractName} - ` : ''}{functionSignature}
			</Sheet.Description>
		</Sheet.Header>

		<div class="mt-6 space-y-4">
			{#if recentCalls.length === 0}
				<p class="text-muted-foreground py-8 text-center">No parameter history found</p>
			{:else}
				{#each recentCalls as call (call.id)}
					<div class="space-y-2 rounded-lg border p-4">
						<div class="flex items-start justify-between">
							<div class="flex-1 space-y-2 overflow-hidden">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium">
										{formatDistanceToNow(call.timestamp, { addSuffix: true })}
									</span>
									{#if call.type === 'read'}
										<span
											class="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
										>
											Read
										</span>
									{:else}
										<span
											class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
										>
											Write
										</span>
									{/if}
								</div>

								<!-- Display parameters | 显示参数 -->
								{#if call.args && call.args.length > 0}
									<div class="space-y-1">
										<p class="text-sm font-medium">Parameters:</p>
										<div class="bg-muted overflow-x-auto rounded p-2 font-mono text-sm">
											<pre class="break-all whitespace-pre-wrap">{JSON.stringify(
													call.args,
													null,
													2
												)}</pre>
										</div>
									</div>
								{/if}

								<!-- Display error if failed | 显示错误（如果失败） -->
								{#if call.error}
									<div class="space-y-1">
										<p class="text-destructive text-sm font-medium">Error:</p>
										<div class="bg-destructive/10 text-destructive rounded p-2 text-sm">
											{call.error}
										</div>
									</div>
								{/if}
							</div>
							<!-- Delete button | 删除按钮 -->
							<Button
								size="icon"
								variant="ghost"
								class="h-8 w-8 shrink-0"
								onclick={() => deleteHistoryItem(call.id)}
								title="Delete this history item"
							>
								<XIcon class="h-4 w-4" />
							</Button>
						</div>

						<!-- Use parameters button | 使用参数按钮 -->
						<div class="flex justify-end">
							<Button
								size="sm"
								variant="outline"
								onclick={() => useParameters(call)}
								disabled={!call.args || call.args.length === 0}
							>
								Use Parameters
							</Button>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<Sheet.Footer class="mt-6">
			<Button variant="destructive" size="sm" onclick={clearParameterHistory}>
				<Trash2Icon class="mr-2 h-4 w-4" />
				Clear History
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
