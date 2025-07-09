<script lang="ts">
	// Component imports | 组件导入
	import { Button } from '$lib/components/ui/button';
	import { copyWithFeedback } from '$lib/utils/clipboard';
	import { Check, Copy } from '@lucide/svelte';

	// Props | 属性
	let {
		text,
		variant = 'ghost',
		size = 'sm',
		class: className = '',
		copyLabel = 'Copy',
		copiedLabel = 'Copied',
		...restProps
	}: {
		text: string;
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		class?: string;
		copyLabel?: string;
		copiedLabel?: string;
		title?: string;
		disabled?: boolean;
		onclick?: () => void;
	} = $props();

	// Component state | 组件状态
	let copySuccess = $state(false);

	// Copy to clipboard with feedback | 复制到剪贴板并反馈
	async function handleCopyToClipboard() {
		await copyWithFeedback(
			text,
			() => {
				copySuccess = true;
				// Reset copy success state after 2 seconds | 2秒后重置复制成功状态
				setTimeout(() => {
					copySuccess = false;
				}, 2000);
			},
			(error) => {
				console.error('Failed to copy:', error);
				// Could show error toast here | 这里可以显示错误提示
			}
		);
	}
</script>

<Button
	{variant}
	{size}
	onclick={handleCopyToClipboard}
	title={copySuccess ? copiedLabel : copyLabel}
	class={`${copySuccess ? 'text-green-600 dark:text-green-400' : ''} ${className}`}
	{...restProps}
>
	{#if copySuccess}
		<Check class="size-4" />
	{:else}
		<Copy class="size-4" />
	{/if}
</Button>
