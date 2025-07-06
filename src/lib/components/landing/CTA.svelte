<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages.js';

	// No need for reactive text bindings - use messages directly in template | 无需响应式文本绑定 - 直接在模板中使用消息
</script>

<!-- Seamless CTA section | 无缝行动号召区 -->
<section
	class="bg-background relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
>
	<!-- Continuous mesh background | 连续网格背景 -->
	<div class="brand-gradient-mesh absolute inset-0 opacity-30"></div>

	<!-- Subtle floating orbs | 微妙浮动球体 -->
	<div class="absolute inset-0">
		<div
			class="from-purple/8 animate-float-gentle absolute top-1/4 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br to-transparent blur-3xl"
		></div>
		<div
			class="from-yellow/8 animate-float-gentle absolute -right-32 bottom-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tl to-transparent blur-3xl"
			style="animation-delay: 3s;"
		></div>
	</div>

	<!-- Top seamless transition | 顶部无缝过渡 -->
	<div
		class="from-background via-background/60 absolute top-0 right-0 left-0 z-10 h-32 bg-gradient-to-b to-transparent"
	></div>

	<!-- Elegant CTA content | 优雅行动号召内容 -->
	<div class="relative z-20 mx-auto max-w-4xl text-center">
		<!-- Consistent title styling | 一致的标题样式 -->

		<h2 class="mb-4 px-4 text-3xl font-black sm:mb-6 sm:text-4xl md:text-6xl">
			<span class="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-transparent">
				{m.cta_title()}
			</span>
		</h2>

		<!-- Consistent subtitle styling | 一致的副标题样式 -->
		<p
			class="text-muted-foreground/80 mx-auto mb-8 max-w-3xl px-4 text-lg leading-relaxed font-light sm:mb-12 sm:text-xl md:text-2xl"
		>
			{m.cta_subtitle()}
		</p>

		<!-- Elegant CTA button | 优雅行动按钮 -->
		<div class="relative mb-12 inline-block px-4 sm:mb-16">
			<!-- Subtle glow effect | 微妙发光效果 -->
			<div
				class="bg-purple/20 absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 hover:opacity-100"
			></div>

			<Button
				href="/tools"
				size="lg"
				class="from-purple to-purple-dark hover:from-purple-dark hover:to-purple relative w-full rounded-2xl bg-gradient-to-r px-8 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-auto sm:px-12 sm:py-6 sm:text-lg"
			>
				{m.cta_button_text()}
			</Button>
		</div>
	</div>

	<!-- Bottom seamless transition | 底部无缝过渡 -->
	<div
		class="from-background via-background/60 absolute right-0 bottom-0 left-0 z-10 h-32 bg-gradient-to-t to-transparent"
	></div>
</section>
