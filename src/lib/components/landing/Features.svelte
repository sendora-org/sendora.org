<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import * as m from '$lib/paraglide/messages.js';
	// Lucide icons for clear tool representation | 使用 Lucide 图标清晰表示工具功能
	import { TrendingUp, Radio, Wallet, PenTool, Rocket, Send, BugPlay } from '@lucide/svelte';

	// Feature data structure | 功能数据结构
	interface Feature {
		icon: string;
		title: string;
		description: string;
		gradient: string;
		url: string;
	}

	// Icon component mapping | 图标组件映射
	function getIconComponent(iconName: string) {
		const iconMap: Record<string, typeof TrendingUp> = {
			analytics: TrendingUp, // 上升趋势 - DeFi Analytics & Calls
			broadcast: Radio, // 广播电台 - Broadcast Transaction
			balance: Wallet, // 钱包 - Balance Insights
			signature: PenTool, // 签名笔 - Signthis
			deploy: Rocket, // 火箭发屔 - Deploy Contracts
			multisend: Send, // 发送/批量发送 - Token Multisender
			callthis: BugPlay // 调试 - CallThis
		};
		return iconMap[iconName] || TrendingUp;
	}

	// Feature list with gradients | 带渐变的功能列表
	const featureGradients = [
		// { icon: 'analytics', gradient: 'from-purple to-purple-light' },
		{ icon: 'broadcast', gradient: 'from-yellow to-yellow-light', url: '/tools/broadcast' },
		// { icon: 'balance', gradient: 'from-purple-dark to-purple' },
		{ icon: 'signature', gradient: 'from-yellow-dark to-yellow', url: '/tools/signthis' },
		{ icon: 'deploy', gradient: 'from-purple to-yellow', url: '/tools/deploy' }
		// { icon: 'callthis', gradient: 'from-purple to-yellow' }
		// { icon: 'multisend', gradient: 'from-yellow to-purple' }
	];

	// Get feature data dynamically | 动态获取功能数据
	function getFeatures(): Feature[] {
		return featureGradients.map(({ icon, gradient, url }) => {
			// Map icon names to message keys | 将图标名称映射到消息键
			const messageKey =
				icon === 'multisend'
					? 'multisender'
					: icon === 'balance'
						? 'balance'
						: icon === 'signature'
							? 'signthis'
							: icon === 'analytics'
								? 'defi_analytics'
								: icon;

			// Get title and description using specific function calls | 使用特定函数调用获取标题和描述
			let title = '';
			let description = '';

			switch (messageKey) {
				case 'broadcast':
					title = m.feature_broadcast_title();
					description = m.feature_broadcast_desc();
					break;
				case 'signthis':
					title = m.feature_signthis_title();
					description = m.feature_signthis_desc();
					break;
				case 'deploy':
					title = m.feature_deploy_title();
					description = m.feature_deploy_desc();
					break;
				case 'callthis':
					title = m.feature_callthis_title();
					description = m.feature_callthis_desc();
					break;
				default:
					title = 'Unknown Feature';
					description = 'Feature description not available';
			}

			return {
				icon,
				title,
				description,
				gradient,
				url
			};
		});
	}
</script>

<!-- Features section with premium flow | 高端流动的功能区 -->
<section
	id="features"
	class="bg-background relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
