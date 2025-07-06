<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages.js';

	// No need for reactive text bindings - use messages directly in template | 无需响应式文本绑定 - 直接在模板中使用消息

	const bgSvg = `'data:image/svg+xml;utf8,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="%23a855f7" stroke-width="0.5" opacity="0.3"/><circle cx="30" cy="30" r="1.5" fill="%23a855f7" opacity="0.4"/><polygon points="15,10 25,10 20,20" fill="%23eab308" opacity="0.2"/><polygon points="35,40 45,40 40,50" fill="%23a855f7" opacity="0.2"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)"/></svg>'`;
</script>

<!-- Update page title | 更新页面标题 -->
<svelte:head>
	<title>Sendora.org - Ethereum DeFi Tools</title>
</svelte:head>

<!-- Hero section with brand mesh gradient | 带品牌网格渐变的主要展示区 -->
<section
	class="brand-gradient-mesh relative flex min-h-[100vh] items-center justify-center overflow-hidden"
>
	<!-- Premium geometric pattern overlay | 高端几何图案叠加 -->
	<div class="absolute inset-0 opacity-[0.02]" style="background-image: url({bgSvg})"></div>

	<!-- Flowing gradient orbs | 流动的渐变球体 -->
	<div class="absolute inset-0 overflow-hidden">
		<!-- Primary orb | 主要球体 -->
		<div
			class="from-purple/30 to-purple/0 absolute -top-40 -right-40 h-[600px] w-[600px] animate-pulse rounded-full bg-gradient-to-br blur-[100px]"
		></div>
		<!-- Secondary orb | 次要球体 -->
		<div
			class="from-yellow/20 to-yellow/0 absolute -bottom-40 -left-40 h-[600px] w-[600px] animate-pulse rounded-full bg-gradient-to-tr blur-[100px]"
			style="animation-delay: 2s;"
		></div>
		<!-- Accent orb | 点缀球体 -->
		<div
			class="bg-gradient-radial from-purple/10 absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full via-transparent to-transparent blur-[50px]"
		></div>
	</div>

	<!-- Hero content container | 主要内容容器 -->
	<div class="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
		<!-- Logo with premium effect | 带高端效果的标志 -->
		<div class="animate-fade-in mb-6 sm:mb-8">
			<div class="relative inline-block">
				<!-- Glow effect | 发光效果 -->
				<div class="bg-purple/20 absolute inset-0 rounded-3xl blur-2xl"></div>
				<img
					src="/logo.svg"
					alt="Sendora Logo"
					class="ring-purple/20 relative mx-auto h-24 w-24 rounded-3xl shadow-2xl ring-1 sm:h-28 sm:w-28 md:h-36 md:w-36"
				/>
			</div>
		</div>

		<!-- Main title with brand styling | 品牌风格主标题 -->

		<h1
			class="animate-fade-in-delayed mb-4 px-4 text-3xl font-black sm:mb-6 sm:text-5xl md:text-7xl"
		>
			<span
				class="from-purple via-purple-dark to-purple bg-gradient-to-r bg-clip-text text-transparent"
			>
				{m.hero_title()}
			</span>
		</h1>

		<!-- Subtitle with enhanced typography | 增强排版的副标题 -->
		<p
			class="text-foreground/80 animate-fade-in-delayed mx-auto mb-8 max-w-3xl px-4 text-lg leading-relaxed font-light sm:mb-10 sm:text-xl md:text-2xl"
		>
			{m.hero_subtitle()}
		</p>

		<!-- CTA buttons with premium styling | 高端风格的行动按钮 -->
		<div
			class="animate-fade-in-delayed-more flex flex-col justify-center gap-3 px-4 sm:flex-row sm:gap-4"
		>
			<!-- Primary CTA button | 主要行动按钮 -->

			<Button
				href="/tools"
				size="lg"
				class="from-purple to-purple-dark hover:from-purple-dark hover:to-purple group relative w-full bg-gradient-to-r px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl sm:w-auto sm:px-10 sm:py-6 sm:text-lg"
			>
				<span class="relative z-10">{m.cta_get_started()}</span>
				<div
					class="from-purple/50 to-purple-dark/50 absolute inset-0 rounded-lg bg-gradient-to-r opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
				></div>
			</Button>

			<!-- Secondary CTA button | 次要行动按钮 -->
			<Button
				href="#features"
				variant="outline"
				size="lg"
				class="border-foreground/20 hover:border-purple/50 text-foreground hover:text-purple bg-background/50 relative w-full border px-8 py-4 text-base font-medium backdrop-blur-sm transition-all duration-300 sm:w-auto sm:px-10 sm:py-6 sm:text-lg"
			>
				{m.cta_learn_more()}
			</Button>
		</div>

		<!-- Compatible protocols | 兼容协议 -->
		<div class="border-foreground/5 mt-12 border-t pt-12 sm:mt-20 sm:pt-20">
			<p class="text-muted-foreground animate-fade-in mb-6 px-4 text-sm sm:mb-8">
				Compatible with major protocols
			</p>
			<div
				class="flex flex-wrap items-center justify-center gap-6 px-4 opacity-50 grayscale transition-all duration-500 hover:opacity-70 hover:grayscale-0 sm:gap-12"
			>
				<span class="text-base font-semibold sm:text-lg">Uniswap</span>
				<span class="text-base font-semibold sm:text-lg">Aave</span>
				<span class="text-base font-semibold sm:text-lg">Compound</span>
				<span class="text-base font-semibold sm:text-lg">ERC-20</span>
			</div>
		</div>
	</div>

	<!-- Scroll indicator | 滚动指示器 -->
	<div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
		<svg
			class="text-muted-foreground h-6 w-6"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M19 14l-7 7m0 0l-7-7m7 7V3"
			></path>
		</svg>
	</div>
</section>

<style>
	/* Custom animations | 自定义动画 */
	@keyframes float {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		50% {
			transform: translateY(-20px) rotate(180deg);
		}
	}

	@keyframes float-delayed {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		50% {
			transform: translateY(-30px) rotate(-180deg);
		}
	}

	:global(.animate-float) {
		animation: float 20s ease-in-out infinite;
	}

	:global(.animate-float-delayed) {
		animation: float-delayed 25s ease-in-out infinite;
	}

	:global(.animate-fade-in) {
		animation: fadeIn 0.8s ease-out;
	}

	:global(.animate-fade-in-delayed) {
		animation: fadeIn 0.8s ease-out 0.2s both;
	}

	:global(.animate-fade-in-delayed-more) {
		animation: fadeIn 0.8s ease-out 0.4s both;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
