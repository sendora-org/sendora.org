<script lang="ts">
	// Component imports | 组件导入
	import { Button } from '$lib/components/ui/button';
	import { ExternalLink } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	// Props | 属性
	let {
		href,
		children,
		variant = 'outline',
		size = 'sm',
		class: className = '',
		showIcon = true,
		...restProps
	}: {
		href: string;
		children?: Snippet;
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		class?: string;
		showIcon?: boolean;
		target?: string;
		rel?: string;
	} = $props();
</script>

<Button
	{variant}
	{size}
	{href}
	target="_blank"
	rel="noopener noreferrer"
	class={`gap-2 ${className}`}
	{...restProps}
>
	{@render children?.()}
	{#if showIcon}
		<ExternalLink class="size-4" />
	{/if}
</Button>
