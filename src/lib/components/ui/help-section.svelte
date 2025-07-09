<script lang="ts">
	// Component imports | 组件导入
	import { Card } from '$lib/components/ui/card';
	import { Info } from '@lucide/svelte';

	// Props | 属性
	let {
		title,
		steps,
		class: className = ''
	}: {
		title: string;
		steps: Array<{ label: string; content: string }>;
		class?: string;
	} = $props();
</script>

<Card class={`p-6 ${className}`}>
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Info class="size-5 text-blue-600 dark:text-blue-400" />
			<h3 class="text-lg font-semibold">{title}</h3>
		</div>
		<div class="text-muted-foreground space-y-3 text-sm">
			{#each steps as step, index (index)}
				<div class="flex gap-3">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900 dark:text-blue-300"
					>
						{index + 1}
					</span>
					<div class="space-y-1">
						{#if step.label}
							<div class="text-foreground font-medium">{step.label}</div>
						{/if}
						<span>{step.content}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</Card>