>
	<!-- Continuous gradient mesh | 连续的渐变网格 -->
	<div class="brand-gradient-mesh absolute inset-0 opacity-30"></div>

	<!-- Flowing orbs for continuity | 流动球体保持连续性 -->
	<div
		class="from-purple/10 absolute -top-96 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b to-transparent blur-3xl"
	></div>

	<!-- Top seamless transition | 顶部无缝过渡 -->
	<div
		class="from-background via-background/80 absolute top-0 right-0 left-0 z-10 h-48 bg-gradient-to-b to-transparent"
	></div>
	<div class="relative z-20 mx-auto max-w-7xl">
		<!-- Premium section header | 高端区块标题 -->
		<div class="mb-12 text-center sm:mb-16 lg:mb-20">
			<!-- Title with gradient accent | 带渐变强调的标题 -->

			<h2 class="mb-4 text-3xl font-black sm:mb-6 sm:text-4xl md:text-6xl">
				<span
					class="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-transparent"
				>
					{m.features_title()}
				</span>
			</h2>
			<!-- Enhanced subtitle | 增强的副标题 -->
			<p
				class="text-muted-foreground/80 mx-auto max-w-3xl px-4 text-lg leading-relaxed font-light sm:text-xl md:text-2xl"
			>
				{m.features_subtitle()}
			</p>

			<!-- Decorative line | 装饰线 -->
			<div class="mt-6 flex justify-center sm:mt-8">
				<div
					class="from-purple to-yellow h-0.5 w-16 rounded-full bg-gradient-to-r opacity-60"
				></div>
			</div>
		</div>

		<!-- Features grid | 功能网格 -->

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
			{#each getFeatures() as feature, index (index)}
				<!-- Premium feature card | 高端功能卡片 -->
				<a
					href={feature.url}
					class="feature-card-wrapper animate-fade-in-up block"
					style="animation-delay: {index * 0.1}s"
				>
					<Card
						class="feature-card group border-foreground/10 bg-card/50 hover:bg-card/90 relative h-full cursor-pointer overflow-hidden backdrop-blur-sm transition-all duration-500"
					>
						<!-- Subtle gradient overlay on hover | 悬停时的微妙渐变叠加 -->
						<div
							class="absolute inset-0 bg-gradient-to-br {feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.02]"
						></div>

						<CardHeader class="relative z-10">
							<!-- Icon container with glow | 带发光效果的图标容器 -->
							<div class="relative mb-4 sm:mb-6">
								<!-- Glow effect | 发光效果 -->
								<div
									class="bg-purple/20 absolute inset-0 rounded-2xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
								></div>
								<!-- Lucide icon with premium styling | 高端风格 Lucide 图标 -->
								<div
									class="text-purple group-hover:text-purple-dark relative mx-auto h-12 w-12 transition-all duration-500 group-hover:scale-110 sm:h-16 sm:w-16"
								>
									<svelte:component this={getIconComponent(feature.icon)} class="h-full w-full" />
								</div>
							</div>
							<!-- Feature title with enhanced readability | 增强可读性的标题 -->
							<CardTitle
								class="text-foreground group-hover:text-purple text-lg font-semibold transition-colors duration-300 sm:text-xl"
							>
								{feature.title}
							</CardTitle>
						</CardHeader>

						<CardContent class="relative z-10">
							<!-- Feature description with enhanced readability | 增强可读性的功能描述 -->
							<CardDescription
								class="text-muted-foreground group-hover:text-foreground/90 text-sm leading-relaxed transition-colors duration-300 sm:text-base"
							>
								{feature.description}
							</CardDescription>
						</CardContent>

						<!-- Premium hover effect | 高端悬停效果 -->
						<div
							class="ring-purple/0 group-hover:ring-purple/30 absolute inset-0 rounded-lg ring-1 transition-all duration-500"
						></div>
					</Card>
				</a>
			{/each}
		</div>
	</div>
	<!-- Bottom seamless transition to next section | 底部到下一区块的无缝过渡 -->
	<div
		class="from-background via-background/80 absolute right-0 bottom-0 left-0 z-10 h-48 bg-gradient-to-t to-transparent"
	></div>
</section>

<style>
	/* Premium card styling | 高端卡片样式 */
	:global(.feature-card) {
		position: relative;
		transition:
			transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.5s ease,
			border-color 0.5s ease;
	}

	:global(.feature-card:hover) {
		transform: translateY(-8px);
		box-shadow:
			0 20px 40px -12px var(--purple) / 20,
			0 8px 16px -8px var(--purple) / 10;
	}

	:global(.feature-card-wrapper) {
		transform-style: preserve-3d;
		perspective: 1000px;
		text-decoration: none;
	}
	/* Fade in up animation | 淡入上升动画 */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.animate-fade-in-up) {
		opacity: 0;
		animation: fadeInUp 0.6s ease-out forwards;
	}
</style>
