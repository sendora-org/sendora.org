<!--
主题切换按钮组件 / Theme toggle button component
支持明暗模式切换 / Supports light/dark mode switching
-->
<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/theme.js'; // 导入主题状态和切换函数 / Import theme state and toggle function
	import { Button } from '$lib/components/ui/button/index.js'; // 导入按钮组件 / Import button component
	import { Sun, Moon } from '@lucide/svelte'; // 导入图标 / Import icons
</script>

<!-- 主题切换按钮 / Theme toggle button -->
<Button
	variant="outline"
	size="icon"
	onclick={toggleTheme}
	aria-label={$theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
>
	{#if $theme === 'light'}
		<!-- 亮色模式显示太阳图标 / Light mode shows sun icon -->
		<Sun class="size-4" />
	{:else}
		<!-- 暗色模式显示月亮图标 / Dark mode shows moon icon -->
		<Moon class="size-4" />
	{/if}
</Button>
