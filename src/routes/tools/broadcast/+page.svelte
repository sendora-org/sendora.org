<script lang="ts">
	// SvelteKit imports | SvelteKit 导入
	import * as m from '$lib/paraglide/messages.js';

	// Component imports | 组件导入
	import ToolPageLayout from '$lib/components/tool-page-layout.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import HelpSection from '$lib/components/ui/help-section.svelte';
	import ErrorResult from '$lib/components/ui/error-result.svelte';
	import SuccessResult from '$lib/components/ui/success-result.svelte';
	import NetworkDisplay from '$lib/components/ui/network-display.svelte';

	// Store imports | 存储导入
	import { selectedNetwork } from '$lib/stores/networks';
	import { createPublicClient, http } from 'viem';

	// Utility imports | 工具函数导入
	import { getExplorerUrl } from '$lib/utils/explorer';

	// Icon imports | 图标导入
	import { Info, Loader2, Zap } from '@lucide/svelte';

	// Component state | 组件状态
	let transactionHex = $state('');
	let isLoading = $state(false);
	let broadcastResult = $state<{
		success: boolean;
		transactionHash?: string;
		error?: string;
	} | null>(null);

	// Reactive validation | 响应式验证
	let isValidTransaction = $derived.by(() => {
		if (!transactionHex.trim()) return false;
		const hex = transactionHex.trim();
		return hex.startsWith('0x') && hex.length > 2 && /^0x[0-9a-fA-F]+$/.test(hex);
	});

	// Validate broadcast state | 验证广播状态
	let canBroadcast = $derived.by(
		() => $selectedNetwork !== null && isValidTransaction && !isLoading
	);

	// Help steps data | 帮助步骤数据
	let helpSteps = $derived.by(() => [
		{ label: '', content: m.broadcast_help_step1() },
		{ label: '', content: m.broadcast_help_step2() },
		{ label: '', content: m.broadcast_help_step3() },
		{ label: '', content: m.broadcast_help_step4() }
	]);

	// Broadcast transaction function | 广播交易函数
	async function broadcastTransaction() {
		// Pre-flight validation | 预检验证
		if (!$selectedNetwork) {
			broadcastResult = {
				success: false,
				error: 'Please select a network first'
			};
			return;
		}

		if (!isValidTransaction) {
			broadcastResult = {
				success: false,
				error: 'Invalid transaction format. Must be a valid hex string starting with 0x.'
			};
			return;
		}

		isLoading = true;
		broadcastResult = null;

		try {
			// Create public client for the selected network | 为选定网络创建公共客户端
			const publicClient = createPublicClient({
				chain: {
					id: parseInt($selectedNetwork.chainId),
					name: $selectedNetwork.name,
					nativeCurrency: {
						name: $selectedNetwork.symbol,
						symbol: $selectedNetwork.symbol,
						decimals: 18
					},
					rpcUrls: {
						default: {
							http: [$selectedNetwork.rpcURL]
						}
					}
				},
				transport: http($selectedNetwork.rpcURL)
			});

			// Send raw transaction | 发送原始交易
			const hash = await publicClient.sendRawTransaction({
				serializedTransaction: transactionHex.trim() as `0x${string}`
			});

			broadcastResult = {
				success: true,
				transactionHash: hash
			};
		} catch (error) {
			console.error('Broadcast failed:', error);

			// Enhanced error handling | 增强错误处理
			let errorMessage = 'Unknown error occurred';

			if (error instanceof Error) {
				errorMessage = error.message;

				// Common error patterns | 常见错误模式
				if (errorMessage.includes('insufficient funds')) {
					errorMessage = 'Insufficient funds for gas fees';
				} else if (errorMessage.includes('nonce')) {
					errorMessage = 'Invalid transaction nonce';
				} else if (errorMessage.includes('gas limit')) {
					errorMessage = 'Gas limit exceeded';
				} else if (errorMessage.includes('reverted')) {
					errorMessage = 'Transaction would revert';
				} else if (errorMessage.includes('invalid signature')) {
					errorMessage = 'Invalid transaction signature';
				} else if (errorMessage.includes('network')) {
					errorMessage = 'Network connection error';
				}
			}

			broadcastResult = {
				success: false,
				error: errorMessage
			};
		} finally {
			isLoading = false;
		}
	}
