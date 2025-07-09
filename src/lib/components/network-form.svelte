<!-- Network form for adding/editing networks | 网络表单用于添加/编辑网络 -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as m from '$lib/paraglide/messages.js';
	import { addCustomNetwork, updateCustomNetwork, type NetworkInfo } from '$lib/stores/networks.js';
	import { createPublicClient, http } from 'viem';
	import { Loader2, CheckCircle2, XCircle, AlertCircle } from '@lucide/svelte';

	// Component props | 组件属性
	interface Props {
		/** Network to edit (null for adding new) | 要编辑的网络（新增时为 null） */
		network?: NetworkInfo | null;
		/** Callback when form is closed | 表单关闭时的回调 */
		onclose?: () => void;
		/** Callback when network is saved | 网络保存时的回调 */
		onsave?: (network: NetworkInfo) => void;
	}

	let { network = null, onclose, onsave }: Props = $props();

	// Form state | 表单状态
	let formData = $state({
		name: network?.name || '',
		rpcURL: network?.rpcURL || '',
		rpcURLs: network?.rpcURLs || [''],
		chainId: network?.chainId || '',
		symbol: network?.symbol || '',
		explorerURL: network?.explorerURL || '',
		isTestnet: network?.isTestnet || false,
		isPopular: network?.isPopular || false,
		blockTime: network?.blockTime || 12_000n,
		blockGasLimit: network?.blockGasLimit || 30_000_000n,
		features: network?.features || ['EIP1559']
	});

	// Selected default RPC index | 选中的默认 RPC 索引
	let selectedRpcIndex = $state(0);

	// Form validation state | 表单验证状态
	let errors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);

	// RPC validation state | RPC 验证状态
	interface RpcStatus {
		isChecking: boolean;
		isValid: boolean | null;
		latency: number | null;
		error: string | null;
		chainId: string | null;
	}

	let rpcStatuses = $state<Record<number, RpcStatus>>({});

	// Initialize RPC URLs and selected index | 初始化 RPC URLs 和选中索引
	$effect(() => {
		if (network) {
			// When editing an existing network | 编辑现有网络时
			if (formData.rpcURLs.length === 1 && formData.rpcURLs[0] === '') {
				formData.rpcURLs = [...network.rpcURLs];
			}
			// Find the index of default RPC | 查找默认 RPC 的索引
			const defaultIndex = formData.rpcURLs.findIndex((url) => url === network.rpcURL);
			selectedRpcIndex = defaultIndex !== -1 ? defaultIndex : 0;
		} else {
			// When adding a new network | 添加新网络时
			// Ensure first non-empty RPC is selected | 确保选中第一个非空 RPC
			const firstNonEmptyIndex = formData.rpcURLs.findIndex((url) => url.trim());
			selectedRpcIndex = firstNonEmptyIndex !== -1 ? firstNonEmptyIndex : 0;
		}
	});

	// Ensure valid RPC selection when URLs change | 当 RPC URLs 变化时确保有效选择
	$effect(() => {
		// If selected index is out of bounds or points to empty URL, find first valid one | 如果选中索引超出范围或指向空 URL，找到第一个有效的
		// This effect will re-run whenever formData.rpcURLs changes | 当 formData.rpcURLs 变化时，此 effect 会重新运行
		if (
			selectedRpcIndex >= formData.rpcURLs.length ||
			selectedRpcIndex < 0 ||
			!formData.rpcURLs[selectedRpcIndex]?.trim()
		) {
			const firstValidIndex = formData.rpcURLs.findIndex((url) => url.trim());
			selectedRpcIndex = firstValidIndex !== -1 ? firstValidIndex : 0;
		}
	});

	// Validate form | 验证表单
	function validateForm(): boolean {
		errors = {};

		if (!formData.name.trim()) {
			errors.name = 'Network name is required';
		}

		if (!formData.chainId.trim()) {
			errors.chainId = 'Chain ID is required';
		} else if (!/^\d+$/.test(formData.chainId)) {
			errors.chainId = 'Chain ID must be a number';
		}

		if (!formData.symbol.trim()) {
			errors.symbol = 'Currency symbol is required';
		}

		// Validate RPC URLs | 验证 RPC URLs
		const validRpcUrls = formData.rpcURLs.filter((url) => url.trim());
		if (validRpcUrls.length === 0) {
			errors.rpcURLs = 'At least one RPC URL is required';
		} else {
			// Check all RPCs | 检查所有 RPC
			for (const url of validRpcUrls) {
				try {
					new URL(url);
				} catch {
					errors.rpcURLs = 'All RPC URLs must be valid URLs';
					break;
				}
			}
		}

		// Validate explorer URL | 验证浏览器 URL
		if (formData.explorerURL.trim()) {
			try {
				new URL(formData.explorerURL);
			} catch {
				errors.explorerURL = 'Explorer URL must be a valid URL';
			}
		}

		// Check if any RPC has chain ID mismatch | 检查是否有 RPC 链 ID 不匹配
		const hasChainIdMismatch = Object.values(rpcStatuses).some(
			(status) => status.isValid === false && status.error?.includes('Chain ID mismatch')
		);

		if (hasChainIdMismatch) {
			errors.chainId = 'One or more RPC endpoints report a different chain ID';
		}

		return Object.keys(errors).length === 0;
	}

	// Handle form submission | 处理表单提交
	async function handleSubmit() {
		if (!validateForm()) return;

		isSubmitting = true;

		try {
			// Filter out empty RPC URLs | 过滤空的 RPC URLs
			const validRpcUrls = formData.rpcURLs.filter((url) => url.trim());

			// Determine default RPC based on selection | 根据选择确定默认 RPC
			const defaultRpc =
				selectedRpcIndex >= 0 && selectedRpcIndex < validRpcUrls.length
					? validRpcUrls[selectedRpcIndex]
					: validRpcUrls[0];

			const networkData: NetworkInfo = {
				name: formData.name.trim(),
				rpcURL: defaultRpc,
				rpcURLs: validRpcUrls,
				chainId: formData.chainId.trim(),
				symbol: formData.symbol.trim().toUpperCase(),
				explorerURL: formData.explorerURL.trim(),
				isTestnet: formData.isTestnet,
				isPopular: formData.isPopular,
				blockTime: formData.blockTime,
				blockGasLimit: formData.blockGasLimit,
				features: formData.features
			};

			if (network) {
				// Update existing network | 更新现有网络
				updateCustomNetwork(network.chainId, networkData);
			} else {
				// Add new network | 添加新网络
				addCustomNetwork(networkData);
			}

			onsave?.(networkData);
			onclose?.();
		} catch (error) {
			errors.general = error instanceof Error ? error.message : 'Failed to save network';
		} finally {
			isSubmitting = false;
		}
	}

	// Handle RPC URL changes | 处理RPC URL变化
	function addRpcUrl() {
		formData.rpcURLs = [...formData.rpcURLs, ''];
	}

	function removeRpcUrl(index: number) {
		if (formData.rpcURLs.length > 1) {
			formData.rpcURLs = formData.rpcURLs.filter((_, i) => i !== index);
			// Adjust selected index if needed | 如需要调整选中的索引
			if (selectedRpcIndex === index) {
				selectedRpcIndex = 0;
			} else if (selectedRpcIndex > index) {
				selectedRpcIndex--;
			}
		}
	}

	// Test RPC endpoint | 测试 RPC 端点
	async function testRpcEndpoint(rpcUrl: string, index: number) {
		if (!rpcUrl.trim()) {
			rpcStatuses[index] = {
				isChecking: false,
				isValid: null,
				latency: null,
				error: null,
				chainId: null
			};
			return;
		}

		// Validate URL format | 验证 URL 格式
		try {
			new URL(rpcUrl);
		} catch {
			rpcStatuses[index] = {
				isChecking: false,
				isValid: false,
				latency: null,
				error: 'Invalid URL format',
				chainId: null
			};
			return;
		}

		// Start checking | 开始检查
		rpcStatuses[index] = {
			isChecking: true,
			isValid: null,
			latency: null,
			error: null,
			chainId: null
		};

		try {
			const startTime = performance.now();

			// Create viem client | 创建 viem 客户端
			const client = createPublicClient({
				transport: http(rpcUrl, {
					timeout: 5000 // 5 second timeout
				})
			});

			// Get chain ID from RPC | 从 RPC 获取链 ID
			const chainId = await client.getChainId();
			const endTime = performance.now();
			const latency = Math.round(endTime - startTime);

			// Check if chain ID matches | 检查链 ID 是否匹配
			const expectedChainId = formData.chainId.trim();
			const rpcChainId = chainId.toString();

			if (expectedChainId && expectedChainId !== rpcChainId) {
				rpcStatuses[index] = {
					isChecking: false,
					isValid: false,
					latency: latency,
					error: `Chain ID mismatch: RPC reports ${rpcChainId}, expected ${expectedChainId}`,
					chainId: rpcChainId
				};
			} else {
				rpcStatuses[index] = {
					isChecking: false,
					isValid: true,
					latency: latency,
					error: null,
					chainId: rpcChainId
				};
			}
		} catch (error) {
			rpcStatuses[index] = {
				isChecking: false,
				isValid: false,
				latency: null,
				error: error instanceof Error ? error.message : 'Failed to connect to RPC',
				chainId: null
			};
		}
	}

	// Test all RPC endpoints | 测试所有 RPC 端点
	async function testAllRpcEndpoints() {
		// Test all RPCs | 测试所有 RPC
		const promises = formData.rpcURLs.map((url: string, index: number) => {
			if (url.trim()) {
				return testRpcEndpoint(url, index);
			}
		});

		await Promise.all(promises);
	}
