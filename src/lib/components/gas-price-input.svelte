<!-- Gas price slider component | Gas 价格滑动条组件 -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { AlertCircle, RefreshCw } from '@lucide/svelte';
	import { formatUnits } from 'viem';
	import * as m from '$lib/paraglide/messages.js';

	// Props interface | 属性接口
	interface Props {
		value?: bigint; // Value in wei | 以 wei 为单位的值
		onValueChange: (value: bigint) => void; // Callback with wei value | 回调 wei 值
		onEstimate?: () => Promise<bigint | undefined>; // Returns gas price in wei | 返回以 wei 为单位的 gas 价格
		disabled?: boolean;
		label?: string;
		estimating?: boolean;
		showPriorityOptions?: boolean;
	}

	let {
		value,
		onValueChange,
		onEstimate,
		disabled = false,
		label,
		estimating = false,
		showPriorityOptions = true
	}: Props = $props();

	// Component state | 组件状态
	let currentValue = $state<bigint>(value || 20000000000n); // Default 20 gwei in wei | 默认 20 gwei 的 wei 值
	let sliderValue = $state(0);
	let isEstimating = $state(false);
	let estimatedGasPrice = $state<bigint | null>(null);
	let validationError = $state<string | null>(null);
	let displayValue = $state('0');
	let displayUnit = $state('gwei');
	let hasAutoEstimated = $state(false); // Prevent infinite auto-estimation | 防止无限自动估算

	// Gas price constraints in wei (dynamic based on network) | Gas 价格约束（wei 单位，基于网络动态调整）
	let networkGasPriceWei = 20000000000n; // Network gas price in wei (20 gwei) | 网络 gas 价格（wei 单位，20 gwei）
	let MIN_GAS_PRICE_WEI = 200000000n; // 1/100 of network price (0.2 gwei) | 网络价格的 1/100（0.2 gwei）
	let MAX_GAS_PRICE_WEI = 60000000000n; // 3x of network price (60 gwei) | 网络价格的 3 倍（60 gwei）
	const FALLBACK_GAS_PRICE_WEI = 20000000000n; // Fallback when no network data (20 gwei) | 无网络数据时的备用值（20 gwei）

	// Smart unit formatting for gas price from wei | 从 wei 智能格式化 Gas 价格
	function formatGasPriceWithUnit(weiValue: bigint): { value: string; unit: string } {
		const gweiValue = parseFloat(formatUnits(weiValue, 9));

		if (gweiValue >= 1) {
			// Use Gwei for values >= 1 | 大于等于 1 时使用 Gwei
			return {
				value: gweiValue.toFixed(2),
				unit: 'gwei'
			};
		} else if (gweiValue >= 0.001) {
			// Use Mwei (1 Gwei = 1000 Mwei) for values >= 0.001 Gwei | 大于等于 0.001 Gwei 时使用 Mwei
			const mweiValue = gweiValue * 1000;
			return {
				value: mweiValue.toFixed(2),
				unit: 'mwei'
			};
		} else if (gweiValue >= 0.000001) {
			// Use Kwei (1 Gwei = 1000000 Kwei) for values >= 0.000001 Gwei | 大于等于 0.000001 Gwei 时使用 Kwei
			const kweiValue = gweiValue * 1000000;
			return {
				value: kweiValue.toFixed(2),
				unit: 'kwei'
			};
		} else {
			// Use wei for very small values | 非常小的值使用 wei
			return {
				value: weiValue.toString(),
				unit: 'wei'
			};
		}
	}

	// Update gas price constraints based on network data | 根据网络数据更新 gas 价格约束
	$effect(() => {
		if (estimatedGasPrice) {
			networkGasPriceWei = estimatedGasPrice;
			MIN_GAS_PRICE_WEI = estimatedGasPrice / 100n; // 1/100 of network price | 网络价格的 1/100
			MAX_GAS_PRICE_WEI = estimatedGasPrice * 3n; // 3x of network price | 网络价格的 3 倍
		}
	});

	// Auto-estimate gas price on component initialization | 组件初始化时自动估算 gas 价格
	$effect(() => {
		// Only auto-estimate once when component first loads | 只在组件首次加载时自动估算一次
		if (onEstimate && !hasAutoEstimated && !isEstimating) {
			hasAutoEstimated = true;
			estimateGasPrice();
		}
	});

	// Initialize with default value and sync slider | 使用默认值初始化并同步滑动条
	$effect(() => {
		let needsValueUpdate = false;

		if (!currentValue && !value) {
			// Use network gas price as default if available | 如果有网络数据则使用网络 gas 价格作为默认值
			currentValue = networkGasPriceWei;
			needsValueUpdate = true;
		} else if (value && value !== currentValue) {
			currentValue = value;
		}

		// Update display value with smart units | 更新智能单位显示值
		const formatted = formatGasPriceWithUnit(currentValue);
		displayValue = formatted.value;
		displayUnit = formatted.unit;

		// Calculate slider position: 50% = network price, 0% = min, 100% = max | 计算滑动条位置：50% = 网络价格，0% = 最小值，100% = 最大值
		let percentage;
		if (currentValue <= networkGasPriceWei) {
			// Left half: min to network price (0% to 50%) | 左半边：最小值到网络价格（0% 到 50%）
			const range = networkGasPriceWei - MIN_GAS_PRICE_WEI;
			const offset = currentValue - MIN_GAS_PRICE_WEI;
			if (range > 0n) {
				const ratio = Number(offset) / Number(range);
				percentage = ratio * 50;
			} else {
				percentage = 0;
			}
		} else {
			// Right half: network price to max (50% to 100%) | 右半边：网络价格到最大值（50% 到 100%）
			const range = MAX_GAS_PRICE_WEI - networkGasPriceWei;
			const offset = currentValue - networkGasPriceWei;
			if (range > 0n) {
				const ratio = Number(offset) / Number(range);
				percentage = 50 + ratio * 50;
			} else {
				percentage = 50;
			}
		}
		sliderValue = Math.max(0, Math.min(100, percentage));

		// Only call onValueChange if we actually changed the value | 只有当值真正改变时才调用 onValueChange
		if (needsValueUpdate) {
			onValueChange(currentValue);
		}
	});

	// Handle slider change | 处理滑动条变化
	function handleSliderChange(event: Event) {
		const target = event.target as HTMLInputElement;
		sliderValue = parseFloat(target.value);

		// Convert slider percentage to gas price with network price as center | 将滑动条百分比转换为gas价格，网络价格为中心点
		let newPriceWei: bigint;
		if (sliderValue <= 50) {
			// Left half: min to network price (0% to 50%) | 左半边：最小值到网络价格（0% 到 50%）
			const ratio = sliderValue / 50; // 0 to 1
			const range = networkGasPriceWei - MIN_GAS_PRICE_WEI;
			const offset = BigInt(Math.round(Number(range) * ratio));
			newPriceWei = MIN_GAS_PRICE_WEI + offset;
		} else {
			// Right half: network price to max (50% to 100%) | 右半边：网络价格到最大值（50% 到 100%）
			const ratio = (sliderValue - 50) / 50; // 0 to 1
			const range = MAX_GAS_PRICE_WEI - networkGasPriceWei;
			const offset = BigInt(Math.round(Number(range) * ratio));
			newPriceWei = networkGasPriceWei + offset;
		}

		currentValue = newPriceWei;
		validationError = null;
		onValueChange(currentValue);
	}

	// Estimate gas price | 估算 Gas 价格
	async function estimateGasPrice() {
		if (!onEstimate) {
			return;
		}

		try {
			isEstimating = true;
			const estimatedWei = await onEstimate();

			if (estimatedWei) {
				estimatedGasPrice = estimatedWei;
				// Use estimated wei value directly | 直接使用估算的 wei 值
				currentValue = estimatedWei;
				validationError = null;
				onValueChange(currentValue);
			}
		} catch (error) {
			console.error('Gas price estimation failed:', error);
			validationError = 'Gas price estimation failed';
		} finally {
			isEstimating = false;
		}
	}

	// Set priority gas price | 设置优先级 Gas 价格
	function setPriorityGasPrice(priority: 'slow' | 'fast' | 'instant') {
		let basePriceWei = estimatedGasPrice || FALLBACK_GAS_PRICE_WEI;
		let multiplier: bigint;

		switch (priority) {
			case 'slow':
				multiplier = 60n; // 60% of base | 基础价格的 60%
				break;
			case 'fast':
				multiplier = 120n; // 120% of base | 基础价格的 120%
				break;
			case 'instant':
				multiplier = 200n; // 200% of base | 基础价格的 200%
				break;
			default:
				multiplier = 100n;
		}

		const priorityPriceWei = (basePriceWei * multiplier) / 100n;

		// Ensure within bounds | 确保在范围内
		const clampedPriceWei =
			priorityPriceWei < MIN_GAS_PRICE_WEI
				? MIN_GAS_PRICE_WEI
				: priorityPriceWei > MAX_GAS_PRICE_WEI
					? MAX_GAS_PRICE_WEI
					: priorityPriceWei;

		currentValue = clampedPriceWei;
		validationError = null;
		onValueChange(currentValue);
	}
