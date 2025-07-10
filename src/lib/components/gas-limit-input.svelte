<!-- Gas limit slider component | Gas 限制滑动条组件 -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { AlertCircle, RefreshCw } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';

	// Props interface | 属性接口
	interface Props {
		value?: string;
		onValueChange: (value: string) => void;
		onEstimate?: () => Promise<bigint | undefined>;
		disabled?: boolean;
		label?: string;
		estimating?: boolean;
	}

	let {
		value = '',
		onValueChange,
		onEstimate,
		disabled = false,
		label,
		estimating = false
	}: Props = $props();

	// Component state | 组件状态
	let inputValue = $state(value);
	let sliderValue = $state(0);
	let isEstimating = $state(false);
	let estimatedValue = $state<bigint | null>(null);
	let validationError = $state<string | null>(null);

	// Gas limit constraints | Gas 限制约束
	const MIN_GAS_LIMIT = 21000n; // Minimum for simple transaction | 简单交易的最小值
	const MAX_GAS_LIMIT = 10000000n; // 10M gas maximum | 10M gas 最大值
	const DEFAULT_CONTRACT_GAS = 500000n; // Default for contract deployment | 合约部署的默认值

	// Initialize with default value and sync slider | 使用默认值初始化并同步滑动条
	$effect(() => {
		if (!inputValue && !value) {
			inputValue = DEFAULT_CONTRACT_GAS.toString();
			onValueChange(inputValue);
		} else if (value !== inputValue) {
			inputValue = value;
		}

		// Sync slider with input value | 同步滑动条与输入值
		if (inputValue) {
			try {
				const gasValue = BigInt(inputValue);
				const percentage = Number(
					((gasValue - MIN_GAS_LIMIT) * 100n) / (MAX_GAS_LIMIT - MIN_GAS_LIMIT)
				);
				sliderValue = Math.max(0, Math.min(100, percentage));
			} catch {
				// Keep current slider value if parsing fails | 如果解析失败保持当前滑动条值
			}
		}
	});

	// Handle slider change | 处理滑动条变化
	function handleSliderChange(event: Event) {
		const target = event.target as HTMLInputElement;
		sliderValue = parseFloat(target.value);

		// Convert slider percentage to gas value | 将滑动条百分比转换为 gas 值
		const gasRange = MAX_GAS_LIMIT - MIN_GAS_LIMIT;
		const gasValue = MIN_GAS_LIMIT + (gasRange * BigInt(Math.round(sliderValue))) / 100n;

		inputValue = gasValue.toString();
		validationError = null;
		onValueChange(inputValue);
	}

	// Validate gas limit input | 验证 Gas 限制输入
	// Currently not used but kept for future validation needs
	// function validateGasLimit(gasLimit: string): string | null {
	// 	if (!gasLimit.trim()) {
	// 		return 'Gas limit is required';
	// 	}

	// 	try {
	// 		const gasValue = BigInt(gasLimit);

	// 		if (gasValue < MIN_GAS_LIMIT) {
	// 			return `Gas limit too low. Minimum: ${MIN_GAS_LIMIT.toLocaleString()}`;
	// 		}

	// 		if (gasValue > MAX_GAS_LIMIT) {
	// 			return `Gas limit too high. Maximum: ${MAX_GAS_LIMIT.toLocaleString()}`;
	// 		}

	// 		return null;
	// 	} catch {
	// 		return 'Invalid gas limit format';
	// 	}
	// }

	// Estimate gas limit | 估算 Gas 限制
	async function estimateGasLimit() {
		if (!onEstimate) return;

		try {
			isEstimating = true;
			const estimated = await onEstimate();

			if (estimated) {
				// Add 20% buffer to estimate | 在估算值基础上增加 20% 缓冲
				const bufferedGas = (estimated * 120n) / 100n;
				estimatedValue = bufferedGas;

				// Use estimated value | 使用估算值
				inputValue = bufferedGas.toString();
				validationError = null;
				onValueChange(inputValue);
			}
		} catch (error) {
			console.error('Gas estimation failed:', error);
			validationError = 'Gas estimation failed';
		} finally {
			isEstimating = false;
		}
	}

	// Reset to default value | 重置为默认值
	// Currently not used but kept for future use
	// function resetToDefault() {
	// 	inputValue = DEFAULT_CONTRACT_GAS.toString();
	// 	validationError = null;
	// 	onValueChange(inputValue);
	// }
</script>

<div class="space-y-4">
	<!-- Label and estimate button | 标签和估算按钮 -->
	<div class="flex items-center justify-between">
		<Label for="gas-limit">{label || m.deploy_gas_limit()}</Label>
		{#if onEstimate}
			<Button
				size="sm"
				variant="outline"
				onclick={estimateGasLimit}
				disabled={disabled || isEstimating || estimating}
			>
				<RefreshCw class={`h-4 w-4 ${isEstimating || estimating ? 'animate-spin' : ''}`} />
			</Button>
		{/if}
	</div>

	<!-- Current value display | 当前值显示 -->
	<div class="mb-4 text-center">
		<div class="text-primary text-2xl font-bold">
			{BigInt(inputValue || '0').toLocaleString()}
		</div>
		<div class="text-muted-foreground text-sm">gas</div>
	</div>

	<!-- Slider control | 滑动条控制 -->
	<div class="space-y-3">
		<div class="relative px-2">
			<input
				type="range"
				min="0"
				max="100"
				step="0.1"
				bind:value={sliderValue}
				onchange={handleSliderChange}
				oninput={handleSliderChange}
				{disabled}
				class="slider w-full cursor-pointer appearance-none"
			/>

			<!-- Range labels | 范围标签 -->
			<div class="text-muted-foreground mt-2 flex justify-between text-xs">
				<span>{(MIN_GAS_LIMIT / 1000n).toString()}K</span>
				<span>{(MAX_GAS_LIMIT / 1000n).toString()}K</span>
			</div>
		</div>
	</div>

	<!-- Estimated value display | 估算值显示 -->
	{#if estimatedValue}
		<div class="text-muted-foreground text-sm">
			{m.gas_estimation_estimated()}: {estimatedValue.toLocaleString()}
			{m.gas_estimation_with_buffer()}
		</div>
	{/if}

	<!-- Validation error | 验证错误 -->
	{#if validationError}
		<div class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
			<AlertCircle class="h-3 w-3" />
			{validationError}
		</div>
	{/if}
</div>

<style>
	/* Gas limit slider styles | Gas 限制滑动条样式 */
	.slider {
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(to right, #e2e8f0 0%, #3b82f6 100%);
		outline: none;
	}

	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
		transition: all 0.2s ease;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.slider::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
	}

	.slider::-webkit-slider-track {
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(to right, #e2e8f0 0%, #3b82f6 100%);
	}

	.slider::-moz-range-track {
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(to right, #e2e8f0 0%, #3b82f6 100%);
		border: none;
	}

	.slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.slider:disabled::-webkit-slider-thumb {
		cursor: not-allowed;
		transform: none;
	}
</style>