</script>

<ToolPageLayout
	title={m.broadcast_title()}
	description={m.broadcast_description()}
	pageTitle={m.tools_broadcast_title()}
>
	<div class="space-y-4">
		<!-- Network Selection Display | 网络选择显示 -->

		<NetworkDisplay network={$selectedNetwork} />
		<!-- Transaction Input | 交易输入 -->
		<Card class="relative p-6">
			{#if isLoading}
				<div
					class="bg-card/80 absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm"
				>
					<div class="space-y-2 text-center">
						<Loader2 class="text-primary mx-auto size-8 animate-spin" />
						<div class="text-sm font-medium">Broadcasting transaction...</div>
						<div class="text-muted-foreground text-xs">
							Please wait while we submit your transaction to the network
						</div>
					</div>
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<h3 class="mb-2 text-lg font-semibold">{m.broadcast_input_label()}</h3>
					<p class="text-muted-foreground mb-4 text-sm">{m.broadcast_input_description()}</p>
					<Textarea
						bind:value={transactionHex}
						placeholder={m.broadcast_input_placeholder()}
						class="min-h-32 font-mono text-sm"
						aria-describedby="tx-input-error"
						disabled={isLoading}
					/>
					{#if transactionHex.trim() && !isValidTransaction}
						<div id="tx-input-error" class="mt-2 text-sm text-red-600 dark:text-red-400">
							{m.broadcast_input_error()}
						</div>
					{/if}
				</div>

				<!-- Broadcast Button | 广播按钮 -->
				<Button
					onclick={broadcastTransaction}
					disabled={!canBroadcast}
					class="w-full"
					size="lg"
					variant={canBroadcast ? 'default' : 'outline'}
				>
					{#if isLoading}
						<Loader2 class="size-4 animate-spin" />
						{m.broadcast_button_submitting()}
					{:else}
						<Zap class="size-4" />
						{m.broadcast_button()}
					{/if}
				</Button>

				<!-- Network Status Helper | 网络状态帮助 -->
				{#if !$selectedNetwork}
					<div class="text-center text-sm text-amber-600 dark:text-amber-400">
						<Info class="mr-1 inline size-4" />
						Please select a network to broadcast transactions
					</div>
				{/if}
			</div>
		</Card>

		<!-- Broadcast Result | 广播结果 -->
		{#if broadcastResult}
			<Card class="p-6">
				{#if broadcastResult.success && broadcastResult.transactionHash}
					<!-- Success Result | 成功结果 -->
					<SuccessResult
						title={m.broadcast_success_title()}
						description={m.broadcast_success_description()}
						hashLabel={m.broadcast_success_hash()}
						hashValue={broadcastResult.transactionHash}
						copyLabel={m.broadcast_success_copy()}
						copiedLabel={m.broadcast_success_copied()}
						explorerLabel={$selectedNetwork?.explorerURL
							? m.broadcast_success_explorer()
							: undefined}
						explorerUrl={$selectedNetwork?.explorerURL
							? getExplorerUrl($selectedNetwork, broadcastResult.transactionHash)
							: undefined}
					/>
				{:else}
					<!-- Error Result | 错误结果 -->
					<ErrorResult
						title={m.broadcast_error_title()}
						description={m.broadcast_error_description()}
						errorLabel={m.broadcast_error_label()}
						errorMessage={broadcastResult.error}
					/>
				{/if}
			</Card>
		{/if}

		<!-- Help Section | 帮助部分 -->
		<HelpSection title={m.broadcast_help_title()} steps={helpSteps} />
	</div>
</ToolPageLayout>