</script>

<div class="space-y-4">
	<!-- Label and estimate button | 标签和估算按钮 -->
	<div class="flex items-center justify-between">
		<Label for="gas-price">{label || m.deploy_gas_price()}</Label>
		{#if onEstimate}
			<Button
				size="sm"
				variant="outline"
				onclick={estimateGasPrice}
				disabled={disabled || isEstimating || estimating}
			>
				<RefreshCw class={`h-4 w-4 ${isEstimating || estimating ? 'animate-spin' : ''}`} />
			</Button>
		{/if}
	</div>

	<!-- Current value display | 当前值显示 -->
	<div class="mb-4 text-center">
		<div class="text-primary text-2xl font-bold">
			{displayValue}
		</div>
		<div class="text-muted-foreground text-sm">{displayUnit}</div>
	</div>

	<!-- Slider control | 滑动条控制 -->
	<div class="space-y-3">
		<div class="relative px-2">
			<input
				type="range"
				min="0"
				max="100"
				step="0.1"
				value={sliderValue}
				onchange={handleSliderChange}
				oninput={handleSliderChange}
				{disabled}
				class="slider w-full cursor-pointer appearance-none"
			/>

			<!-- Range labels | 范围标签 -->
			<div class="text-muted-foreground mt-2 flex justify-between text-xs">
				<span>{m.callthis_gas_slow()}</span>
				<span>{m.callthis_gas_fast()}</span>
			</div>
		</div>

		<!-- Priority presets | 优先级预设 -->
		{#if showPriorityOptions}
			<div class="grid grid-cols-3 gap-2">
				<Button
					size="sm"
					variant="outline"
					onclick={() => setPriorityGasPrice('slow')}
					{disabled}
					class="flex items-center justify-center"
				>
					<span class="mr-1 text-base">🐢</span>
					{m.callthis_gas_slow()}
				</Button>
				<Button
					size="sm"
					variant="outline"
					onclick={() => setPriorityGasPrice('fast')}
					{disabled}
					class="flex items-center justify-center"
				>
					<span class="mr-1 text-base">🚗</span>
					{m.callthis_gas_fast()}
				</Button>
				<Button
					size="sm"
					variant="outline"
					onclick={() => setPriorityGasPrice('instant')}
					{disabled}
					class="flex items-center justify-center"
				>
					<span class="mr-1 text-base">🚀</span>
					{m.callthis_gas_instant()}
				</Button>
			</div>
		{/if}
	</div>

	<!-- Validation error | 验证错误 -->
	{#if validationError}
		<div class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
			<AlertCircle class="h-3 w-3" />
			{validationError}
		</div>
	{/if}
</div>

<style>
	/* Gas price slider styles | Gas 价格滑动条样式 */
	.slider {
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(
			to right,
			#ef4444 0%,
			#f97316 25%,
			#f59e0b 50%,
			#84cc16 75%,
			#10b981 100%
		);
		outline: none;
	}

	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #6366f1;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
		transition: all 0.2s ease;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
	}

	.slider::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #6366f1;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
	}

	.slider::-webkit-slider-track {
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(
			to right,
			#ef4444 0%,
			#f97316 25%,
			#f59e0b 50%,
			#84cc16 75%,
			#10b981 100%
		);
	}

	.slider::-moz-range-track {
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(
			to right,
			#ef4444 0%,
			#f97316 25%,
			#f59e0b 50%,
			#84cc16 75%,
			#10b981 100%
		);
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
