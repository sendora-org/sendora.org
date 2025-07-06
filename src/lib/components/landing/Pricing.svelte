<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	// import PaymentModal from '$lib/components/payment/PaymentModal.svelte';
	import * as m from '$lib/paraglide/messages.js';

	// Pricing plan structure | 定价方案结构
	interface PricingPlan {
		name: string;
		price: string;
		period: string;
		description: string;
		features: string[];
		highlighted?: boolean;
		ctaText: string;
	}

	// Payment modal state | 支付模态框状态
	// let showPaymentModal = $state(false);
	// let selectedPlan = $state<PricingPlan | null>(null);

	// Handle purchase button click | 处理购买按钮点击
	// function handlePurchaseClick(plan: PricingPlan) {
	// 	selectedPlan = plan;
	// 	showPaymentModal = true;
	// }

	// Get pricing plans dynamically | 动态获取定价方案
	function getPlans(): PricingPlan[] {
		return [
			{
				name: m.pricing_free_name(),
				price: m.pricing_free_price(),
				period: m.pricing_free_period(),
				description: m.pricing_free_desc(),
				features: [
					m.pricing_free_feature1(),
					m.pricing_free_feature2(),
					m.pricing_free_feature3(),
					m.pricing_free_feature4()
				],
				ctaText: m.pricing_free_cta()
			},
			{
				name: m.pricing_pro_name(),
				price: m.pricing_pro_price(),
				period: m.pricing_pro_period(),
				description: m.pricing_pro_desc(),
				features: [
					m.pricing_pro_feature1(),
					m.pricing_pro_feature2(),
					m.pricing_pro_feature3(),
					// m.pricing_pro_feature4(),
					m.pricing_pro_feature5()
				],
				highlighted: true,
				ctaText: m.pricing_pro_cta()
			},
			{
				name: m.pricing_enterprise_name(),
				price: m.pricing_enterprise_price(),
				period: m.pricing_enterprise_period(),
				description: m.pricing_enterprise_desc(),
				features: [
					m.pricing_enterprise_feature1(),
					m.pricing_enterprise_feature2(),
					m.pricing_enterprise_feature3(),
					m.pricing_enterprise_feature4(),
					m.pricing_enterprise_feature5()
				],
				ctaText: m.pricing_enterprise_cta()
			}
		];
	}
</script>

