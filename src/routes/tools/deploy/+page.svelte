<!-- Smart contract deployment tool | 智能合约部署工具 -->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';
	import ToolPageLayout from '$lib/components/tool-page-layout.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import SuccessResult from '$lib/components/ui/success-result.svelte';
	import ErrorResult from '$lib/components/ui/error-result.svelte';
	import CopyButton from '$lib/components/ui/copy-button.svelte';
	import NetworkDisplay from '$lib/components/ui/network-display.svelte';
	import HelpSection from '$lib/components/ui/help-section.svelte';
	import {
		Upload,
		Clipboard,
		Code,
		Rocket,
		Hash,
		RefreshCw,
		CheckCircle,
		AlertCircle,
		History,
		Settings
	} from '@lucide/svelte';
	import AbiInput from '$lib/components/abi-input.svelte';
	import DeploymentHistory from '$lib/components/deployment-history.svelte';
	import GasLimitInput from '$lib/components/gas-limit-input.svelte';
	import GasPriceInput from '$lib/components/gas-price-input.svelte';
	import { parseArtifactWithFallbacks, type ParsedArtifact } from '$lib/services/artifact-parser';
	import { DeploymentService, type DeploymentRequest } from '$lib/services/deployment-service';
	import { currentProvider, currentAccount, currentChainId } from '$lib/stores/wallet';
	import { getNetworkByChainId } from '$lib/stores/networks';
	import { encodeAbiParameters, type AbiFunction, type AbiParameter } from 'viem';
	import { selectedNetwork } from '$lib/stores/networks';

	// Component state | 组件状态
	let activeTab = $state<'deploy' | 'history'>('deploy');
	let contractName = $state('');
	let contractBytecode = $state('');
	let constructorAbiText = $state('');
	let constructorArgsEncoded = $state('');
	let deploymentType = $state<'standard' | 'create2'>('standard');
	let create2Salt = $state('');
	let gasLimit = $state('');
	let gasPrice = $state<bigint>();
	let abiParams = $state<Record<string, unknown>>({});
	let parameterInputMode = $state<'abi-parser' | 'manual-encoding'>('abi-parser');
	let encodedConstructorArgs = $state<string>('');

	// Clear values when switching parameter input modes | 切换参数输入模式时清空值
	$effect(() => {
		if (parameterInputMode === 'manual-encoding') {
			// Switching to manual mode: clear ABI-related values | 切换到手动模式：清空 ABI 相关值
			abiParams = {};
		} else {
			// Switching to ABI parser mode: clear manual encoded args | 切换到 ABI 解析模式：清空手动编码参数
			constructorArgsEncoded = '';
		}
	});

	// Update elapsed time during deployment | 部署期间更新已用时间
	$effect(() => {
		let interval: NodeJS.Timeout | null = null;

		if (isDeploying && deploymentStartTime) {
			interval = setInterval(() => {
				deploymentElapsedTime = Math.floor((Date.now() - deploymentStartTime!) / 1000);
			}, 1000);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	});

	// Auto-predict address when relevant values change | 相关值变化时自动预测地址
	$effect(() => {
		if (deploymentType === 'create2' && contractBytecode) {
			predictCREATE2Address();
		} else {
			predictedAddress = null;
		}
	});

	// Auto-encode ABI parameters | 自动编码 ABI 参数
	$effect(() => {
		if (
			parameterInputMode === 'abi-parser' &&
			constructorAbiText.trim() &&
			Object.keys(abiParams).length > 0
		) {
			try {
				const abiInputs = JSON.parse(constructorAbiText) as AbiParameter[];
				if (Array.isArray(abiInputs) && abiInputs.length > 0) {
					const values = abiInputs.map((input) => abiParams[input.name!]);
					const encoded = encodeAbiParameters(abiInputs, values);
					encodedConstructorArgs = encoded;
				} else {
					encodedConstructorArgs = '';
				}
			} catch (error) {
				console.warn('Failed to encode ABI parameters:', error);
				encodedConstructorArgs = '';
			}
		} else {
			encodedConstructorArgs = '';
		}
	});

	// Import/parsing state | 导入/解析状态
	let artifactInput = $state('');
	let parsedArtifact = $state<ParsedArtifact | null>(null);
	let parseError = $state<string | null>(null);
	let isParsingArtifact = $state(false);

	// Deployment state | 部署状态
	let isDeploying = $state(false);
	let deploymentResult = $state<{
		contractAddress: string;
		transactionHash: string;
		explorerUrl?: string;
	} | null>(null);
	let deploymentError = $state<string | null>(null);
	let deploymentStartTime = $state<number | null>(null);
	let deploymentElapsedTime = $state(0);
	let deploymentEstimatedTime = $state(30); // 估计 30 秒完成部署
	let predictedAddress = $state<string | null>(null);
	let isPredicting = $state(false);

	// Validation state | 验证状态
	let validationErrors = $state<string[]>([]);

	// Initialize component | 初始化组件
	onMount(() => {
		console.log('🚀 Smart contract deployment tool initialized');
	});

	// Check if string is valid JSON | 检查字符串是否为有效 JSON
	function isValidJSON(str: string): boolean {
		try {
			JSON.parse(str);
			return true;
		} catch {
			return false;
		}
	}

	// Parse artifact from JSON input | 从 JSON 输入解析构件
	async function parseArtifact() {
		if (!artifactInput.trim()) {
			parseError = 'Artifact input is required';
			return;
		}

		try {
			isParsingArtifact = true;
			parseError = null;

			const result = parseArtifactWithFallbacks(artifactInput);
			if (!result) {
				parseError = 'Invalid artifact format';
				return;
			}

			parsedArtifact = result;
			contractName = result.contractName;
			contractBytecode = result.bytecode;

			// Extract constructor ABI | 提取构造函数 ABI
			const constructorAbi = result.abi.find(
				(item: unknown) =>
					item &&
					typeof item === 'object' &&
					'type' in item &&
					(item as { type: string }).type === 'constructor'
			) as AbiFunction | undefined;
			if (constructorAbi && constructorAbi.inputs) {
				constructorAbiText = JSON.stringify(constructorAbi.inputs, null, 2);
			} else {
				// No constructor found, set empty array to indicate no parameters needed | 未找到构造函数，设置空数组表示无需参数
				constructorAbiText = '[]';
			}

			console.log('✅ Artifact parsed successfully:', result.contractName);
		} catch (error) {
			console.error('❌ Failed to parse artifact:', error);
			parseError = `Parse error: ${(error as Error).message}`;
		} finally {
			isParsingArtifact = false;
		}
	}

	// Paste from clipboard | 从剪贴板粘贴
	async function pasteFromClipboard() {
		try {
			const text = await navigator.clipboard.readText();
			artifactInput = text;
			await parseArtifact();
		} catch (error) {
			console.error('❌ Failed to read clipboard:', error);
			alert('Failed to read clipboard');
		}
	}

	// Import from file | 从文件导入
	function importFromFile(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (e) => {
			const text = e.target?.result as string;
			artifactInput = text;
			await parseArtifact();
		};
		reader.readAsText(file);
	}

	// Generate random CREATE2 salt | 生成随机 CREATE2 盐值
	function generateRandomSalt() {
		create2Salt = DeploymentService.generateRandomSalt();
		// Update prediction when salt changes | 盐值变化时更新预测
		if (contractBytecode) {
			predictCREATE2Address();
		}
	}

	// Predict CREATE2 address | 预测 CREATE2 地址
	async function predictCREATE2Address() {
		if (!contractBytecode || deploymentType !== 'create2') {
			predictedAddress = null;
			return;
		}

		try {
			isPredicting = true;
			const constructorArgs = buildConstructorArgs();
			const fullBytecode = contractBytecode + (constructorArgs ? constructorArgs.slice(2) : '');

			const prediction = await DeploymentService.predictCREATE2Address(
				fullBytecode as `0x${string}`,
				create2Salt
			);

			predictedAddress = prediction.address;
		} catch (error) {
			console.error('Address prediction failed:', error);
			predictedAddress = null;
		} finally {
			isPredicting = false;
		}
	}

	// Validate deployment form | 验证部署表单
	function validateForm(): boolean {
		const errors: string[] = [];

		if (!contractName.trim()) {
			errors.push('Contract name is required');
		}

		if (!contractBytecode.trim() || !contractBytecode.startsWith('0x')) {
			errors.push(m.deploy_error_invalid_bytecode());
		}

		// CREATE2 salt validation is now handled by processSalt() | CREATE2 盐值验证现在由 processSalt() 处理
		// Allow empty salt for CREATE2 | 允许 CREATE2 的空盐值

		if (!$currentAccount) {
			errors.push(m.deploy_error_no_wallet());
		}

		validationErrors = errors;
		return errors.length === 0;
	}

	// Build constructor arguments | 构建构造函数参数
	function buildConstructorArgs(): string {
		if (parameterInputMode === 'manual-encoding') {
			// Manual encoding mode: use directly provided encoded arguments | 手动编码模式：直接使用提供的编码参数
			return constructorArgsEncoded.trim();
		} else {
			// ABI parser mode: encode from ABI parameters | ABI 解析器模式：从 ABI 参数编码
			if (constructorAbiText.trim() && Object.keys(abiParams).length > 0) {
				try {
					const abiInputs = JSON.parse(constructorAbiText) as AbiParameter[];
					const values = abiInputs.map((input) => abiParams[input.name!]);
					const encoded = encodeAbiParameters(abiInputs, values);
					return encoded;
				} catch (error) {
					console.error('❌ Failed to encode constructor args:', error);
					return '';
				}
			}
		}

		return '';
	}

	// Deploy contract | 部署合约
	async function deployContract() {
		if (!validateForm()) {
			return;
		}

		try {
			isDeploying = true;
			deploymentError = null;
			deploymentResult = null;
			deploymentStartTime = Date.now();
			deploymentElapsedTime = 0;

			// Build bytecode with constructor args | 构建包含构造函数参数的字节码
			const constructorArgs = buildConstructorArgs();
			const fullBytecode = contractBytecode + (constructorArgs ? constructorArgs.slice(2) : '');

			// Process salt for CREATE2 deployment | 处理 CREATE2 部署的盐值
			let processedSalt: `0x${string}` | undefined = undefined;
			let saltOriginal: string | undefined = undefined;

			if (deploymentType === 'create2') {
				const saltProcessing = DeploymentService.processSalt(create2Salt);
				processedSalt = saltProcessing.salt;
				saltOriginal = saltProcessing.saltOriginal;
			}

			// Create deployment request | 创建部署请求
			const request: DeploymentRequest = {
				contractName,
				bytecode: fullBytecode as `0x${string}`,
				deploymentType,
				salt: processedSalt,
				saltOriginal: saltOriginal,
				gasLimit: gasLimit ? BigInt(gasLimit) : undefined,
				gasPrice: gasPrice // Already in wei as bigint | 已经是 wei 单位的 bigint
			};

			console.log('🚀 Starting deployment:', request);

			// Deploy based on type | 根据类型部署
			let result;
			if (deploymentType === 'create2') {
				result = await DeploymentService.deployCREATE2(request);
			} else {
				result = await DeploymentService.deployStandard(request);
			}

			// Add explorer URL to result | 将浏览器 URL 添加到结果
			const network = getNetworkByChainId($currentChainId?.toString() || '');
			const explorerUrl = network?.explorerURL
				? `${network.explorerURL}/tx/${result.transactionHash}`
				: undefined;

			deploymentResult = {
				...result,
				explorerUrl
			};
			console.log('✅ Deployment successful:', deploymentResult);
		} catch (error) {
			console.error('❌ Deployment failed:', error);
			deploymentError = (error as Error).message;
		} finally {
			isDeploying = false;
			deploymentStartTime = null;
		}
	}

	// Estimate gas for deployment | 估算部署的 Gas
	async function estimateDeploymentGas(): Promise<bigint | undefined> {
		try {
			const provider = $currentProvider;
			const account = $currentAccount;
			if (!provider || !account) return undefined;

			const publicClient = provider.getPublicClient();
			const constructorArgs = buildConstructorArgs();
			const fullBytecode = contractBytecode + (constructorArgs ? constructorArgs.slice(2) : '');

			const gasEstimate = await publicClient.estimateGas({
				account,
				data: fullBytecode as `0x${string}`,
				value: 0n
			});

			return gasEstimate;
		} catch (error) {
			console.error('❌ Gas estimation failed:', error);
			return undefined;
		}
	}

	// Estimate gas price | 估算 Gas 价格
	async function estimateGasPrice(): Promise<bigint | undefined> {
		try {
			const provider = $currentProvider;
			if (!provider) return undefined;

			const publicClient = provider.getPublicClient();
			const gasPriceEstimate = await publicClient.getGasPrice();

			return gasPriceEstimate;
		} catch (error) {
			console.error('❌ Gas price estimation failed:', error);
			return undefined;
		}
	}

	// Check if wallet is connected | 检查钱包是否连接
	let isWalletConnected = $derived($currentProvider && $currentAccount);

	// Help steps data | 帮助步骤数据
	let helpSteps = $derived.by(() => [
		{ label: '', content: m.deploy_help_step1() },
		{ label: '', content: m.deploy_help_step2() },
		{ label: '', content: m.deploy_help_step3() },
		{ label: '', content: m.deploy_help_step4() },
		{ label: '', content: m.deploy_help_step5() }
	]);
</script>

<ToolPageLayout
	title={m.deploy_title()}
	description={m.deploy_description()}
	pageTitle={m.tools_deploy_title()}
>
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
	<!-- Tab navigation | 选项卡导航 -->
	<div class="my-6">
		<div class="bg-muted flex space-x-1 rounded-lg p-1">
			<button
				class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
				'deploy'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (activeTab = 'deploy')}
			>
				<Rocket class="mr-2 inline h-4 w-4" />
				{m.deploy_tab_deploy()}
			</button>
			<button
				class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
				'history'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (activeTab = 'history')}
			>
				<History class="mr-2 inline h-4 w-4" />
				{m.deploy_tab_history()}
			</button>
		</div>
	</div>

	<!-- Deploy tab content | 部署选项卡内容 -->
	{#if activeTab === 'deploy'}
		<div class="space-y-6">
			<!-- Contract artifact import | 合约构件导入 -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Upload class="h-5 w-5" />
						Import Contract Artifact
					</CardTitle>
					<CardDescription>Import contract artifact from Hardhat, Foundry, or Remix</CardDescription
					>
				</CardHeader>
				<CardContent class="space-y-4 ">
					<!-- Import buttons | 导入按钮 -->
					<div class="flex gap-2 overflow-auto">
						<Button size="sm" variant="outline" onclick={pasteFromClipboard}>
							<Clipboard class="mr-2 h-4 w-4" />
							{m.deploy_import_clipboard()}
						</Button>
						<Button
							size="sm"
							variant="outline"
							onclick={() => document.getElementById('file-input')?.click()}
						>
							<Upload class="mr-2 h-4 w-4" />
							{m.deploy_import_file()}
						</Button>
						<input
							id="file-input"
							type="file"
							accept=".json"
							class="hidden"
							onchange={importFromFile}
						/>
						<Button
							size="sm"
							variant="outline"
							onclick={parseArtifact}
							disabled={isParsingArtifact || !artifactInput.trim()}
						>
							<RefreshCw class={`mr-2 h-4 w-4 ${isParsingArtifact ? 'animate-spin' : ''}`} />
							Parse Artifact
						</Button>
					</div>

					<!-- Artifact input textarea | 构件输入文本框 -->
					<Textarea
						bind:value={artifactInput}
						placeholder="Paste artifact JSON here..."
						class="max-h-48 min-h-32 font-mono"
					/>

					<!-- Parse error display | 解析错误显示 -->
					{#if parseError}
						<Alert variant="destructive">
							<AlertCircle class="h-4 w-4" />
							<AlertDescription>{parseError}</AlertDescription>
						</Alert>
					{/if}

					<!-- Parsed artifact display | 解析的构件显示 -->
					{#if parsedArtifact}
						<Alert>
							<CheckCircle class="h-4 w-4" />
							<AlertDescription>
								{`Successfully parsed ${parsedArtifact.contractName} (${parsedArtifact.format} format)`}
							</AlertDescription>
						</Alert>
					{/if}
				</CardContent>
			</Card>

			<!-- Contract details | 合约详情 -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Code class="h-5 w-5" />
						Contract Details
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<!-- Contract name | 合约名称 -->
					<div class="space-y-2">
						<Label for="contract-name">{m.deploy_contract_name()}</Label>
						<Input
							id="contract-name"
							bind:value={contractName}
							placeholder={m.deploy_contract_name_placeholder()}
						/>
					</div>

					<!-- Contract bytecode | 合约字节码 -->
					<div class="space-y-2">
						<Label for="contract-bytecode">{m.deploy_bytecode()}</Label>
						<Textarea
							id="contract-bytecode"
							bind:value={contractBytecode}
							placeholder="0x..."
							class="max-h-48 min-h-32 font-mono"
						/>
					</div>
				</CardContent>
			</Card>

			<!-- Constructor arguments | 构造函数参数 -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Settings class="h-5 w-5" />
						{m.deploy_constructor_args()}
					</CardTitle>
					<CardDescription
						>Configure constructor parameters or provide ABI-encoded arguments</CardDescription
					>
				</CardHeader>
				<CardContent class="space-y-4">
					<!-- Check if constructor has parameters | 检查构造函数是否有参数 -->
					{#if constructorAbiText.trim() && isValidJSON(constructorAbiText)}
						{@const abiInputs = JSON.parse(constructorAbiText)}
						{#if Array.isArray(abiInputs) && abiInputs.length === 0}
							<!-- No parameters needed - show info only | 无需参数 - 仅显示信息 -->
							<Alert>
								<CheckCircle class="h-4 w-4" />
								<AlertDescription>
									Constructor has no parameters - ready to deploy | 构造函数无参数 - 可直接部署
								</AlertDescription>
							</Alert>
						{:else}
							<!-- Constructor has parameters - show input options | 构造函数有参数 - 显示输入选项 -->
							<!-- Parameter Input Mode | 参数输入模式 -->
							<div class="space-y-3">
								<Label>Parameter Input Mode</Label>
								<div class="flex gap-4">
									<label class="flex items-center space-x-2">
										<input
											type="radio"
											bind:group={parameterInputMode}
											value="abi-parser"
											class="h-4 w-4"
										/>
										<span>Use ABI Parser</span>
									</label>
									<label class="flex items-center space-x-2">
										<input
											type="radio"
											bind:group={parameterInputMode}
											value="manual-encoding"
											class="h-4 w-4"
										/>
										<span>Manual ABI Encoding</span>
									</label>
								</div>
							</div>

							<Separator />

							{#if parameterInputMode === 'abi-parser'}
								<!-- ABI Parser Mode | ABI 解析器模式 -->
								<!-- Constructor ABI | 构造函数 ABI -->
								<div class="space-y-2">
									<Label for="constructor-abi">{m.deploy_abi_input()}</Label>
									<Textarea
										id="constructor-abi"
										bind:value={constructorAbiText}
										placeholder={m.deploy_abi_placeholder()}
										class="max-h-48 min-h-32 font-mono"
									/>
								</div>

								<!-- ABI parameters input | ABI 参数输入 -->
								<div class="space-y-2">
									<Label>{m.deploy_constructor_params()}</Label>
									<AbiInput
										abi={abiInputs}
										bind:values={abiParams}
										onValueChange={(values) => (abiParams = values)}
									/>
								</div>

								<!-- Show encoded parameters | 显示编码后的参数 -->
								{#if encodedConstructorArgs}
									<div class="space-y-2">
										<Label>{m.deploy_abi_encoded_params()}</Label>
										<div class="bg-muted flex items-center gap-2 rounded-lg p-3">
											<code class="flex-1 font-mono text-sm break-all"
												>{encodedConstructorArgs}</code
											>
											<CopyButton
												text={encodedConstructorArgs}
												size="sm"
												copyLabel={m.copy_button()}
												copiedLabel={m.copied_button()}
											/>
										</div>
										<p class="text-muted-foreground text-xs">
											{m.deploy_abi_encoded_hint()}
										</p>
									</div>
								{/if}
							{:else}
								<!-- Manual Encoding Mode | 手动编码模式 -->
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<Label for="constructor-args-encoded">{m.deploy_encoded_args()}</Label>
										{#if encodedConstructorArgs}
											<Button
												size="sm"
												variant="outline"
												onclick={() => (constructorArgsEncoded = encodedConstructorArgs)}
											>
												<Clipboard class="mr-2 h-4 w-4" />
												{m.deploy_paste_abi_encoded()}
											</Button>
										{/if}
									</div>
									<Textarea
										id="constructor-args-encoded"
										bind:value={constructorArgsEncoded}
										placeholder="0x..."
										class="max-h-48 min-h-32 font-mono"
									/>
									<p class="text-muted-foreground text-sm">{m.deploy_manual_encoding_hint()}</p>
									{#if encodedConstructorArgs && constructorArgsEncoded !== encodedConstructorArgs}
										<div class="text-xs text-amber-600 dark:text-amber-400">
											{m.deploy_abi_encoded_available()}
										</div>
									{/if}
								</div>
							{/if}
						{/if}
					{:else}
						<!-- No ABI provided yet or invalid - show basic input | 未提供 ABI 或无效 - 显示基本输入 -->
						<!-- Parameter Input Mode | 参数输入模式 -->
						<div class="space-y-3">
							<Label>Parameter Input Mode</Label>
							<div class="flex gap-4">
								<label class="flex items-center space-x-2">
									<input
										type="radio"
										bind:group={parameterInputMode}
										value="abi-parser"
										class="h-4 w-4"
									/>
									<span>Use ABI Parser</span>
								</label>
								<label class="flex items-center space-x-2">
									<input
										type="radio"
										bind:group={parameterInputMode}
										value="manual-encoding"
										class="h-4 w-4"
									/>
									<span>Manual ABI Encoding</span>
								</label>
							</div>
						</div>

						<Separator />

						{#if parameterInputMode === 'abi-parser'}
							<!-- ABI Parser Mode | ABI 解析器模式 -->
							<!-- Constructor ABI | 构造函数 ABI -->
							<div class="space-y-2">
								<Label for="constructor-abi">{m.deploy_abi_input()}</Label>
								<Textarea
									id="constructor-abi"
									bind:value={constructorAbiText}
									placeholder={m.deploy_abi_placeholder()}
									class="max-h-48 min-h-32 font-mono"
								/>
							</div>

							<!-- Show validation error if ABI is invalid | 如果 ABI 无效则显示验证错误 -->
							{#if constructorAbiText.trim() && !isValidJSON(constructorAbiText)}
								<Alert variant="destructive">
									<AlertCircle class="h-4 w-4" />
									<AlertDescription>{m.deploy_abi_invalid()}</AlertDescription>
								</Alert>
							{/if}
						{:else}
							<!-- Manual Encoding Mode | 手动编码模式 -->
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<Label for="constructor-args-encoded">{m.deploy_encoded_args()}</Label>
									{#if encodedConstructorArgs}
										<Button
											size="sm"
											variant="outline"
											onclick={() => (constructorArgsEncoded = encodedConstructorArgs)}
										>
											<Clipboard class="mr-2 h-4 w-4" />
											{m.deploy_paste_abi_encoded()}
										</Button>
									{/if}
								</div>
								<Textarea
									id="constructor-args-encoded"
									bind:value={constructorArgsEncoded}
									placeholder="0x..."
									class="max-h-48 min-h-32 font-mono"
								/>
								<p class="text-muted-foreground text-sm">{m.deploy_manual_encoding_hint()}</p>
								{#if encodedConstructorArgs && constructorArgsEncoded !== encodedConstructorArgs}
									<div class="text-xs text-amber-600 dark:text-amber-400">
										{m.deploy_abi_encoded_available()}
									</div>
								{/if}
							</div>
						{/if}
					{/if}
				</CardContent>
			</Card>

			<!-- Deployment options | 部署选项 -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Hash class="h-5 w-5" />
						Deployment Options
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<!-- Deployment type | 部署类型 -->
					<div class="space-y-3">
						<Label>{m.deploy_deployment_type()}</Label>
						<div class="flex gap-4">
							<label class="flex items-center space-x-2">
								<input type="radio" bind:group={deploymentType} value="standard" class="h-4 w-4" />
								<span>{m.deploy_standard()}</span>
							</label>
							<label class="flex items-center space-x-2">
								<input type="radio" bind:group={deploymentType} value="create2" class="h-4 w-4" />
								<span>{m.deploy_create2()}</span>
							</label>
						</div>
					</div>

					<!-- CREATE2 salt | CREATE2 盐值 -->
					{#if deploymentType === 'create2'}
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<Label for="create2-salt">{m.deploy_salt()}</Label>
								<Button size="sm" variant="outline" onclick={generateRandomSalt}>
									<RefreshCw class="mr-2 h-4 w-4" />
									{m.deploy_salt_generate()}
								</Button>
							</div>
							<Input
								id="create2-salt"
								bind:value={create2Salt}
								placeholder="Leave empty for zero salt, enter text or hex value"
								class="font-mono"
							/>
							<p class="text-muted-foreground text-xs">
								Empty = zero bytes32, text will be converted to bytes32, hex will be padded to 32
								bytes
							</p>
						</div>

						<!-- Predicted address display | 预测地址显示 -->
						{#if predictedAddress}
							<div class="space-y-2">
								<Label>{m.deploy_predicted_address()}</Label>
								<div class="bg-muted flex items-center gap-2 rounded-lg p-3">
									<code class="flex-1 font-mono text-sm break-all">{predictedAddress}</code>
									<CopyButton
										text={predictedAddress}
										size="sm"
										copyLabel={m.copy_button()}
										copiedLabel={m.copied_button()}
									/>
								</div>
							</div>
						{:else if isPredicting}
							<div class="space-y-2">
								<Label>{m.deploy_predicted_address()}</Label>
								<div class="bg-muted flex items-center gap-2 rounded-lg p-3">
									<div class="text-muted-foreground flex items-center gap-2">
										<RefreshCw class="h-4 w-4 animate-spin" />
										<span class="text-sm">Calculating address...</span>
									</div>
								</div>
							</div>
						{/if}
					{/if}

					<!-- Gas settings | Gas 设置 -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<GasLimitInput
								value={gasLimit}
								onValueChange={(value) => (gasLimit = value)}
								onEstimate={estimateDeploymentGas}
							/>
						</div>
						<div>
							<GasPriceInput
								value={gasPrice}
								onValueChange={(value) => (gasPrice = value)}
								onEstimate={estimateGasPrice}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Validation errors | 验证错误 -->
			{#if validationErrors.length > 0}
				<Alert variant="destructive">
					<AlertCircle class="h-4 w-4" />
					<AlertDescription>
						<ul class="list-inside list-disc space-y-1">
							{#each validationErrors as error (error)}
								<li>{error}</li>
							{/each}
						</ul>
					</AlertDescription>
				</Alert>
			{/if}

			<!-- Deployment result | 部署结果 -->
			{#if deploymentResult}
				<SuccessResult
					title={m.deploy_success_title()}
					description={m.deploy_success_description({
						contractName,
						address: deploymentResult.contractAddress
					})}
					hashLabel={m.deploy_history_tx_hash()}
					hashValue={deploymentResult.transactionHash}
					copyLabel={m.copy_button()}
					copiedLabel={m.copied_button()}
					explorerLabel={m.deploy_view_explorer()}
					explorerUrl={deploymentResult.explorerUrl}
				/>
			{:else if deploymentError}
				<ErrorResult
					title={m.deploy_error_title()}
					description={m.deploy_error_description()}
					errorLabel={m.deploy_error_details()}
					errorMessage={deploymentError}
				/>
			{/if}

			<!-- Deploy button | 部署按钮 -->
			<div class="w-full">
				<Button
					size="lg"
					onclick={deployContract}
					disabled={isDeploying || !contractName || !contractBytecode || !$currentAccount}
					class="h-12 w-full"
				>
					<Rocket class={`mr-2 h-5 w-5 ${isDeploying ? 'animate-pulse' : ''}`} />
					{#if isDeploying}
						<span>
							{m.deploy_deploying()} ({deploymentElapsedTime}s / ~{deploymentEstimatedTime}s)
						</span>
					{:else}
						{m.deploy_deploy_button()}
					{/if}
				</Button>
			</div>
		</div>
	{:else if activeTab === 'history'}
		<!-- History tab content | 历史选项卡内容 -->
		<DeploymentHistory />
	{/if}

	<!-- Help Section | 帮助部分 -->
	<div class="mt-4">
		<HelpSection title={m.deploy_help_title()} steps={helpSteps} />
	</div>
</ToolPageLayout>
