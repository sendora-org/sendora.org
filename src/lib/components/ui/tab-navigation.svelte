<!-- Svelte action to check scroll state on mount | Svelte 动作在挂载时检查滚动状态 -->
<script lang="ts" module>
	// Action to check scroll state on mount | 挂载时检查滚动状态的动作
	function checkScrollOnMount(node: HTMLElement) {
		const observer = new ResizeObserver(() => {
			node.dispatchEvent(new Event('scroll'));
		});
		observer.observe(node);

		// Initial check | 初始检查
		setTimeout(() => {
			node.dispatchEvent(new Event('scroll'));
		}, 100);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<script lang="ts">
	// Component imports | 组件导入
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import type { Component } from 'svelte';

	// Types | 类型
	interface TabItem {
		id: string;
		label: string;
		icon?: Component;
		disabled?: boolean;
	}

	// Props | 属性
	let {
		tabs,
		activeTab,
		onTabChange,
		class: className = '',
		size = 'sm',
		variant = 'default'
	}: {
		tabs: TabItem[];
		activeTab: string;
		onTabChange: (tabId: string) => void;
		class?: string;
		size?: 'sm' | 'default' | 'lg';
		variant?: 'default' | 'pills' | 'underline';
	} = $props();

	// Refs | 引用
	let scrollContainer: HTMLElement;
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	// Handle tab selection | 处理标签选择
	function handleTabClick(tabId: string) {
		if (tabs.find((tab) => tab.id === tabId)?.disabled) return;
		onTabChange(tabId);
	}

	// Check scroll state | 检查滚动状态
	function checkScrollState() {
		if (!scrollContainer) return;

		const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
		canScrollLeft = scrollLeft > 0;
		canScrollRight = scrollLeft < scrollWidth - clientWidth - 1;
	}

	// Scroll left | 向左滚动
	function scrollLeft() {
		if (!scrollContainer) return;
		scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
	}

	// Scroll right | 向右滚动
	function scrollRight() {
		if (!scrollContainer) return;
		scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
	}

	// Get button variant based on active state | 根据激活状态获取按钮变体
	function getButtonVariant(tabId: string) {
		const isActive = activeTab === tabId;

		if (variant === 'pills') {
			return isActive ? 'default' : 'ghost';
		}

		if (variant === 'underline') {
			return isActive ? 'ghost' : 'ghost';
		}

		return isActive ? 'default' : 'ghost';
	}

	// Get container classes based on variant | 根据变体获取容器类
	function getContainerClasses() {
		const baseClasses = 'flex gap-2 p-1 overflow-x-auto scrollbar-hide';

		if (variant === 'pills') {
			return `${baseClasses} bg-muted rounded-lg`;
		}

		if (variant === 'underline') {
			return `${baseClasses} border-b border-border`;
		}

		return `${baseClasses} bg-muted rounded-lg`;
	}

	// Get button classes for underline variant | 为下划线变体获取按钮类
	function getButtonClasses(tabId: string) {
		if (variant === 'underline') {
			const isActive = activeTab === tabId;
			return isActive
				? 'border-b-2 border-primary rounded-none bg-transparent hover:bg-accent'
				: 'border-b-2 border-transparent rounded-none bg-transparent hover:bg-accent';
		}
		return '';
	}
</script>

<div class={`relative ${className}`}>
	<!-- Left scroll indicator | 左侧滚动指示器 -->
	{#if canScrollLeft}
		<div class="absolute top-0 left-0 z-10 flex h-full items-center">
			<Button
				variant="ghost"
				size="sm"
				onclick={scrollLeft}
				class="h-8 w-8 rounded-full p-0 shadow-md"
				title="Scroll left"
			>
				<ChevronLeft class="size-4" />
			</Button>
		</div>
	{/if}

	<!-- Right scroll indicator | 右侧滚动指示器 -->
	{#if canScrollRight}
		<div class="absolute top-0 right-0 z-10 flex h-full items-center">
			<Button
				variant="ghost"
				size="sm"
				onclick={scrollRight}
				class="h-8 w-8 rounded-full p-0 shadow-md"
				title="Scroll right"
			>
				<ChevronRight class="size-4" />
			</Button>
		</div>
	{/if}

	<!-- Tab container | 标签容器 -->
	<div
		bind:this={scrollContainer}
		class={getContainerClasses()}
		onscroll={checkScrollState}
		use:checkScrollOnMount
	>
		{#each tabs as tab (tab.id)}
			<Button
				variant={getButtonVariant(tab.id)}
				{size}
				onclick={() => handleTabClick(tab.id)}
				disabled={tab.disabled}
				class={`flex-shrink-0 ${getButtonClasses(tab.id)}`}
			>
				{#if tab.icon}
					<tab.icon class="size-4" />
				{/if}
				{tab.label}
			</Button>
		{/each}
	</div>
</div>

<style>
	/* Hide scrollbar for webkit browsers | 为webkit浏览器隐藏滚动条 */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for Firefox | 为Firefox隐藏滚动条 */
	.scrollbar-hide {
		scrollbar-width: none;
	}
</style>