</script>

<!-- Network form | 网络表单 -->
<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	class="space-y-6 p-6"
>
	<!-- General error | 通用错误 -->
	{#if errors.general}
		<div
			class="bg-destructive/15 border-destructive/20 text-destructive rounded-md border p-3 text-sm"
		>
			{errors.general}
		</div>
	{/if}

	<!-- Network Name | 网络名称 -->
	<div class="space-y-2">
		<label for="name" class="text-sm font-medium">
			{m.network_form_name()}
		</label>
		<Input
			id="name"
			bind:value={formData.name}
			placeholder="Ethereum"
			class={errors.name ? 'border-destructive' : ''}
		/>
		{#if errors.name}
			<p class="text-destructive text-sm">{errors.name}</p>
		{/if}
	</div>

	<!-- Chain ID | 链 ID -->
	<div class="space-y-2">
		<label for="chainId" class="text-sm font-medium">
			{m.network_form_chain_id()}
		</label>
		<Input
			id="chainId"
			bind:value={formData.chainId}
			placeholder="1"
			disabled={!!network}
			class={errors.chainId ? 'border-destructive' : ''}
		/>
		{#if errors.chainId}
			<p class="text-destructive text-sm">{errors.chainId}</p>
		{/if}
		{#if network}
			<p class="text-muted-foreground text-sm">Chain ID cannot be changed when editing</p>
		{/if}
		{#if Object.values(rpcStatuses).some((s) => s.isValid === false && s.error?.includes('Chain ID mismatch'))}
			<div class="flex items-start gap-2 text-amber-600 dark:text-amber-400">
				<AlertCircle class="mt-0.5 h-4 w-4" />
				<span class="text-sm">Warning: One or more RPC endpoints report a different chain ID</span>
			</div>
		{/if}
	</div>

	<!-- Currency Symbol | 货币符号 -->
	<div class="space-y-2">
		<label for="symbol" class="text-sm font-medium">
			{m.network_form_symbol()}
		</label>
		<Input
			id="symbol"
			bind:value={formData.symbol}
			placeholder="ETH"
			class={errors.symbol ? 'border-destructive' : ''}
		/>
		{#if errors.symbol}
			<p class="text-destructive text-sm">{errors.symbol}</p>
		{/if}
	</div>

	<!-- RPC URLs Management | RPC URLs 管理 -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<div class="text-sm font-medium">{m.rpc_manager_title()}</div>
			<div class="flex gap-2">
				<Button type="button" variant="outline" size="sm" onclick={testAllRpcEndpoints}>
					Test All
				</Button>
				<Button type="button" variant="outline" size="sm" onclick={addRpcUrl}>
					{m.rpc_manager_add()}
				</Button>
			</div>
		</div>
		<div class="space-y-3">
			{#each formData.rpcURLs as rpcURL, index (`${index}-${rpcURL}`)}
				<div class="space-y-1">
					<div class="flex items-center gap-2">
						<!-- Radio button for default RPC selection | 默认 RPC 选择单选按钮 -->
						<input
							type="radio"
							name="defaultRpc"
							value={index}
							checked={selectedRpcIndex === index}
							onchange={() => (selectedRpcIndex = index)}
							disabled={!rpcURL.trim()}
							class="h-4 w-4 text-purple-600 focus:ring-purple-500"
						/>
						<Input
							bind:value={formData.rpcURLs[index]}
							placeholder="https://rpc.example.com"
							class="flex-1"
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={() => testRpcEndpoint(rpcURL, index)}
							disabled={!rpcURL.trim() || rpcStatuses[index]?.isChecking}
						>
							{#if rpcStatuses[index]?.isChecking}
								<Loader2 class="h-4 w-4 animate-spin" />
							{:else}
								Test
							{/if}
						</Button>
						{#if formData.rpcURLs.length > 1}
							<Button type="button" variant="outline" size="sm" onclick={() => removeRpcUrl(index)}>
								{m.rpc_manager_remove()}
							</Button>
						{/if}
					</div>
					{#if rpcStatuses[index] && !rpcStatuses[index].isChecking}
						<div class="pl-6 text-sm">
							{#if rpcStatuses[index].isValid}
								<div class="flex items-center gap-2 text-green-600 dark:text-green-400">
									<CheckCircle2 class="h-4 w-4" />
									<span
										>Connected • {rpcStatuses[index].latency}ms • Chain ID: {rpcStatuses[index]
											.chainId}</span
									>
								</div>
							{:else if rpcStatuses[index].error}
								<div class="flex items-start gap-2 text-red-600 dark:text-red-400">
									<XCircle class="mt-0.5 h-4 w-4" />
									<span>{rpcStatuses[index].error}</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
		{#if errors.rpcURLs}
			<p class="text-destructive text-sm">{errors.rpcURLs}</p>
		{/if}
	</div>

	<!-- Block Explorer URL | 区块浏览器 URL -->
	<div class="space-y-2">
		<label for="explorerURL" class="text-sm font-medium">
			{m.network_form_explorer()}
		</label>
		<Input
			id="explorerURL"
			bind:value={formData.explorerURL}
			placeholder="https://etherscan.io"
			class={errors.explorerURL ? 'border-destructive' : ''}
		/>
		{#if errors.explorerURL}
			<p class="text-destructive text-sm">{errors.explorerURL}</p>
		{/if}
	</div>

	<!-- Testnet toggle | 测试网切换 -->
	<div class="flex items-center space-x-2">
		<input
			id="isTestnet"
			type="checkbox"
			bind:checked={formData.isTestnet}
			class="rounded border-gray-300"
		/>
		<label for="isTestnet" class="text-sm font-medium">
			{m.network_form_testnet()}
		</label>
	</div>

	<Separator />

	<!-- Form actions | 表单操作 -->
	<div class="flex gap-3">
		<Button
			type="button"
			variant="outline"
			class="flex-1"
			onclick={() => onclose?.()}
			disabled={isSubmitting}
		>
			{m.network_form_cancel()}
		</Button>
		<Button type="submit" class="flex-1" disabled={isSubmitting}>
			{isSubmitting ? 'Saving...' : m.network_form_save()}
		</Button>
	</div>
</form>
