<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	import ToolPageLayout from '$lib/components/tool-page-layout.svelte';
</script>

<ToolPageLayout
	title={m.broadcast_title()}
	description={m.broadcast_description()}
	pageTitle={m.tools_broadcast_title()}
>
	<div class="space-y-6"></div>
</ToolPageLayout>