<!-- Premium pricing section with continuity | 连续性的高端定价区 -->
<section id="pricing" class="relative overflow-hidden px-4 py-32 sm:px-6 lg:px-8">
	<!-- Continuous gradient mesh | 连续渐变网格 -->
	<div class="brand-gradient-mesh absolute inset-0 opacity-30"></div>

	<!-- Flowing orbs for depth | 流动球体增加深度 -->
	<div
		class="from-purple/10 absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br to-transparent blur-3xl"
	></div>
	<div
		class="from-yellow/10 absolute right-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-gradient-to-tl to-transparent blur-3xl"
	></div>

	<!-- Top seamless transition | 顶部无缝过渡 -->
	<div
		class="from-background via-background/60 absolute top-0 right-0 left-0 z-10 h-32 bg-gradient-to-b to-transparent"
	></div>

	<div class="relative z-20 mx-auto max-w-7xl">
		<!-- Premium section header | 高端区块标题 -->
		<div class="mb-20 text-center">
			<!-- Title with gradient | 带渐变的标题 -->

			<h2 class="mb-6 text-4xl font-black md:text-6xl">
				<span
					class="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-transparent"
				>
					{m.pricing_title()}
				</span>
			</h2>
			<!-- Enhanced subtitle | 增强的副标题 -->
			<p
				class="text-muted-foreground/80 mx-auto max-w-3xl text-xl leading-relaxed font-light md:text-2xl"
			>
				{m.pricing_subtitle()}
			</p>

			<!-- Decorative element | 装饰元素 -->
			<div class="mt-8 flex justify-center">
				<div
					class="from-purple to-yellow h-0.5 w-16 rounded-full bg-gradient-to-r opacity-60"
				></div>
			</div>
		</div>

		<!-- Pricing cards | 定价卡片 -->

		<div class="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
			{#each getPlans() as plan, index (index)}
				<!-- Premium pricing card | 高端定价卡片 -->
				<div class="pricing-card-wrapper relative">
					{#if plan.highlighted}
						<!-- Premium glow effect | 高端发光效果 -->
						<div
							class="from-purple/20 to-yellow/20 absolute inset-0 rounded-2xl bg-gradient-to-br blur-xl"
						></div>
						<!-- Popular badge with enhanced styling | 增强样式的热门徽章 -->
						<div class="absolute -top-6 left-1/2 z-30 -translate-x-1/2">
							<div
								class="from-purple to-purple-dark rounded-full bg-gradient-to-r px-6 py-2 text-sm font-bold text-white shadow-lg"
							>
								<span class="flex items-center gap-2">
									<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
										<path
											d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
										/>
									</svg>
									POPULAR
								</span>
							</div>
						</div>
					{/if}

					<Card
						class="pricing-card border-foreground/10 bg-card/60 relative h-full backdrop-blur-sm {plan.highlighted
							? 'border-purple/30 scale-105 transform shadow-2xl'
							: 'hover:border-purple/20'} transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
					>
						<!-- Premium card header | 高端卡片头部 -->
						<CardHeader class="relative pb-8 text-center">
							{#if plan.highlighted}
								<!-- Gradient overlay for highlighted plan | 突出方案的渐变叠加 -->
								<div
									class="from-purple/5 to-yellow/5 absolute inset-0 rounded-t-lg bg-gradient-to-br"
								></div>
							{/if}
							<div class="relative z-10">
								<!-- Plan name with enhanced styling | 增强样式的方案名称 -->
								<CardTitle
									class="mb-3 text-2xl font-bold {plan.highlighted
										? 'from-purple to-purple-dark bg-gradient-to-r bg-clip-text text-transparent'
										: 'text-foreground'}"
								>
									{plan.name}
								</CardTitle>
								<!-- Enhanced description | 增强描述 -->
								<CardDescription class="mb-6 text-base">{plan.description}</CardDescription>
								<!-- Premium price display | 高端价格显示 -->
								<div class="flex items-baseline justify-center gap-1">
									<span
										class="text-5xl font-black {plan.highlighted
											? 'from-purple to-purple-dark bg-gradient-to-r bg-clip-text text-transparent'
											: 'text-foreground'}"
									>
										{plan.price}
									</span>
									<span class="text-muted-foreground font-medium">/{plan.period}</span>
								</div>
							</div>
						</CardHeader>

						<CardContent class="space-y-6">
							<!-- Enhanced features list | 增强的功能列表 -->
							<ul class="space-y-4">
								{#each plan.features as feature, index (index)}
									<li class="group flex items-start gap-3">
										<!-- Premium check icon | 高端勾选图标 -->
										<div
											class="from-purple to-purple-dark mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r transition-transform duration-300 group-hover:scale-110"
										>
											<svg
												class="h-3 w-3 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												></path>
											</svg>
										</div>
										<span
											class="text-foreground/90 group-hover:text-foreground text-base font-medium transition-colors duration-300"
											>{feature}</span
										>
									</li>
								{/each}
							</ul>

							<!-- Premium CTA button | 高端行动按钮 -->
							<!-- 		onclick={() => handlePurchaseClick(plan)} -->
							<Button
								class="w-full py-6 text-lg font-semibold transition-all duration-300 {plan.highlighted
									? 'from-purple to-purple-dark hover:from-purple-dark hover:to-purple bg-gradient-to-r text-white shadow-lg hover:shadow-xl'
									: 'border-foreground/20 hover:border-purple/50 hover:bg-purple/5'}"
								variant={plan.highlighted ? 'default' : 'outline'}
							>
								{plan.ctaText}
							</Button>
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>

		<!-- Enhanced additional info | 增强的额外信息 -->

		<div class="mt-16 text-center">
			<div
				class="bg-card/30 border-foreground/10 inline-block rounded-2xl border p-6 backdrop-blur-sm"
			>
				<p class="text-muted-foreground/80 mb-2 text-sm">{m.pricing_note()}</p>
				<p class="text-muted-foreground/80 text-sm">
					{m.pricing_custom_plan()}
					<a
						href="#contact"
						class="text-purple hover:text-purple-dark font-medium transition-colors duration-300 hover:underline"
					>
						{m.pricing_contact_us()}
					</a>
				</p>
			</div>
		</div>
	</div>

	<!-- Bottom seamless transition | 底部无缝过渡 -->
	<div
		class="from-background via-background/60 absolute right-0 bottom-0 left-0 z-10 h-32 bg-gradient-to-t to-transparent"
	></div>
</section>

<!-- Payment Modal | 支付模态框 -->
<!-- <PaymentModal bind:open={showPaymentModal} bind:plan={selectedPlan} /> -->
