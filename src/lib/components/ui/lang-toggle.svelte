<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages.js';
	import { setLocale, getLocale } from '$lib/paraglide/runtime.js';

	let currentLocale = $derived(getLocale());
</script>

<div class="flex w-full items-center justify-between gap-2">
	<span class="text-muted-foreground text-sm">{m.language_label()}:</span>
	<div class="flex gap-1">
		<!-- English button | 英文按钮 -->
		<Button
			variant={currentLocale === 'en-us' ? 'default' : 'ghost'}
			size="sm"
			onclick={() => setLocale('en-us')}
			class={currentLocale === 'en-us' ? 'bg-purple hover:bg-purple-dark' : ''}
		>
			EN
		</Button>
		<!-- Chinese button | 中文按钮 -->
		<Button
			variant={currentLocale === 'zh-cn' ? 'default' : 'ghost'}
			size="sm"
			onclick={() => setLocale('zh-cn')}
			class={currentLocale === 'zh-cn' ? 'bg-purple hover:bg-purple-dark' : ''}
		>
			中文
		</Button>
	</div>
</div>
