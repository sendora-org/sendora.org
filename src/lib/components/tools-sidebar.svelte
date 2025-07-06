<script lang="ts" module>
	import TrendingUpIcon from 'lucide-svelte/icons/trending-up';
	import RadioIcon from 'lucide-svelte/icons/radio';
	import LangToggle from '$lib/components/ui/lang-toggle.svelte';
</script>

<script lang="ts">
	import NavMain from './nav-main.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ThemeToggle from '$lib/components/ui/theme-toggle.svelte';

	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages.js';
	import type { ComponentProps } from 'svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	// Define navigation item types | 定义导航项类型
	type NavItem = {
		title: string;
		url: string;
		icon: typeof TrendingUpIcon;
		items?: Array<{ title: string; url: string }>;
	};

	// Dynamic tool navigation data | 动态工具导航数据
	function getToolsData(): { navMain: NavItem[] } {
		return {
			navMain: [
				{
					title: m.tools_broadcast_title(),
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as12',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as10',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'a9s',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as7',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as6',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as5',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as4',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as3',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as2',
					url: '/tools/broadcast',
					icon: RadioIcon
				},

				{
					title: 'as1dddd',
					url: '/tools/broadcast',
					icon: RadioIcon
				},

				{
					title: 'as1ssss',
					url: '/tools/broadcast',
					icon: RadioIcon
				},

				{
					title: 'asffffa1',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as1eeee',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as1wwww',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as111q',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as1hh',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as1ggg',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as1fff',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as1eee',
					url: '/tools/broadcast',
					icon: RadioIcon
				},
				{
					title: 'as1aaa',
					url: '/tools/broadcast',
					icon: RadioIcon
				}
			]
		};
	}

	// Get navigation data with active states | 获取带有激活状态的导航数据
	let navData = $derived.by(() => {
		// Include locale dependency | 包含语言环境依赖
		const currentPath = page.url.pathname;
		const data = getToolsData();

		// Create a deep copy to avoid mutating the original data | 创建深拷贝避免修改原始数据
		const navDataCopy = {
			navMain: data.navMain.map((item) => ({
				...item,
				isActive: currentPath.startsWith(item.url),
				items: 'items' in item && item.items ? [...item.items] : undefined
			}))
		};

		return navDataCopy;
	});
</script>

<Sidebar.Root bind:ref variant="inset" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<div class="flex aspect-square size-8 items-center justify-center rounded-lg">
								<img src="/logo.svg" alt="Sendora Logo" class="h-8 w-8 rounded-lg" />
							</div>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span
									class="from-purple to-yellow truncate bg-gradient-to-r bg-clip-text font-bold text-transparent"
								>
									Sendora
								</span>
								<span class="text-muted-foreground truncate text-xs">DeFi Tools</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={navData.navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<!-- Language and theme controls | 语言和主题控制 -->
		<div class="space-y-2 p-2">
			<!-- Language switcher | 语言切换器 -->
			<LangToggle />

			<!-- Theme toggle | 主题切换 -->
			<div class="flex items-center justify-between">
				<span class="text-muted-foreground text-xs">{m.theme()}</span>
				<ThemeToggle />
			</div>

			<!-- Copyright | 版权信息 -->
			<div class="text-muted-foreground border-foreground/10 border-t pt-2 text-center text-xs">
				© 2025 Sendora.org
			</div>
		</div>
	</Sidebar.Footer>
</Sidebar.Root>
