<script lang="ts">
	import Hero from '$lib/components/landing/Hero.svelte';
	import Features from '$lib/components/landing/Features.svelte';
	import Stats from '$lib/components/landing/Stats.svelte';
	import Pricing from '$lib/components/landing/Pricing.svelte';
	import FAQs from '$lib/components/landing/FAQs.svelte';
	import CTA from '$lib/components/landing/CTA.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
</script>

<!-- Landing page layout | 着陆页布局 -->
<div class="min-h-screen">
	<!-- Hero section | 主要展示区 -->
	<Hero />

	<!-- Features section | 功能特性区 -->
	<Features />

	<!-- Stats section | 统计数据区 -->
	<Stats />

	<!-- Pricing section | 定价部分 -->
	<Pricing />

	<!-- FAQs section | 常见问题部分 -->
	<FAQs />

	<!-- Call to action | 行动号召区 -->
	<CTA />

	<!-- Footer | 页脚 -->
	<Footer />
</div>
