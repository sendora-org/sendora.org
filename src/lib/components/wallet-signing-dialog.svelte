<!-- Wallet signing dialog component | 钱包签名对话框组件 -->
<script lang="ts">
	import { Loader2, Wallet } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/alert-dialog/index.js';
	import * as m from '$lib/paraglide/messages.js';
	import { connectedWallet } from '$lib/stores/wallet.js';

	// Component props | 组件属性
	interface Props {
		/** Open state | 打开状态 */
		open?: boolean;
		/** Dialog title | 对话框标题 */
		title?: string;
		/** Dialog description | 对话框描述 */
		description?: string;
		/** Close callback | 关闭回调 */
		onclose?: () => void;
	}

	let {
		open = false,
		title = m.wallet_signing_title?.() || 'Signing Request',
		description = m.wallet_signing_description?.() ||
			'Please check your wallet to sign the request',
		onclose
	}: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>{description}</Dialog.Description>
		</Dialog.Header>

		<div class="flex flex-col items-center gap-6 py-8">
			<!-- Wallet icon | 钱包图标 -->
			<div class="relative">
				<div class="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
					{#if $connectedWallet?.icon}
						<img
							src={$connectedWallet.icon}
							alt={$connectedWallet.name}
							class="h-12 w-12 rounded-full"
						/>
					{:else}
						<Wallet class="text-primary h-10 w-10" />
					{/if}
				</div>
				<!-- Loading spinner | 加载动画 -->
				<div class="absolute -top-2 -right-2">
					<Loader2 class="text-primary h-6 w-6 animate-spin" />
				</div>
			</div>

			<!-- Wallet name | 钱包名称 -->
			{#if $connectedWallet}
				<div class="text-center">
					<p class="text-lg font-medium">{$connectedWallet.name}</p>
					<p class="text-muted-foreground text-sm">
						{m.wallet_signing_waiting?.() || 'Waiting for confirmation...'}
					</p>
				</div>
			{/if}

			<!-- Instructions | 说明 -->
			<div class="bg-muted rounded-lg p-4 text-center">
				<p class="text-sm">
					{m.wallet_signing_instructions?.() ||
						'Please open your wallet and confirm the signing request'}
				</p>
			</div>
		</div>

		<!-- Cancel button | 取消按钮 -->
		{#if onclose}
			<Dialog.Footer>
				<Dialog.Cancel>
					{m.cancel()}
				</Dialog.Cancel>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
