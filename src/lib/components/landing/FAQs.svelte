<script lang="ts">
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$lib/components/ui/collapsible';
	import * as m from '$lib/paraglide/messages.js';

	// FAQ item structure | FAQ 项目结构
	interface FAQItem {
		question: string;
		answer: string;
	}

	// FAQ state management | FAQ 状态管理
	let openItems = $state<Set<number>>(new Set());

	// Get FAQs dynamically | 动态获取 FAQ
	function getFAQs(): FAQItem[] {
		return [
			{
				question: m.faq_q1(),
				answer: m.faq_a1()
			},
			{
				question: m.faq_q2(),
				answer: m.faq_a2()
			},
			{
				question: m.faq_q3(),
				answer: m.faq_a3()
			},
			{
				question: m.faq_q4(),
				answer: m.faq_a4()
			},
			{
				question: m.faq_q5(),
				answer: m.faq_a5()
			},
			{
				question: m.faq_q6(),
				answer: m.faq_a6()
			}
		];
	}

	// Toggle FAQ item | 切换 FAQ 项目
	function toggleItem(index: number) {
		const newOpenItems = new Set(openItems);
		if (newOpenItems.has(index)) {
			newOpenItems.delete(index);
		} else {
			newOpenItems.add(index);
		}
		openItems = newOpenItems;
	}
</script>

<!-- Premium FAQs section with continuity | 连续性的高端常见问题区 -->
<section id="faqs" class="relative overflow-hidden px-4 py-32 sm:px-6 lg:px-8">
	<!-- Continuous mesh background | 连续网格背景 -->
	<div class="brand-gradient-mesh absolute inset-0 opacity-20"></div>

	<!-- Subtle flowing orbs | 微妙流动球体 -->
	<div
		class="from-purple/8 absolute top-1/4 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br to-transparent blur-3xl"
	></div>
	<div
		class="from-yellow/8 absolute -right-32 bottom-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tl to-transparent blur-3xl"
	></div>

	<!-- Top seamless transition | 顶部无缝过渡 -->
	<div
		class="from-background via-background/60 absolute top-0 right-0 left-0 z-10 h-32 bg-gradient-to-b to-transparent"
	></div>

	<div class="relative z-20 mx-auto max-w-4xl">
		<!-- Premium section header | 高端区块标题 -->
		<div class="mb-20 text-center">
			<!-- Title with gradient | 带渐变的标题 -->

			<h2 class="mb-6 text-4xl font-black md:text-6xl">
				<span
					class="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-transparent"
				>
					{m.faqs_title()}
				</span>
			</h2>
			<!-- Enhanced subtitle | 增强的副标题 -->
			<p
				class="text-muted-foreground/80 mx-auto max-w-3xl text-xl leading-relaxed font-light md:text-2xl"
			>
				{m.faqs_subtitle()}
			</p>

			<!-- Decorative element | 装饰元素 -->
			<div class="mt-8 flex justify-center">
				<div
					class="from-purple to-yellow h-0.5 w-16 rounded-full bg-gradient-to-r opacity-60"
				></div>
			</div>
		</div>

		<!-- FAQ items | FAQ 项目 -->

		<div class="space-y-4">
			{#each getFAQs() as faq, index (index)}
				<!-- Premium FAQ item | 高端 FAQ 项目 -->
				<div class="faq-item-wrapper">
					<Collapsible
						class="faq-item group border-foreground/10 bg-card/30 hover:border-purple/30 hover:bg-card/50 rounded-2xl border backdrop-blur-sm transition-all duration-500 {openItems.has(
							index
						)
							? 'border-purple/40 bg-card/60'
							: ''}"
						onOpenChange={() => toggleItem(index)}
					>
						<!-- Enhanced glow effect | 增强发光效果 -->
						<div
							class="from-purple/5 to-yellow/5 absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100"
						></div>

						<CollapsibleTrigger
							class="group-hover:text-foreground relative z-10 flex w-full items-center justify-between p-8 text-left transition-all duration-300"
						>
							<!-- Enhanced question | 增强问题 -->
							<span
								class="pr-4 text-lg font-semibold md:text-xl {openItems.has(index)
									? 'text-purple'
									: ''}"
							>
								{faq.question}
							</span>
							<!-- Premium arrow icon | 高端箭头图标 -->
							<div
								class="from-purple/20 to-yellow/20 group-hover:from-purple/30 group-hover:to-yellow/30 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r transition-all duration-300"
							>
								<svg
									class="text-purple h-4 w-4 transition-transform duration-300 {openItems.has(index)
										? 'rotate-180'
										: ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									></path>
								</svg>
							</div>
						</CollapsibleTrigger>

						<CollapsibleContent class="relative z-10 px-8 pb-8">
							<!-- Enhanced answer | 增强答案 -->
							<div class="border-foreground/10 border-t pt-6">
								<p class="text-muted-foreground/90 text-base leading-relaxed">
									{faq.answer}
								</p>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</div>
			{/each}
		</div>

		<!-- Premium contact section | 高端联系部分 -->

		<div class="relative mt-20 text-center">
			<!-- Contact card with gradient background | 带渐变背景的联系卡片 -->
			<div
				class="bg-card/40 border-foreground/10 relative overflow-hidden rounded-3xl border p-12 backdrop-blur-sm"
			>
				<!-- Subtle gradient overlay | 微妙渐变叠加 -->
				<div class="from-purple/5 to-yellow/5 absolute inset-0 bg-gradient-to-br"></div>

				<div class="relative z-10">
					<h3
						class="from-purple to-purple-dark mb-4 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent"
					>
						{m.faq_still_questions()}
					</h3>
					<p class="text-muted-foreground/80 mx-auto mb-8 max-w-2xl text-lg">
						{m.faq_contact_text()}
					</p>

					<!-- Premium contact buttons | 高端联系按钮 -->
					<div class="flex flex-col justify-center gap-4 sm:flex-row">
						<a
							href="https://discord.gg/YQp7fzv2G5"
							target="_blank"
							rel="noopener noreferrer"
							class="from-purple to-purple-dark hover:from-purple-dark hover:to-purple inline-flex items-center gap-3 rounded-xl bg-gradient-to-r px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
						>
							<!-- Discord icon | Discord 图标 -->
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"
								/>
							</svg>
							{m.button_join_discord()}
						</a>
						<a
							href="mailto:garyshay@proton.me"
							class="border-purple/50 text-purple hover:bg-purple hover:border-purple inline-flex items-center gap-3 rounded-xl border px-8 py-4 font-semibold backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:text-white"
						>
							<!-- Email icon | 邮件图标 -->
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								></path>
							</svg>
							{m.button_email_support()}
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Bottom seamless transition | 底部无缝过渡 -->
	<div
		class="from-background via-background/60 absolute right-0 bottom-0 left-0 z-10 h-32 bg-gradient-to-t to-transparent"
	></div>
</section>
