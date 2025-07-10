<script lang="ts">
	// SvelteKit imports | SvelteKit 导入
	import * as m from '$lib/paraglide/messages.js';

	// Component imports | 组件导入
	import ToolPageLayout from '$lib/components/tool-page-layout.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import CopyButton from '$lib/components/ui/copy-button.svelte';
	import HelpSection from '$lib/components/ui/help-section.svelte';
	import SuccessResult from '$lib/components/ui/success-result.svelte';
	import ErrorResult from '$lib/components/ui/error-result.svelte';
	import NetworkDisplay from '$lib/components/ui/network-display.svelte';
	import TabNavigation from '$lib/components/ui/tab-navigation.svelte';

	// Store imports | 存储导入
	import { selectedNetwork } from '$lib/stores/networks';
	import { currentProvider, currentAccount } from '$lib/stores/wallet';

	// Service imports | 服务导入
	import { SigningService } from '$lib/services/signing-service';
	import type { SignatureResult, TypedData } from '$lib/services/signing-service';

	// Icon imports | 图标导入
	import { FileText, Hash, CheckCircle, Shield, Loader2, AlertCircle } from '@lucide/svelte';

	// Component state | 组件状态
	let activeTab = $state<'message' | 'raw' | 'typed_data' | 'verify'>('message');
	let isLoading = $state(false);

	// Personal message state | 个人消息状态
	let personalMessage = $state('');
	let personalResult = $state<SignatureResult | null>(null);

	// Raw message state | 原始消息状态
	let rawMessage = $state('');
	let rawResult = $state<SignatureResult | null>(null);
	let textToConvert = $state('');

	// Typed data state | 类型化数据状态
	let typedDataInput = $state('');
	let typedDataResult = $state<SignatureResult | null>(null);

	// Verification state | 验证状态
	let verifySignature = $state('');
	let verifyMessage = $state('');
	let verifyAddress = $state('');
	let verifyType = $state<'message' | 'raw' | 'typed_data'>('message');
	let verifyChainId = $state('');
	let verificationResult = $state<{
		isValid: boolean;
		verifiedAt: number;
		verifiedOnChainId?: number;
		verificationMethod?: string;
		errorMessage?: string;
	} | null>(null);

	// Error state | 错误状态
	let error = $state<string | null>(null);

	// Help steps data | 帮助步骤数据
	let helpSteps = $derived.by(() => [
		{ label: '', content: m.signthis_help_step1() },
		{ label: '', content: m.signthis_help_step2() },
		{ label: '', content: m.signthis_help_step3() },
		{ label: '', content: m.signthis_help_step4() },
		{ label: '', content: m.signthis_help_step5() }
	]);

	// Tab navigation data | 标签导航数据
	let tabItems = $derived.by(() => [
		{
			id: 'message',
			label: m.signthis_message_signing(),
			icon: FileText
		},
		{
			id: 'raw',
			label: m.signthis_raw_message_signing(),
			icon: Hash
		},
		{
			id: 'typed_data',
			label: m.signthis_typed_data_signing(),
			icon: FileText
		},
		{
			id: 'verify',
			label: m.signthis_verification_section(),
			icon: CheckCircle
		}
	]);

	// Check if wallet is connected | 检查钱包是否连接
	let isWalletConnected = $derived($currentProvider && $currentAccount);

	// Sign personal message | 签署个人消息
	async function signPersonalMessage() {
		if (!personalMessage.trim()) {
			error = 'Please enter a message to sign';
			return;
		}

		isLoading = true;
		error = null;
		personalResult = null;

		try {
			const result = await SigningService.signPersonalMessage(personalMessage);
			personalResult = result;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to sign message';
		} finally {
			isLoading = false;
		}
	}

	// Sign raw message | 签署原始消息
	async function signRawMessage() {
		if (!rawMessage.trim()) {
			error = 'Please enter hex data to sign';
			return;
		}

		if (!rawMessage.startsWith('0x')) {
			error = 'Raw message must start with 0x';
			return;
		}

		isLoading = true;
		error = null;
		rawResult = null;

		try {
			const result = await SigningService.signRawMessage(rawMessage);
			rawResult = result;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to sign raw message';
		} finally {
			isLoading = false;
		}
	}

	// Sign typed data | 签署类型化数据
	async function signTypedData() {
		if (!typedDataInput.trim()) {
			error = 'Please enter typed data to sign';
			return;
		}

		isLoading = true;
		error = null;
		typedDataResult = null;

		try {
			const typedData = JSON.parse(typedDataInput) as TypedData;
			const result = await SigningService.signTypedData(typedData);
			typedDataResult = result;
		} catch (err) {
			if (err instanceof SyntaxError) {
				error = m.signthis_error_invalid_json();
			} else {
				error = err instanceof Error ? err.message : 'Failed to sign typed data';
			}
		} finally {
			isLoading = false;
		}
	}

	// Verify signature | 验证签名
	async function verifySignatureAction() {
		if (!verifySignature.trim() || !verifyMessage.trim() || !verifyAddress.trim()) {
			error = 'Please fill in all required fields';
			return;
		}

		isLoading = true;
		error = null;
		verificationResult = null;

		try {
			// Ensure verifyChainId is a string and handle edge cases | 确保 verifyChainId 是字符串并处理边缘情况
			const chainIdStr = String(verifyChainId || '').trim();
			const chainId = chainIdStr ? parseInt(chainIdStr) : undefined;
			const result = await SigningService.verifySignatureComprehensive({
				signature: verifySignature,
				message: verifyMessage,
				signerAddress: verifyAddress as `0x${string}`,
				signatureType: verifyType,
				chainId
			});

			verificationResult = {
				isValid: result.isValid,
				verifiedAt: result.verifiedAt,
				verifiedOnChainId: result.verifiedOnChainId,
				verificationMethod: result.verificationMethod,
				errorMessage: result.errorMessage
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to verify signature';
		} finally {
			isLoading = false;
		}
	}

	// Convert text to hex | 将文本转换为十六进制
	function convertTextToHex() {
		if (textToConvert.trim()) {
			rawMessage = SigningService.stringToHex(textToConvert);
		}
	}

	// Load example typed data | 加载示例类型化数据
	function loadExampleTypedData() {
		const example = SigningService.getExampleTypedData();
		typedDataInput = JSON.stringify(example, null, 2);
	}

	// Load example raw data | 加载示例原始数据
	function loadExampleRawData() {
		rawMessage = SigningService.getExampleRawMessageData();
	}

	// Clear form | 清空表单
	function clearForm() {
		personalMessage = '';
		personalResult = null;
		rawMessage = '';
		rawResult = null;
		textToConvert = '';
		typedDataInput = '';
		typedDataResult = null;
		verifySignature = '';
		verifyMessage = '';
		verifyAddress = '';
		verifyChainId = '';
		verificationResult = null;
		error = null;
	}

	// Format timestamp | 格式化时间戳
	function formatTimestamp(timestamp: number): string {
		return new Date(timestamp).toLocaleString();
	}
</script>

<ToolPageLayout
	title={m.signthis_title()}
	description={m.signthis_description()}
	pageTitle={m.tools_signthis_title()}
>
	<div class="space-y-6">
		<!-- Network and Wallet Status | 网络和钱包状态 -->
		<NetworkDisplay network={$selectedNetwork} />
		{#if !isWalletConnected}
			<div class="flex items-center gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950">
				<AlertCircle class="size-4 text-amber-600 dark:text-amber-400" />
				<div class="text-sm text-amber-700 dark:text-amber-300">
					{m.wallet_connect()}
				</div>
			</div>
		{/if}

		<!-- Smart Contract Wallet Support Note | 智能合约钱包支持说明 -->
		<Card class="p-6">
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<Shield class="size-5 text-blue-600 dark:text-blue-400" />
					<h3 class="text-lg font-semibold">{m.signthis_smart_wallet_note()}</h3>
				</div>
				<p class="text-muted-foreground text-sm">{m.signthis_smart_wallet_desc()}</p>
			</div>
		</Card>

		<!-- Tab Navigation | 标签导航 -->
		<TabNavigation
			tabs={tabItems}
			{activeTab}
			onTabChange={(tabId) => {
				activeTab = tabId as 'message' | 'raw' | 'typed_data' | 'verify';
				error = null;
			}}
			variant="pills"
			size="sm"
		/>

		<!-- Personal Message Signing | 个人消息签名 -->
		{#if activeTab === 'message'}
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h3 class="mb-2 text-lg font-semibold">{m.signthis_message_signing()}</h3>
						<p class="text-muted-foreground mb-4 text-sm">{m.signthis_message_signing_desc()}</p>

						<Textarea
							bind:value={personalMessage}
							placeholder={m.signthis_personal_message_placeholder()}
							class="max-h-48 min-h-32 font-mono"
							disabled={isLoading || !isWalletConnected}
						/>

						<div class="text-muted-foreground mt-2 text-xs">
							{m.signthis_personal_message_example({ timestamp: new Date().toISOString() })}
						</div>
					</div>

					<div class="flex gap-2">
						<Button
							onclick={signPersonalMessage}
							disabled={!personalMessage.trim() || isLoading || !isWalletConnected}
							class="flex-1"
						>
							{#if isLoading}
								<Loader2 class="size-4 animate-spin" />
								{m.signthis_sign_button_signing()}
							{:else}
								<FileText class="size-4" />
								{m.signthis_sign_button()}
							{/if}
						</Button>
						<Button variant="outline" onclick={clearForm}>
							{m.signthis_clear_form()}
						</Button>
					</div>
				</div>
			</Card>

			<!-- Personal Message Result | 个人消息结果 -->
			{#if personalResult}
				<Card class="p-6">
					<SuccessResult
						title={m.signthis_signature_result()}
						description="Message signed successfully"
						hashLabel={m.signthis_message_hash()}
						hashValue={personalResult.messageHash}
						copyLabel={m.signthis_signature_copy()}
						copiedLabel={m.signthis_signature_copied()}
					/>

					<div class="mt-4 space-y-3">
						<!-- Signature | 签名 -->
						<div class="space-y-2">
							<div class="text-sm font-medium">{m.signthis_signature_value()}</div>
							<div class="bg-muted flex items-center gap-2 rounded-lg p-3">
								<code class="flex-1 font-mono text-sm break-all">{personalResult.signature}</code>
								<CopyButton
									text={personalResult.signature}
									copyLabel={m.signthis_signature_copy()}
									copiedLabel={m.signthis_signature_copied()}
								/>
							</div>
						</div>

						<!-- Additional Info | 附加信息 -->
						<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
							<div>
								<div class="mb-1 font-medium">{m.signthis_signer_address()}</div>
								<div class="text-muted-foreground font-mono">{personalResult.signerAddress}</div>
							</div>
							<div>
								<div class="mb-1 font-medium">{m.signthis_timestamp()}</div>
								<div class="text-muted-foreground">{formatTimestamp(personalResult.timestamp)}</div>
							</div>
						</div>
					</div>
				</Card>
			{/if}
		{/if}

		<!-- Raw Message Signing | 原始消息签名 -->
		{#if activeTab === 'raw'}
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h3 class="mb-2 text-lg font-semibold">{m.signthis_raw_message_signing()}</h3>
						<p class="text-muted-foreground mb-4 text-sm">
							{m.signthis_raw_message_signing_desc()}
						</p>

						<!-- Text to Hex Converter | 文本到十六进制转换器 -->
						<div class="mb-4 space-y-2">
							<div class="text-sm font-medium">{m.signthis_text_to_hex()}</div>
							<div class="flex gap-2">
								<Input
									bind:value={textToConvert}
									placeholder="Enter text to convert..."
									class="flex-1"
								/>
								<Button variant="outline" onclick={convertTextToHex}>Convert</Button>
							</div>
						</div>

						<Textarea
							bind:value={rawMessage}
							placeholder={m.signthis_raw_message_placeholder()}
							class="max-h-48 min-h-32 font-mono"
							disabled={isLoading || !isWalletConnected}
						/>

						<div class="text-muted-foreground mt-2 text-xs">
							{m.signthis_raw_message_helper()}
						</div>
					</div>

					<div class="flex gap-2">
						<Button
							onclick={signRawMessage}
							disabled={!rawMessage.trim() || isLoading || !isWalletConnected}
							class="flex-1"
						>
							{#if isLoading}
								<Loader2 class="size-4 animate-spin" />
								{m.signthis_sign_button_signing()}
							{:else}
								<Hash class="size-4" />
								{m.signthis_sign_button()}
							{/if}
						</Button>
						<Button variant="outline" onclick={loadExampleRawData}>Example</Button>
						<Button variant="outline" onclick={clearForm}>
							{m.signthis_clear_form()}
						</Button>
					</div>
				</div>
			</Card>

			<!-- Raw Message Result | 原始消息结果 -->
			{#if rawResult}
				<Card class="p-6">
					<SuccessResult
						title={m.signthis_signature_result()}
						description="Raw message signed successfully"
						hashLabel={m.signthis_message_hash()}
						hashValue={rawResult.messageHash}
						copyLabel={m.signthis_signature_copy()}
						copiedLabel={m.signthis_signature_copied()}
					/>

					<div class="mt-4 space-y-3">
						<!-- Signature | 签名 -->
						<div class="space-y-2">
							<div class="text-sm font-medium">{m.signthis_signature_value()}</div>
							<div class="bg-muted flex items-center gap-2 rounded-lg p-3">
								<code class="flex-1 font-mono text-sm break-all">{rawResult.signature}</code>
								<CopyButton
									text={rawResult.signature}
									copyLabel={m.signthis_signature_copy()}
									copiedLabel={m.signthis_signature_copied()}
								/>
							</div>
						</div>

						<!-- Hex to Text Preview | 十六进制到文本预览 -->
						<div class="space-y-2">
							<div class="text-sm font-medium">{m.signthis_hex_to_text()}</div>
							<div class="bg-muted rounded-lg p-3">
								<code class="text-sm">{SigningService.hexToString(rawResult.originalMessage)}</code>
							</div>
						</div>

						<!-- Additional Info | 附加信息 -->
						<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
							<div>
								<div class="mb-1 font-medium">{m.signthis_signer_address()}</div>
								<div class="text-muted-foreground font-mono">{rawResult.signerAddress}</div>
							</div>
							<div>
								<div class="mb-1 font-medium">{m.signthis_timestamp()}</div>
								<div class="text-muted-foreground">{formatTimestamp(rawResult.timestamp)}</div>
							</div>
						</div>
					</div>
				</Card>
			{/if}
		{/if}

		<!-- Typed Data Signing | 类型化数据签名 -->
		{#if activeTab === 'typed_data'}
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h3 class="mb-2 text-lg font-semibold">{m.signthis_typed_data_signing()}</h3>
						<p class="text-muted-foreground mb-4 text-sm">{m.signthis_typed_data_signing_desc()}</p>

						<Textarea
							bind:value={typedDataInput}
							placeholder={m.signthis_typed_data_placeholder()}
							class="max-h-64 min-h-32 font-mono"
							disabled={isLoading || !isWalletConnected}
						/>
					</div>

					<div class="flex gap-2">
						<Button
							onclick={signTypedData}
							disabled={!typedDataInput.trim() || isLoading || !isWalletConnected}
							class="flex-1"
						>
							{#if isLoading}
								<Loader2 class="size-4 animate-spin" />
								{m.signthis_sign_button_signing()}
							{:else}
								<FileText class="size-4" />
								{m.signthis_sign_button()}
							{/if}
						</Button>
						<Button variant="outline" onclick={loadExampleTypedData}>
							{m.signthis_typed_data_example()}
						</Button>
						<Button variant="outline" onclick={clearForm}>
							{m.signthis_clear_form()}
						</Button>
					</div>
				</div>
			</Card>

			<!-- Typed Data Result | 类型化数据结果 -->
			{#if typedDataResult}
				<Card class="p-6">
					<SuccessResult
						title={m.signthis_signature_result()}
						description="Typed data signed successfully"
						hashLabel={m.signthis_message_hash()}
						hashValue={typedDataResult.messageHash}
						copyLabel={m.signthis_signature_copy()}
						copiedLabel={m.signthis_signature_copied()}
					/>

					<div class="mt-4 space-y-3">
						<!-- Signature | 签名 -->
						<div class="space-y-2">
							<div class="text-sm font-medium">{m.signthis_signature_value()}</div>
							<div class="bg-muted flex items-center gap-2 rounded-lg p-3">
								<code class="flex-1 font-mono text-sm break-all">{typedDataResult.signature}</code>
								<CopyButton
									text={typedDataResult.signature}
									copyLabel={m.signthis_signature_copy()}
									copiedLabel={m.signthis_signature_copied()}
								/>
							</div>
						</div>

						<!-- Additional Info | 附加信息 -->
						<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
							<div>
								<div class="mb-1 font-medium">{m.signthis_signer_address()}</div>
								<div class="text-muted-foreground font-mono">{typedDataResult.signerAddress}</div>
							</div>
							<div>
								<div class="mb-1 font-medium">{m.signthis_timestamp()}</div>
								<div class="text-muted-foreground">
									{formatTimestamp(typedDataResult.timestamp)}
								</div>
							</div>
						</div>
					</div>
				</Card>
			{/if}
		{/if}

		<!-- Signature Verification | 签名验证 -->
		{#if activeTab === 'verify'}
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h3 class="mb-2 text-lg font-semibold">{m.signthis_verification_section()}</h3>
						<p class="text-muted-foreground mb-4 text-sm">
							{m.signthis_verification_description()}
						</p>
					</div>

					<div class="space-y-4">
						<!-- Signature Input | 签名输入 -->
						<div class="space-y-2">
							<label for="verify-signature" class="text-sm font-medium"
								>{m.signthis_verification_signature()}</label
							>
							<Textarea
								id="verify-signature"
								bind:value={verifySignature}
								placeholder={m.signthis_verification_signature_placeholder()}
								class="max-h-32 min-h-20 font-mono"
								disabled={isLoading}
							/>
						</div>

						<!-- Message Input | 消息输入 -->
						<div class="space-y-2">
							<label for="verify-message" class="text-sm font-medium"
								>{m.signthis_verification_message()}</label
							>
							<Textarea
								id="verify-message"
								bind:value={verifyMessage}
								placeholder={m.signthis_verification_message_placeholder()}
								class="max-h-32 min-h-20"
								disabled={isLoading}
							/>
						</div>

						<!-- Address Input | 地址输入 -->
						<div class="space-y-2">
							<label for="verify-address" class="text-sm font-medium"
								>{m.signthis_verification_address()}</label
							>
							<Input
								id="verify-address"
								bind:value={verifyAddress}
								placeholder={m.signthis_verification_address_placeholder()}
								class="font-mono"
								disabled={isLoading}
							/>
						</div>

						<!-- Signature Type | 签名类型 -->
						<div class="space-y-2">
							<span class="text-sm font-medium">{m.signthis_verification_type()}</span>
							<div class="flex gap-2">
								<Button
									variant={verifyType === 'message' ? 'default' : 'outline'}
									size="sm"
									onclick={() => (verifyType = 'message')}
								>
									Message
								</Button>
								<Button
									variant={verifyType === 'raw' ? 'default' : 'outline'}
									size="sm"
									onclick={() => (verifyType = 'raw')}
								>
									Raw
								</Button>
								<Button
									variant={verifyType === 'typed_data' ? 'default' : 'outline'}
									size="sm"
									onclick={() => (verifyType = 'typed_data')}
								>
									Typed Data
								</Button>
							</div>
						</div>

						<!-- Chain ID (Optional) | 链 ID（可选） -->
						<div class="space-y-2">
							<label for="verify-chain-id" class="text-sm font-medium"
								>{m.signthis_verification_chain_id()}</label
							>
							<Input
								id="verify-chain-id"
								bind:value={verifyChainId}
								placeholder={m.signthis_verification_chain_id_placeholder()}
								type="number"
								disabled={isLoading}
							/>
							<div class="text-muted-foreground text-xs">
								{m.signthis_verification_chain_id_help()}
							</div>
						</div>
					</div>

					<div class="flex gap-2">
						<Button
							onclick={verifySignatureAction}
							disabled={!verifySignature.trim() ||
								!verifyMessage.trim() ||
								!verifyAddress.trim() ||
								isLoading}
							class="flex-1"
						>
							{#if isLoading}
								<Loader2 class="size-4 animate-spin" />
								{m.signthis_verification_button_verifying()}
							{:else}
								<CheckCircle class="size-4" />
								{m.signthis_verification_button()}
							{/if}
						</Button>
						<Button variant="outline" onclick={clearForm}>
							{m.signthis_clear_form()}
						</Button>
					</div>
				</div>
			</Card>

			<!-- Verification Result | 验证结果 -->
			{#if verificationResult}
				<Card class="p-6">
					{#if verificationResult.isValid}
						<div class="space-y-4">
							<div class="flex items-center gap-2">
								<CheckCircle class="size-5 text-green-600 dark:text-green-400" />
								<div class="text-lg font-semibold text-green-800 dark:text-green-200">
									{m.signthis_verification_valid()}
								</div>
							</div>

							<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
								<div>
									<div class="mb-1 font-medium">{m.signthis_verification_verified_at()}</div>
									<div class="text-muted-foreground">
										{formatTimestamp(verificationResult.verifiedAt)}
									</div>
								</div>
								{#if verificationResult.verifiedOnChainId}
									<div>
										<div class="mb-1 font-medium">
											{m.signthis_verification_verified_on_chain()}
										</div>
										<div class="text-muted-foreground">{verificationResult.verifiedOnChainId}</div>
									</div>
								{/if}
							</div>
						</div>
					{:else}
						<ErrorResult
							title={m.signthis_verification_invalid()}
							description="The signature could not be verified"
							errorLabel="Error Details"
							errorMessage={verificationResult.errorMessage}
						/>
					{/if}
				</Card>
			{/if}
		{/if}

		<!-- Error Display | 错误显示 -->
		{#if error}
			<Card class="p-6">
				<ErrorResult
					title={activeTab === 'verify'
						? m.signthis_error_verification_failed()
						: m.signthis_error_signing_failed()}
					description={error}
				/>
			</Card>
		{/if}

		<!-- Help Section | 帮助部分 -->
		<HelpSection title={m.signthis_help_title()} steps={helpSteps} />
	</div>
</ToolPageLayout>
