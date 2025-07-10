<!-- ABI parameter input component with tuple/array support | 支持 tuple/array 的 ABI 参数输入组件 -->
<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Plus, Trash2, Clipboard } from '@lucide/svelte';
	import type { AbiParameter, AbiFunction } from 'viem';
	import * as m from '$lib/paraglide/messages.js';
	import AbiInputSelf from './abi-input.svelte';

	// Props interface | 属性接口
	interface Props {
		abi: AbiFunction | AbiParameter[]; // Constructor ABI or parameters | 构造函数 ABI 或参数
		values: Record<string, unknown>; // Current values | 当前值
		onValueChange: (values: Record<string, unknown>) => void; // Value change callback | 值变更回调
		disabled?: boolean;
	}

	let { abi, values = $bindable({}), onValueChange, disabled = false }: Props = $props();

	// Get parameters from ABI | 从 ABI 获取参数
	const parameters = $derived((): AbiParameter[] => {
		if (Array.isArray(abi)) {
			return abi as AbiParameter[];
		}
		return ((abi as AbiFunction).inputs || []) as AbiParameter[];
	});

	// Initialize values for all parameters | 为所有参数初始化值
	$effect(() => {
		const newValues = { ...values };
		let hasChanges = false;

		parameters().forEach((param) => {
			if (!(param.name! in newValues)) {
				newValues[param.name!] = getDefaultValue(param);
				hasChanges = true;
			}
		});

		if (hasChanges) {
			onValueChange(newValues);
		}
	});

	// Get default value based on type | 根据类型获取默认值
	function getDefaultValue(param: AbiParameter): unknown {
		if (param.type.includes('[]')) {
			return [];
		}
		if (param.type === 'bool') {
			return false;
		}
		if (param.type.startsWith('uint') || param.type.startsWith('int')) {
			return '';
		}
		if (param.type === 'address') {
			return '';
		}
		if (param.type === 'bytes' || param.type.startsWith('bytes')) {
			return '';
		}
		if (param.type === 'string') {
			return '';
		}
		if (param.type === 'tuple') {
			const tupleValues: Record<string, unknown> = {};
			(param as { components?: AbiParameter[] }).components?.forEach((component: AbiParameter) => {
				tupleValues[component.name!] = getDefaultValue(component);
			});
			return tupleValues;
		}
		return '';
	}

	// Handle value change | 处理值变更
	function handleValueChange(paramName: string, value: unknown) {
		const newValues = { ...values };
		newValues[paramName] = value;
		onValueChange(newValues);
	}

	// Handle array item change | 处理数组项变更
	function handleArrayItemChange(paramName: string, index: number, value: unknown) {
		const newValues = { ...values };
		const array = (newValues[paramName] as unknown[]) || [];
		array[index] = value;
		newValues[paramName] = [...array];
		onValueChange(newValues);
	}

	// Add array item | 添加数组项
	function addArrayItem(param: AbiParameter) {
		const newValues = { ...values };
		const array = (newValues[param.name!] as unknown[]) || [];
		const baseType = param.type.replace('[]', '');
		const itemParam: AbiParameter = {
			...param,
			type: baseType,
			name: `${param.name}[${array.length}]`
		};
		array.push(getDefaultValue(itemParam));
		newValues[param.name!] = [...array];
		onValueChange(newValues);
	}

	// Remove array item | 移除数组项
	function removeArrayItem(paramName: string, index: number) {
		const newValues = { ...values };
		const array = (newValues[paramName] as unknown[]) || [];
		array.splice(index, 1);
		newValues[paramName] = [...array];
		onValueChange(newValues);
	}

	// Get input type for HTML input | 获取 HTML 输入框类型
	function getInputType(type: string): string {
		if (type.startsWith('uint') || type.startsWith('int')) {
			return 'text'; // Use text to support big numbers | 使用 text 支持大数
		}
		if (type === 'bool') {
			return 'checkbox';
		}
		return 'text';
	}

	// Format parameter label | 格式化参数标签
	function formatParamLabel(param: AbiParameter): string {
		return param.name ? `${param.name} (${param.type})` : param.type;
	}

	// Validate address input | 验证地址输入
	function validateAddress(value: string): boolean {
		return /^0x[a-fA-F0-9]{40}$/.test(value);
	}

	// Validate bytes input | 验证字节输入
	function validateBytes(value: string, type: string): boolean {
		if (!value.startsWith('0x')) return false;
		const hex = value.slice(2);
		if (!/^[a-fA-F0-9]*$/.test(hex)) return false;

		// For fixed bytes types (bytes1, bytes32, etc) | 固定字节类型
		const match = type.match(/^bytes(\d+)$/);
		if (match) {
			const expectedLength = parseInt(match[1]) * 2;
			return hex.length === expectedLength;
		}

		// For dynamic bytes | 动态字节
		return hex.length % 2 === 0;
	}

	// Batch paste from clipboard for arrays | 数组的批量粘贴功能
	async function batchPasteArray(param: AbiParameter) {
		try {
			const text = await navigator.clipboard.readText();
			if (!text.trim()) {
				console.warn('Clipboard is empty');
				return;
			}

			const baseType = param.type.replace('[]', '');
			const items = parseTextToArray(text, baseType);

			if (items.length > 0) {
				// Validate parsed items based on type | 根据类型验证解析的项目
				const validatedItems = validateArrayItems(items, baseType);

				if (validatedItems.length > 0) {
					const newValues = { ...values };
					newValues[param.name!] = validatedItems;
					onValueChange(newValues);
					console.log(`Successfully pasted ${validatedItems.length} items for ${param.name}`);
				} else {
					console.warn('No valid items found in pasted text');
				}
			} else {
				console.warn('No items found in pasted text');
			}
		} catch (error) {
			console.error('Failed to read clipboard:', error);
			// Could show a toast notification here in a real app | 在真实应用中可以显示 toast 通知
		}
	}

	// Validate array items based on their type | 根据类型验证数组项
	function validateArrayItems(items: unknown[], baseType: string): unknown[] {
		return items.filter((item) => {
			if (baseType === 'address') {
				return typeof item === 'string' && validateAddress(item);
			}
			if (baseType.startsWith('bytes')) {
				return typeof item === 'string' && validateBytes(item, baseType);
			}
			if (baseType === 'bool') {
				return typeof item === 'boolean';
			}
			if (baseType.startsWith('uint') || baseType.startsWith('int')) {
				// For numbers, allow strings that can be parsed | 对于数字，允许可以解析的字符串
				return typeof item === 'string' && item.trim() !== '' && !isNaN(Number(item));
			}
			if (baseType === 'string') {
				return typeof item === 'string';
			}
			if (baseType === 'tuple') {
				return typeof item === 'object' && item !== null;
			}
			// Default to accepting the item | 默认接受该项目
			return true;
		});
	}

	// Parse text into array items based on type | 根据类型将文本解析为数组项
	function parseTextToArray(text: string, baseType: string): unknown[] {
		// Split by newlines first, then by commas if no newlines | 先按换行符分割，如果没有换行符则按逗号分割
		let items = text
			.trim()
			.split('\n')
			.filter((item) => item.trim());

		if (items.length === 1) {
			// If only one line, try splitting by comma | 如果只有一行，尝试按逗号分割
			const singleLine = text.trim();

			// Check if it looks like JSON array for tuple types | 检查是否像用于元组类型的 JSON 数组
			if (baseType === 'tuple' && (singleLine.startsWith('[') || singleLine.startsWith('{'))) {
				try {
					const parsed = JSON.parse(singleLine);
					if (Array.isArray(parsed)) {
						return parsed;
					}
				} catch {
					// Fall back to comma splitting | 回退到逗号分割
				}
			}

			items = singleLine.split(',').filter((item) => item.trim());
		}

		// Convert items based on type | 根据类型转换项目
		return items.map((item) => {
			const trimmedItem = item.trim();

			if (baseType === 'bool') {
				return trimmedItem.toLowerCase() === 'true' || trimmedItem === '1';
			}

			if (baseType.startsWith('uint') || baseType.startsWith('int')) {
				// Keep as string for big number support | 保持字符串格式以支持大数
				return trimmedItem;
			}

			if (baseType === 'tuple') {
				// Try to parse as JSON object for tuple | 尝试将元组解析为 JSON 对象
				try {
					return JSON.parse(trimmedItem);
				} catch {
					// Return as empty object if parsing fails | 如果解析失败则返回空对象
					return {};
				}
			}

			// For address, bytes, string types | 对于地址、字节、字符串类型
			return trimmedItem;
		});
	}
