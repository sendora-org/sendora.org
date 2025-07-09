<script lang="ts">
	// Component imports | 组件导入
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Check } from '@lucide/svelte';
	import CopyButton from '$lib/components/ui/copy-button.svelte';
	import ExternalLink from '$lib/components/ui/external-link.svelte';

	// Props | 属性
	let {
		title,
		description,
		hashLabel,
		hashValue,
		copyLabel,
		copiedLabel,
		explorerLabel,
		explorerUrl,
		class: className = ''
	}: {
		title: string;
		description: string;
		hashLabel: string;
		hashValue: string;
		copyLabel: string;
		copiedLabel: string;
		explorerLabel?: string;
		explorerUrl?: string;
		class?: string;
	} = $props();
</script>

<Alert
	variant="default"
	class={`border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 ${className}`}
>
	<Check class="size-4 text-green-600 dark:text-green-400" />
	<AlertTitle class="text-green-800 dark:text-green-200">{title}</AlertTitle>
	<AlertDescription class="text-green-700 dark:text-green-300">
		{description}
	</AlertDescription>
</Alert>

<div class="mt-4 space-y-3">
	<!-- Transaction Hash | 交易哈希 -->
	<div class="space-y-2">
		<div class="text-sm font-medium">{hashLabel}</div>
		<div class="bg-muted flex items-center gap-2 rounded-lg p-3">
			<code class="flex-1 font-mono text-sm break-all">{hashValue}</code>
			<CopyButton text={hashValue} {copyLabel} {copiedLabel} />
		</div>
	</div>

	<!-- Explorer Link | 浏览器链接 -->
	{#if explorerUrl && explorerLabel}
		<ExternalLink href={explorerUrl}>
			{explorerLabel}
		</ExternalLink>
	{/if}
</div>
