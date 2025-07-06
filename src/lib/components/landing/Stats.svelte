<script lang="ts">
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';

	// Stats data structure | 统计数据结构
	interface Stat {
		label: string;
		value: string;
		suffix: string;
		target: number;
	}

	// Animation state | 动画状态
	let animatedValues = $state<number[]>([0, 0, 0, 0]);
	let isVisible = $state(false);

	// Get stats dynamically | 动态获取统计数据
	function getStats(): Stat[] {
		return [
			{
				label: m.stats_total_volume(),
				value: '0',
				suffix: '+',
				target: 2
			},
			{
				label: m.stats_active_users(),
				value: '0',
				suffix: '+',
				target: 200
			},
			{
				label: m.stats_transactions(),
				value: '0',
				suffix: '+',
				target: 1000
			}
			// {
			// 	label: m.stats_supported_chains(),
			// 	value: '0',
			// 	suffix: '+',
			// 	target: 5
			// }
		];
	}

	// Animate numbers when visible | 当可见时动画数字
	function animateNumbers() {
		if (!isVisible) return;

		const stats = getStats();
		const duration = 2000; // Animation duration in ms | 动画持续时间（毫秒）
		const startTime = Date.now();

		function updateNumbers() {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function for smooth animation | 缓动函数实现平滑动画
			const easeOutQuart = 1 - Math.pow(1 - progress, 4);

			animatedValues = stats.map((stat) => Math.floor(stat.target * easeOutQuart));

			if (progress < 1) {
				requestAnimationFrame(updateNumbers);
			}
		}

		updateNumbers();
	}

	// Intersection observer for triggering animation | 用于触发动画的交叉观察器
	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isVisible) {
						isVisible = true;
						animateNumbers();
					}
				});
			},
			{ threshold: 0.3 }
		);

		const section = document.querySelector('#stats-section');
		if (section) observer.observe(section);

		return () => observer.disconnect();
	});
</script>

<!-- Premium stats section with flowing continuity | 流畅连续的高端统计区 -->
<section id="stats-section" class="relative overflow-hidden px-4 py-32 sm:px-6 lg:px-8">
	<!-- Continuous mesh background | 连续的网格背景 -->
	<div class="brand-gradient-mesh absolute inset-0 opacity-40"></div>

	<!-- Large flowing orbs for depth | 大型流动球体增加深度 -->
	<div
		class="from-purple/15 absolute -top-64 -left-64 h-[800px] w-[800px] animate-pulse rounded-full bg-gradient-to-br to-transparent blur-3xl"
	></div>
	<div
		class="from-yellow/15 absolute -right-64 -bottom-64 h-[800px] w-[800px] animate-pulse rounded-full bg-gradient-to-tl to-transparent blur-3xl"
		style="animation-delay: 1s;"
	></div>

	<!-- Top seamless transition | 顶部无缝过渡 -->
	<div
		class="from-background via-background/60 absolute top-0 right-0 left-0 z-10 h-32 bg-gradient-to-b to-transparent"
	></div>

	<div class="relative z-20 mx-auto max-w-7xl">
		<!-- Premium section title | 高端区块标题 -->

		<div class="mb-20 text-center">
			<h2 class="mb-6 text-4xl font-black md:text-6xl">
				<span
					class="from-purple via-purple-dark to-yellow bg-gradient-to-r bg-clip-text text-transparent"
				>
					{m.stats_title()}
				</span>
			</h2>
			<!-- Trust indicator | 信任指标 -->
			<div class="flex justify-center">
				<div class="trust-badge">
					<svg class="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="text-sm font-medium">{m.stats_last_updated()}</span>
				</div>
			</div>
		</div>

		<!-- Stats grid | 统计网格 -->

		<div class="grid grid-cols-1 gap-8 sm:grid-cols-1 lg:grid-cols-3">
			{#each getStats() as stat, index (index)}
				<!-- Premium stat card | 高端统计卡片 -->
				<div class="group relative text-center">
					<!-- Card background with subtle gradient | 带微妙渐变的卡片背景 -->
					<div
						class="bg-card/30 border-foreground/5 group-hover:border-purple/20 absolute inset-0 rounded-2xl border backdrop-blur-sm transition-all duration-500"
					></div>
					<!-- Glow effect on hover | 悬停时的发光效果 -->
					<div
						class="from-purple/5 to-yellow/5 absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100"
					></div>

					<div class="relative z-10 p-8">
						<!-- Animated number with premium styling | 高端样式的动画数字 -->
						<div
							class="from-purple via-purple-dark to-yellow mb-4 bg-gradient-to-br bg-clip-text text-5xl font-black text-transparent transition-all duration-500 group-hover:scale-110 md:text-7xl"
						>
							{animatedValues[index]}{stat.suffix}
						</div>

						<!-- Enhanced stat label | 增强的统计标签 -->
						<p
							class="text-muted-foreground/80 group-hover:text-foreground/90 text-lg font-medium transition-colors duration-300"
						>
							{stat.label}
						</p>

						<!-- Animated accent line | 动画强调线 -->
						<div
							class="from-purple to-yellow mx-auto mt-6 h-0.5 w-12 rounded-full bg-gradient-to-r transition-all duration-500 group-hover:h-1 group-hover:w-20"
						></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
	<!-- Bottom seamless transition | 底部无缝过渡 -->
	<div
		class="from-background via-background/60 absolute right-0 bottom-0 left-0 z-10 h-32 bg-gradient-to-t to-transparent"
	></div>
</section>
