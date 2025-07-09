<!-- WalletConnect QR code display component | WalletConnect 二维码显示组件 -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { X, Copy, Smartphone } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as m from '$lib/paraglide/messages.js';

	// Component props | 组件属性
	interface Props {
		/** WalletConnect URI for QR code | 用于二维码的 WalletConnect URI */
		uri: string;
		/** Close callback | 关闭回调 */
		onclose?: () => void;
	}

	let { uri, onclose }: Props = $props();

	// Local state | 本地状态
	let qrCodeDataUrl = $state<string>('');
	let copied = $state(false);

	// Generate QR code on mount | 挂载时生成二维码
	onMount(async () => {
		try {
			// Dynamically import QRCode library | 动态导入 QRCode 库
			const QRCode = (await import('qrcode')).default;
			qrCodeDataUrl = await QRCode.toDataURL(uri, {
				width: 300,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#ffffff'
				}
			});
		} catch (error) {
			console.error('Failed to generate QR code:', error);
		}
	});

	// Copy URI to clipboard | 复制 URI 到剪贴板
	async function copyUri() {
		try {
			await navigator.clipboard.writeText(uri);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (error) {
			console.error('Failed to copy URI:', error);
		}
	}

	// Open URI on mobile | 在移动设备上打开 URI
	function openOnMobile() {
		window.location.href = uri;
	}
</script>

<div class="space-y-6 p-6">
	<!-- Header | 头部 -->
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold">{m.wallet_scan_qr()}</h3>
		<Button variant="ghost" size="icon" onclick={onclose}>
			<X class="h-4 w-4" />
		</Button>
	</div>

	<!-- QR Code | 二维码 -->
	<div class="flex justify-center">
		{#if qrCodeDataUrl}
			<div class="rounded-lg border bg-white p-4 dark:bg-white">
				<img src={qrCodeDataUrl} alt="WalletConnect QR Code" class="h-64 w-64" />
			</div>
		{:else}
			<div class="bg-muted flex h-64 w-64 items-center justify-center rounded-lg border">
				<div class="text-muted-foreground animate-pulse text-sm">{m.wallet_generating_qr()}</div>
			</div>
		{/if}
	</div>

	<!-- Instructions | 说明 -->
	<div class="space-y-2 text-center">
		<p class="text-muted-foreground text-sm">{m.wallet_scan_instructions()}</p>
		<div class="flex items-center justify-center gap-2">
			<span class="text-muted-foreground text-xs">{m.wallet_recommended_wallets()}</span>
		</div>
	</div>

	<!-- Action buttons | 操作按钮 -->
	<div class="grid grid-cols-2 gap-2">
		<Button variant="outline" onclick={copyUri} class="gap-2">
			<Copy class="h-4 w-4" />
			{copied ? m.copied() : m.wallet_copy_uri()}
		</Button>
		<Button variant="outline" onclick={openOnMobile} class="gap-2">
			<Smartphone class="h-4 w-4" />
			{m.wallet_open_mobile()}
		</Button>
	</div>
</div>
