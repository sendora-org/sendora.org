<script lang="ts">
	import ThemeToggle from '$lib/components/ui/theme-toggle.svelte';
	import LangToggle from '$lib/components/ui/lang-toggle.svelte';
</script>

<!-- Footer section | 页脚区域 -->
<footer class="bg-background/50 border-t px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
	<div class="mx-auto max-w-7xl">
		<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
			<!-- Left side - Brand and copyright | 左侧 - 品牌和版权 -->
			<div class="flex flex-col items-center gap-4 sm:items-start">
				<!-- Logo and brand | 标志和品牌 -->
				<div class="flex items-center gap-2">
					<img src="/logo.svg" alt="Sendora Logo" class="h-8 w-8 rounded-lg" />
					<h3 class="text-xl font-bold">
						<span class="text-purple">Sendora</span><span class="text-yellow">.org</span>
					</h3>
				</div>
				<!-- Social media and links section | 社交媒体和链接部分 -->
				<!-- border-foreground/10 mt-8 border-t pt-8 -->
				<div class="">
					<!-- Social media icons | 社交媒体图标 -->
					<div class="flex flex-wrap justify-center gap-4">
						<!-- GitHub | GitHub -->
						<a
							href="https://github.com/sendora-org"
							target="_blank"
							rel="noopener noreferrer"
							class="bg-muted hover:bg-purple flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:text-white"
							aria-label="GitHub"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
								/>
							</svg>
						</a>

						<!-- Twitter/X | 推特/X -->
						<a
							href="https://x.com/sendora_org"
							target="_blank"
							rel="noopener noreferrer"
							class="bg-muted hover:bg-purple flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:text-white"
							aria-label="Twitter"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
								/>
							</svg>
						</a>

						<!-- Discord | Discord -->
						<a
							href="https://discord.gg/YQp7fzv2G5"
							target="_blank"
							rel="noopener noreferrer"
							class="bg-muted hover:bg-purple flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:text-white"
							aria-label="Discord"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"
								/>
							</svg>
						</a>

						<!-- Telegram | 电报 -->
						<a
							href="https://t.me/+8LCvYzchyF01ZGI9"
							target="_blank"
							rel="noopener noreferrer"
							class="bg-muted hover:bg-purple flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:text-white"
							aria-label="Telegram"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z"
								/>
							</svg>
						</a>
					</div>
				</div>
			</div>

			<!-- Right side - Language and theme controls | 右侧 - 语言和主题控制 -->
			<div class="flex items-center gap-4">
				<!-- Language switcher | 语言切换器 -->
				<LangToggle />
				<!-- Theme toggle | 主题切换 -->
				<ThemeToggle />
			</div>
		</div>
	</div>
</footer>

<style>
</style>
