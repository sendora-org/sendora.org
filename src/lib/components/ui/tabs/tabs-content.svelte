<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	type $$Props = TabsPrimitive.ContentProps;

	let { children, class: className, ...restProps }: $$Props = $props();
</script>

<TabsPrimitive.Content
	class={cn(
		'ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.Content>
