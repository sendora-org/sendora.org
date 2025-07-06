<script lang="ts">
	import type { Snippet } from 'svelte';
	// 工具页面布局组件 | Tool page layout component
	interface Props {
		// 工具标题 | Tool title
		title: string;
		// 工具描述 | Tool description
		description: string;
		// 页面标题（用于 SEO） | Page title for SEO
		pageTitle?: string;
		// 自定义容器类名 | Custom container class
		containerClass?: string;
		// 最大宽度类名 | Max width class
		maxWidth?: string;
		// 头部额外内容 | Additional header content
		headerExtra?: Snippet;
		// 主要内容 | Main content
		children: Snippet;
	}

	let {
		title,
		description,
		pageTitle,
		containerClass = 'flex flex-1 flex-col gap-6 p-4 md:p-8',
		maxWidth = 'max-w-4xl',
		headerExtra,
		children
	}: Props = $props();
</script>

<svelte:head>
	{#if pageTitle}
		<title>{pageTitle} - Sendora</title>
	{/if}
</svelte:head>

<!-- Tool page layout | 工具页面布局 -->
<div class={containerClass}>
	<!-- Header | 页头 -->
	<div class="mx-auto {maxWidth} text-center">
		<h1
			class="from-purple to-yellow mb-4 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent"
		>
			{title}
		</h1>
		<p class="text-muted-foreground mb-6 text-lg">{description}</p>

		{#if headerExtra}
			<div class="mt-4">
				{@render headerExtra()}
			</div>
		{/if}
	</div>

	<!-- Main content | 主要内容 -->
	<div class="mx-auto w-full {maxWidth}">
		{@render children()}
	</div>
</div>
