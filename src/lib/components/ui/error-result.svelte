<script lang="ts">
	// Component imports | 组件导入
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { AlertTriangle } from '@lucide/svelte';

	// Props | 属性
	let {
		title,
		description,
		errorLabel,
		errorMessage,
		class: className = ''
	}: {
		title: string;
		description: string;
		errorLabel?: string;
		errorMessage?: string;
		class?: string;
	} = $props();
</script>

<Alert variant="destructive" class={className}>
	<AlertTriangle class="size-4" />
	<AlertTitle>{title}</AlertTitle>
	<AlertDescription>{description}</AlertDescription>
</Alert>

{#if errorMessage && errorLabel}
	<div class="mt-4 space-y-2 overflow-auto">
		<div class="text-sm font-medium text-red-600 dark:text-red-400">
			{errorLabel}
		</div>
		<div class="rounded-lg bg-red-50 p-3 dark:bg-red-950">
			<code class="text-sm text-red-800 dark:text-red-200">{errorMessage}</code>
		</div>
	</div>
{/if}