</script>

<div class="space-y-4">
	{#each parameters() as param (param.name || param.type)}
		<div class="space-y-2">
			{#if param.type === 'tuple'}
				<!-- Tuple input | 元组输入 -->
				<div class="space-y-3 rounded-lg border p-4">
					<Label>{formatParamLabel(param)}</Label>
					{#if (param as { components?: AbiParameter[] }).components}
						<div class="space-y-3 pl-4">
							<AbiInputSelf
								abi={(param as { components?: AbiParameter[] }).components || []}
								values={(values[param.name!] as Record<string, unknown>) || {}}
								onValueChange={(tupleValues: Record<string, unknown>) =>
									handleValueChange(param.name!, tupleValues)}
								{disabled}
							/>
						</div>
					{/if}
				</div>
			{:else if param.type.includes('[]')}
				<!-- Array input | 数组输入 -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<Label>{formatParamLabel(param)}</Label>
						<div class="flex gap-2">
							<Button
								size="sm"
								variant="outline"
								onclick={() => batchPasteArray(param)}
								{disabled}
								title={m.deploy_batch_paste_tooltip()}
							>
								<Clipboard class="h-4 w-4" />
								{m.deploy_batch_paste()}
							</Button>
							<Button size="sm" variant="outline" onclick={() => addArrayItem(param)} {disabled}>
								<Plus class="h-4 w-4" />
								{m.deploy_add_item()}
							</Button>
						</div>
					</div>
					<div class="space-y-2">
						{#each (values[param.name!] as unknown[]) || [] as item, index (index)}
							<div class="flex items-center gap-2">
								<div class="flex-1">
									{#if param.type === 'tuple[]' && (param as { components?: AbiParameter[] }).components}
										<!-- Tuple array item | 元组数组项 -->
										<div class="rounded-lg border p-3">
											<AbiInputSelf
												abi={(param as { components?: AbiParameter[] }).components || []}
												values={(item as Record<string, unknown>) || {}}
												onValueChange={(tupleValues: Record<string, unknown>) =>
													handleArrayItemChange(param.name!, index, tupleValues)}
												{disabled}
											/>
										</div>
									{:else}
										<!-- Simple array item | 简单数组项 -->
										{@const baseType = param.type.replace('[]', '')}
										{#if baseType === 'bool'}
											<input
												type="checkbox"
												checked={item as boolean}
												onchange={(e) =>
													handleArrayItemChange(param.name!, index, e.currentTarget.checked)}
												{disabled}
												class="h-4 w-4"
											/>
										{:else}
											<Input
												type={getInputType(baseType)}
												value={item as string}
												onchange={(e) =>
													handleArrayItemChange(param.name!, index, e.currentTarget.value)}
												placeholder={baseType}
												{disabled}
												class={baseType === 'address' && item && !validateAddress(item as string)
													? 'border-destructive'
													: ''}
											/>
										{/if}
									{/if}
								</div>
								<Button
									size="icon"
									variant="ghost"
									onclick={() => removeArrayItem(param.name!, index)}
									{disabled}
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						{/each}
					</div>
				</div>
			{:else if param.type === 'bool'}
				<!-- Boolean input | 布尔输入 -->
				<div class="flex items-center space-x-2">
					<input
						id={param.name}
						type="checkbox"
						checked={values[param.name!] as boolean}
						onchange={(e) => handleValueChange(param.name!, e.currentTarget.checked)}
						{disabled}
						class="h-4 w-4"
					/>
					<Label for={param.name}>{formatParamLabel(param)}</Label>
				</div>
			{:else}
				<!-- Standard input (address, uint, bytes, string, etc) | 标准输入 -->
				<div class="space-y-2">
					<Label for={param.name}>{formatParamLabel(param)}</Label>
					<Input
						id={param.name}
						type={getInputType(param.type)}
						value={(values[param.name!] as string) || ''}
						onchange={(e) => handleValueChange(param.name!, e.currentTarget.value)}
						placeholder={param.type === 'address'
							? '0x...'
							: param.type.startsWith('bytes')
								? '0x...'
								: param.type.startsWith('uint')
									? '0'
									: param.type}
						{disabled}
						class={param.type === 'address' &&
						values[param.name!] &&
						!validateAddress(values[param.name!] as string)
							? 'border-destructive'
							: ''}
					/>
					{#if param.type === 'address' && values[param.name!] && !validateAddress(values[param.name!] as string)}
						<p class="text-destructive text-sm">{m.deploy_invalid_address()}</p>
					{/if}
					{#if param.type.startsWith('bytes') && values[param.name!] && !validateBytes(values[param.name!] as string, param.type)}
						<p class="text-destructive text-sm">{m.deploy_invalid_bytes()}</p>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>
