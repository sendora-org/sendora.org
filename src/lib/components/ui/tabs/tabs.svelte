<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';

	type $$Props = TabsPrimitive.RootProps;

	let { children, ...restProps }: $$Props = $props();
</script>

<TabsPrimitive.Root {...restProps}>
	{@render children?.()}
</TabsPrimitive.Root>
