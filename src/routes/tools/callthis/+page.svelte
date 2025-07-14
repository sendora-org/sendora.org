<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import ToolPageLayout from '$lib/components/tool-page-layout.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';
	import { Json } from 'ox';
	import { LoaderIcon, FileIcon, PlayIcon, TestTubeIcon } from '@lucide/svelte/icons';
	import { isAddress, type Abi, type Address, type AbiParameter } from 'viem';
	import {
		contractService,
		type ParsedFunction,
		type ContractCallResult
	} from '$lib/services/contract-service';
	import { callHistoryStorage } from '$lib/services/call-history-storage';
	import CallthisHistory from '$lib/components/callthis-history.svelte';
	import ParameterHistory from '$lib/components/parameter-history.svelte';
	import { walletStore } from '$lib/stores/wallet';
	import { selectedNetwork } from '$lib/stores/networks';
	import AbiInput from '$lib/components/abi-input.svelte';
	import SuccessResult from '$lib/components/ui/success-result.svelte';
	import ErrorResult from '$lib/components/ui/error-result.svelte';

	// State management | 状态管理
	let contractAddress = $state('');
	let contractName = $state('');
	let abiText = $state('');
	let currentAbi = $state<Abi | null>(null);
	let readFunctions = $state<ParsedFunction[]>([]);
	let writeFunctions = $state<ParsedFunction[]>([]);
	let selectedFunction = $state<ParsedFunction | null>(null);
	let abiInputValues = $state<Record<string, unknown>>({});
	let isLoadingAbi = $state(false);
	let isCalling = $state(false);
	let callResult = $state<ContractCallResult | null>(null);
	let activeTab = $state('contract');
	let payableAmount = $state(''); // ETH amount for payable functions | payable 函数的 ETH 金额

	// Get current chain ID from wallet | 从钱包获取当前链 ID
	$effect(() => {
		if ($selectedNetwork?.chainId) {
			contractService.init(Number($selectedNetwork?.chainId ?? 1));
		}
	});

	// Re-initialize contract service when wallet connects | 钱包连接时重新初始化合约服务
	$effect(() => {
		if ($walletStore.isConnected && $selectedNetwork?.chainId) {
			contractService.init(Number($selectedNetwork?.chainId ?? 1));
		}
	});

	// Validate contract address | 验证合约地址
	function isValidAddress(address: string): boolean {
		return isAddress(address);
	}

	// Fetch ABI automatically | 自动获取 ABI
	async function fetchAbi() {
		if (!isValidAddress(contractAddress)) {
			toast.error(m.callthis_invalid_address());
			return;
		}

		isLoadingAbi = true;
		try {
			const result = await contractService.fetchABI(contractAddress as Address);
			if (result.success && result.abi) {
				abiText = JSON.stringify(result.abi, null, 2);
				parseAbi();
				toast.success(m.callthis_abi_fetch_success());
			} else {
				toast.error(result.error || m.callthis_abi_fetch_failed());
			}
		} catch {
			toast.error(m.callthis_abi_fetch_failed());
		} finally {
			isLoadingAbi = false;
		}
	}

	// Parse ABI and categorize functions | 解析 ABI 并分类函数
	function parseAbi() {
		if (!abiText.trim()) {
			toast.error(m.callthis_abi_required());
			return;
		}

		try {
			const abi = contractService.parseAbi(abiText);
			if (!abi) {
				throw new Error('Invalid ABI format');
			}

			currentAbi = abi;
			readFunctions = contractService.getReadFunctions(abi);
			writeFunctions = contractService.getWriteFunctions(abi);
			selectedFunction = null;
			abiInputValues = {};
			callResult = null;
			activeTab = 'functions';

			// Save contract to history | 保存合约到历史
			if (isValidAddress(contractAddress) && $selectedNetwork?.chainId) {
				callHistoryStorage.saveContractInfo({
					address: contractAddress as Address,
					chainId: Number($selectedNetwork.chainId),
					name: contractName || undefined,
					abi: abi
				});
			}

			toast.success(
				`${m.callthis_parse_abi()}: ${readFunctions.length} read, ${writeFunctions.length} write`
			);
		} catch (error) {
			toast.error('Invalid ABI format');
			console.error('ABI parsing error:', error);
		}
	}

	// Select function to call | 选择要调用的函数
	function selectFunction(func: ParsedFunction) {
		selectedFunction = func;
		callResult = null;
		abiInputValues = {};
		payableAmount = ''; // Reset payable amount | 重置支付金额

		// Initialize ABI input values | 初始化 ABI 输入值
		if (func.inputs.length > 0) {
			const signature = contractService.formatFunctionSignature(func);
			const newValues: Record<string, unknown> = {};
			func.inputs.forEach((input) => {
				const history = callHistoryStorage.getParameterValues(signature, input.name || '');
				if (history.length > 0) {
					try {
						newValues[input.name || ''] = JSON.parse(history[0]);
					} catch {
						newValues[input.name || ''] = history[0];
					}
				}
			});
			abiInputValues = newValues;
		}
	}

	// Execute function call | 执行函数调用
	async function callFunction() {
		if (!selectedFunction || !currentAbi || !isValidAddress(contractAddress)) {
			return;
		}

		// 只读函数不需要连接钱包 | Read functions don't need wallet connection
		if (selectedFunction.functionType !== 'read' && !$walletStore.isConnected) {
			toast.error(m.callthis_connect_wallet_first());
			return;
		}

		isCalling = true;
		callResult = null;

		try {
			// Convert ABI input values to array | 将 ABI 输入值转换为数组
			const args = selectedFunction.inputs.map((input) => {
				return abiInputValues[input.name || ''];
			});

			// Save parameters to history | 保存参数到历史
			if (selectedFunction) {
				const signature = contractService.formatFunctionSignature(selectedFunction);
				selectedFunction.inputs.forEach((input) => {
					const value = abiInputValues[input.name || ''];
					if (value !== undefined && input) {
						callHistoryStorage.saveParameterValue(
							signature,
							input.name || '',
							JSON.stringify(value)
						);
					}
				});
			}

			// Execute based on function type | 根据函数类型执行
			let result: ContractCallResult;
			if (selectedFunction.functionType === 'read') {
				result = await contractService.readContract(
					contractAddress as Address,
					currentAbi,
					selectedFunction.name,
					args
				);
			} else {
				// Convert ETH amount to wei if payable | 如果是 payable 函数，将 ETH 转换为 wei
				let value: bigint | undefined = undefined;
				if (selectedFunction.functionType === 'payable' && payableAmount) {
					try {
						// Parse ETH amount to wei | 将 ETH 金额解析为 wei
						const ethValue = parseFloat(payableAmount);
						if (isNaN(ethValue) || ethValue < 0) {
							throw new Error('Invalid ETH amount');
						}
						value = BigInt(Math.floor(ethValue * 1e18));
					} catch {
						toast.error('Invalid ETH amount');
						return;
					}
				}

				result = await contractService.writeContract(
					contractAddress as Address,
					currentAbi,
					selectedFunction.name,
					args,
					value
				);
			}

			callResult = result;

			// Save call to history | 保存调用到历史
			if ($selectedNetwork?.chainId) {
				callHistoryStorage.addCallHistory({
					chainId: Number($selectedNetwork.chainId),
					contractAddress: contractAddress as Address,
					contractName: contractName || undefined,
					functionName: selectedFunction.name,
					functionSignature: contractService.formatFunctionSignature(selectedFunction),
					args,
					// 使用 ox Json.stringify 处理结果中的 BigInt 类型 | Use ox Json.stringify to handle BigInt in results
					result: result.data !== undefined ? Json.stringify(result.data) : undefined,
					transactionHash: result.transactionHash,
					gasUsed: result.gasUsed?.toString(),
					error: result.error,
					type: selectedFunction.functionType === 'read' ? 'read' : 'write'
				});
			}

			if (result.success) {
				toast.success(m.callthis_success());
			} else {
				toast.error(result.error || m.callthis_error());
			}
		} catch (error: unknown) {
			callResult = {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
			toast.error(error instanceof Error ? error.message : m.callthis_error());
		} finally {
			isCalling = false;
		}
	}

	// Get explorer URL for transaction | 获取交易的浏览器 URL
	function getExplorerUrl(hash: string): string {
		if (!$selectedNetwork) return '';
		return `${$selectedNetwork.explorerURL}/tx/${hash}`;
	}

	// Use contract from history | 从历史使用合约
	function handleSelectContract(address: Address, abi: Abi, name?: string) {
		contractAddress = address;
		contractName = name || '';
		abiText = JSON.stringify(abi, null, 2);
		parseAbi();
	}
</script>

<ToolPageLayout
	title={m.callthis_title()}
	description={m.callthis_description()}
	pageTitle={m.tools_callthis_title()}
>
	<div class="space-y-6">
		<!-- Header with History | 带历史记录的标题 -->
		<div class="flex items-center justify-end">
			<CallthisHistory onSelectContract={handleSelectContract} />
		</div>

		<Tabs value={activeTab} onValueChange={(val) => (activeTab = val)} class="w-full">
			<TabsList class="grid w-full grid-cols-2">
				<TabsTrigger value="contract">{m.callthis_contract_info()}</TabsTrigger>
				<TabsTrigger value="functions" disabled={!currentAbi}
					>{m.callthis_read_functions()}/{m.callthis_write_functions()}</TabsTrigger
				>
			</TabsList>

			<!-- Contract Setup Tab | 合约设置标签页 -->
			<TabsContent value="contract" class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>{m.callthis_contract_info()}</CardTitle>
						<CardDescription>{m.callthis_contract_info_description()}</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<!-- Contract Address | 合约地址 -->
						<div class="space-y-2">
							<Label for="address">{m.callthis_contract_address()}</Label>
							<div class="flex gap-2">
								<Input
									id="address"
									bind:value={contractAddress}
									placeholder={m.callthis_contract_address_placeholder()}
									class="flex-1"
								/>
								<Button
									onclick={fetchAbi}
									disabled={!isValidAddress(contractAddress) || isLoadingAbi}
									variant="outline"
								>
									{#if isLoadingAbi}
										<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
										{m.callthis_fetching_abi()}
									{:else}
										{m.callthis_fetch_abi()}
									{/if}
								</Button>
							</div>
						</div>

						<!-- Contract Name | 合约名称 -->
						<div class="space-y-2">
							<Label for="name">{m.callthis_contract_name()}</Label>
							<Input
								id="name"
								bind:value={contractName}
								placeholder={m.callthis_contract_name_placeholder()}
							/>
						</div>

						<!-- ABI Input | ABI 输入 -->
						<div class="space-y-2">
							<Label for="abi">{m.callthis_contract_abi()}</Label>
							<Textarea
								id="abi"
								bind:value={abiText}
								placeholder={m.callthis_abi_placeholder()}
								class="h-[200px] overflow-y-auto font-mono text-sm"
							/>
						</div>

						<!-- Parse Button | 解析按钮 -->
						<Button onclick={parseAbi} disabled={!abiText.trim()} class="w-full">
							<FileIcon class="mr-2 h-4 w-4" />
							{m.callthis_parse_abi()}
						</Button>
					</CardContent>
				</Card>
			</TabsContent>

			<!-- Functions Tab | 函数标签页 -->
			<TabsContent value="functions" class="space-y-6">
				<div class="grid gap-6 lg:grid-cols-2">
					<!-- Function List | 函数列表 -->
					<div class="space-y-4">
						<!-- Read Functions | 只读函数 -->
						<Card>
							<CardHeader>
								<CardTitle class="flex items-center gap-2">
									<TestTubeIcon class="h-5 w-5" />
									{m.callthis_read_functions()}
									<Badge variant="secondary">{readFunctions.length}</Badge>
								</CardTitle>
								<CardDescription>{m.callthis_read_functions_description()}</CardDescription>
							</CardHeader>
							<CardContent>
								{#if readFunctions.length === 0}
									<p class="text-muted-foreground py-4 text-center">
										{m.callthis_no_read_functions()}
									</p>
								{:else}
									<div class="max-h-[300px] space-y-2 overflow-y-auto">
										{#each readFunctions as func (func.name)}
											<Button
												variant={selectedFunction?.name === func.name ? 'default' : 'ghost'}
												class="w-full justify-start font-mono text-sm"
												onclick={() => selectFunction(func)}
											>
												{func.name}({func.inputs.length})
											</Button>
										{/each}
									</div>
								{/if}
							</CardContent>
						</Card>

						<!-- Write Functions | 写入函数 -->
						<Card>
							<CardHeader>
								<CardTitle class="flex items-center gap-2">
									<PlayIcon class="h-5 w-5" />
									{m.callthis_write_functions()}
									<Badge variant="secondary">{writeFunctions.length}</Badge>
								</CardTitle>
								<CardDescription>{m.callthis_write_functions_description()}</CardDescription>
							</CardHeader>
							<CardContent>
								{#if writeFunctions.length === 0}
									<p class="text-muted-foreground py-4 text-center">
										{m.callthis_no_write_functions()}
									</p>
								{:else}
									<div class="max-h-[300px] space-y-2 overflow-y-auto">
										{#each writeFunctions as func (func.name)}
											<Button
												variant={selectedFunction?.name === func.name ? 'default' : 'ghost'}
												class="w-full justify-start font-mono text-sm"
												onclick={() => selectFunction(func)}
											>
												{func.name}({func.inputs.length})
												{#if func.functionType === 'payable'}
													<Badge class="ml-2  ">payable</Badge>
												{/if}
											</Button>
										{/each}
									</div>
								{/if}
							</CardContent>
						</Card>
					</div>

					<!-- Function Call Interface | 函数调用界面 -->
					<div class="space-y-4">
						{#if selectedFunction}
							<Card>
								<CardHeader>
									<CardTitle class="font-mono text-lg">{selectedFunction.name}</CardTitle>
									<CardDescription></CardDescription>
								</CardHeader>
								<CardContent class="space-y-4">
									<!-- Function Parameters | 函数参数 -->
									{#if selectedFunction.inputs.length > 0}
										<div class="space-y-3">
											<div class="flex items-center justify-between">
												<h4 class="font-medium">{m.callthis_function_parameters()}</h4>
												<ParameterHistory
													functionSignature={contractService.formatFunctionSignature(
														selectedFunction
													)}
													{contractAddress}
													{contractName}
													onSelectParameters={(params) => {
														console.log({ params });
														// 将参数对象转换为按照函数参数顺序的对象 | Convert parameter object to function parameter order
														const newValues: Record<string, unknown> = {};
														selectedFunction!.inputs.forEach((input, index) => {
															const paramName = input.name || `param${index}`;
															if (params[paramName] !== undefined) {
																newValues[paramName] = params[paramName];
															}
														});

														console.log({ newValues });
														abiInputValues = newValues;
													}}
												/>
											</div>
											<AbiInput
												abi={selectedFunction.inputs as AbiParameter[]}
												bind:values={abiInputValues}
												onValueChange={(values) => (abiInputValues = values)}
											/>
										</div>
									{:else}
										<p class="text-muted-foreground">{m.callthis_no_parameters()}</p>
									{/if}

									<!-- Payable amount input | Payable 金额输入 -->
									{#if selectedFunction.functionType === 'payable'}
										<div class="space-y-2">
											<Label for="payableAmount">{m.callthis_payable_amount()}</Label>
											<Input
												id="payableAmount"
												type="number"
												step="0.000000000000000001"
												min="0"
												bind:value={payableAmount}
												placeholder={m.callthis_payable_amount_placeholder()}
											/>
										</div>
									{/if}

									<Separator />

									<!-- Call Button | 调用按钮 -->
									<Button
										onclick={callFunction}
										disabled={isCalling ||
											(selectedFunction.functionType !== 'read' && !$walletStore.isConnected)}
										class="w-full"
										variant={selectedFunction.functionType === 'read' ? 'outline' : 'default'}
									>
										{#if isCalling}
											<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
											{selectedFunction.functionType === 'read'
												? m.callthis_calling()
												: m.callthis_sending()}
										{:else}
											{selectedFunction.functionType === 'read'
												? m.callthis_call_function()
												: m.callthis_send_transaction()}
										{/if}
									</Button>

									{#if selectedFunction.functionType !== 'read' && !$walletStore.isConnected}
										<p class="text-muted-foreground text-center text-sm">
											{m.callthis_connect_wallet_first()}
										</p>
									{/if}
								</CardContent>
							</Card>

							<!-- Result Display | 结果显示 -->
							{#if callResult}
								{#if callResult.success}
									<SuccessResult
										title={m.callthis_success()}
										description=""
										hashLabel={callResult.transactionHash
											? m.callthis_transaction_hash()
											: m.callthis_return_value()}
										hashValue={callResult.transactionHash ||
											Json.stringify(callResult.data, null, 2)}
										copyLabel={m.copy_button()}
										copiedLabel={m.copied_button()}
										explorerLabel={callResult.transactionHash
											? m.wallet_view_explorer()
											: undefined}
										explorerUrl={callResult.transactionHash
											? getExplorerUrl(callResult.transactionHash)
											: undefined}
									/>
								{:else}
									<ErrorResult
										title={m.callthis_error()}
										description=""
										errorLabel={m.callthis_error()}
										errorMessage={callResult.error}
									/>
								{/if}
							{/if}
						{:else}
							<!-- Function Selection Prompt | 函数选择提示 -->
							<Card>
								<CardContent class="pt-6">
									<div class="space-y-4 text-center">
										<h3 class="text-lg font-medium">{m.callthis_select_function_prompt()}</h3>
										<p class="text-muted-foreground">{m.callthis_select_function_description()}</p>
									</div>
								</CardContent>
							</Card>
						{/if}
					</div>
				</div>
			</TabsContent>
		</Tabs>
	</div>
</ToolPageLayout>
