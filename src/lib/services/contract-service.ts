import {
	type Abi,
	type AbiFunction,
	type Address,
	encodeFunctionData,
	type PublicClient,
	type WalletClient,
	parseAbi,
	type TransactionReceipt,
	type Hash,
	formatUnits,
	type AbiParameter
} from 'viem';
import { getPublicClient, getWalletClient } from '$lib/stores/wallet';

// Contract function types | 合约函数类型
export type FunctionType = 'read' | 'write' | 'payable';

// Parsed function with metadata | 解析后的函数及元数据
export interface ParsedFunction extends AbiFunction {
	functionType: FunctionType;
}

// Contract call result | 合约调用结果
export interface ContractCallResult {
	success: boolean;
	data?: unknown;
	error?: string;
	transactionHash?: Hash;
	receipt?: TransactionReceipt;
	gasUsed?: bigint;
}

// ABI fetch result | ABI 获取结果
export interface ABIFetchResult {
	success: boolean;
	abi?: Abi;
	isProxy?: boolean;
	implementationAddress?: Address;
	error?: string;
	needsManualInput?: boolean;
}

// Contract service class | 合约服务类
export class ContractService {
	private publicClient: PublicClient | null = null;
	private walletClient: WalletClient | null = null;

	// Initialize clients | 初始化客户端
	async init(chainId: number): Promise<void> {
		console.log('init', { chainId });
		this.publicClient = await getPublicClient(chainId);
		this.walletClient = await getWalletClient();

		console.log('init wallet', this.walletClient, this.publicClient);
	}

	// Fetch ABI using WhatsABI | 使用 WhatsABI 获取 ABI
	async fetchABI(contractAddress: Address): Promise<ABIFetchResult> {
		try {
			if (!this.publicClient) {
				throw new Error('Public client not initialized');
			}

			// Import the existing ABI fetcher | 导入现有的 ABI 获取器
			const { fetchContractAbi } = await import('./abi-fetcher');

			// Use the existing fetchContractAbi function | 使用现有的 fetchContractAbi 函数
			const result = await fetchContractAbi(contractAddress, this.publicClient);
			console.log({ result });
			if (result.abi && result.abi.length > 0) {
				// Check if it's a proxy contract | 检查是否为代理合约
				const isProxy = (result.abi as Abi).some(
					(item: Abi[0]) =>
						item.type === 'function' &&
						(item.name === 'implementation' || item.name === 'getImplementation')
				);

				return {
					success: true,
					abi: result.abi as Abi,
					isProxy
				};
			}

			// If no ABI found, suggest manual input | 如果未找到 ABI，建议手动输入
			return {
				success: false,
				needsManualInput: true,
				error: result.error || 'Unable to fetch ABI automatically. Please input ABI manually.'
			};
		} catch (error: unknown) {
			console.error('ABI fetch error:', error);

			// Check if it's a network error | 检查是否为网络错误
			if (
				error instanceof Error &&
				(error.message?.includes('network') || error.message?.includes('fetch'))
			) {
				return {
					success: false,
					error: 'Network error. Please check your connection and try again.',
					needsManualInput: true
				};
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to fetch ABI',
				needsManualInput: true
			};
		}
	}

	// Parse and validate ABI | 解析并验证 ABI
	parseAbi(abiString: string): Abi | null {
		try {
			// Try to parse as JSON | 尝试解析为 JSON
			const abi = JSON.parse(abiString) as Abi;

			// Validate basic structure | 验证基本结构
			if (!Array.isArray(abi)) {
				throw new Error('ABI must be an array');
			}

			// Validate each item has required fields | 验证每个项目都有必需字段
			for (const item of abi) {
				if (!item.type) {
					throw new Error('ABI item missing type field');
				}
			}

			return abi;
		} catch (error) {
			// Try to parse as human-readable ABI | 尝试解析为人类可读的 ABI
			try {
				const humanReadableAbi = abiString.split('\n').filter((line) => line.trim());
				return parseAbi(humanReadableAbi);
			} catch {
				console.error('Failed to parse ABI:', error);
				return null;
			}
		}
	}

	// Get all functions from ABI | 从 ABI 获取所有函数
	getFunctions(abi: Abi): ParsedFunction[] {
		const functions: ParsedFunction[] = [];

		for (const item of abi) {
			if (item.type === 'function') {
				const func = item as AbiFunction;

				// Determine function type | 确定函数类型
				let functionType: FunctionType = 'write';

				if (func.stateMutability === 'view' || func.stateMutability === 'pure') {
					functionType = 'read';
				} else if (func.stateMutability === 'payable') {
					functionType = 'payable';
				}

				functions.push({
					...func,
					functionType
				});
			}
		}

		return functions;
	}

	// Get only read functions | 获取只读函数
	getReadFunctions(abi: Abi): ParsedFunction[] {
		return this.getFunctions(abi).filter((f) => f.functionType === 'read');
	}

	// Get write functions | 获取可写函数
	getWriteFunctions(abi: Abi): ParsedFunction[] {
		return this.getFunctions(abi).filter(
			(f) => f.functionType === 'write' || f.functionType === 'payable'
		);
	}

	// Encode function call data | 编码函数调用数据
	encodeFunctionCall(abi: Abi, functionName: string, args: unknown[]): string {
		return encodeFunctionData({
			abi,
			functionName,
			args
		});
	}

	// Execute read function | 执行只读函数
	async readContract(
		contractAddress: Address,
		abi: Abi,
		functionName: string,
		args: unknown[] = []
	): Promise<ContractCallResult> {
		try {
			if (!this.publicClient) {
				throw new Error('Public client not initialized');
			}

			// Execute read call | 执行读取调用
			const result = await this.publicClient.readContract({
				address: contractAddress,
				abi,
				functionName,
				args
			});

			return {
				success: true,
				data: result
			};
		} catch (error: unknown) {
			console.error('Read contract error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to read contract'
			};
		}
	}

	// Execute write function | 执行写入函数
	async writeContract(
		contractAddress: Address,
		abi: Abi,
		functionName: string,
		args: unknown[] = [],
		value?: bigint
	): Promise<ContractCallResult> {
		try {
			if (!this.walletClient || !this.publicClient) {
				throw new Error('Wallet or public client not initialized');
			}

			// Get account | 获取账户
			const [account] = await this.walletClient.getAddresses();
			if (!account) {
				throw new Error('No account connected');
			}

			// Simulate the transaction first | 先模拟交易
			const { request } = await this.publicClient.simulateContract({
				address: contractAddress,
				abi,
				functionName,
				args,
				account,
				value
			});

			// Execute the transaction | 执行交易
			const hash = await this.walletClient.writeContract(request);

			// Wait for confirmation | 等待确认
			const receipt = await this.publicClient.waitForTransactionReceipt({
				hash,
				confirmations: 1
			});

			return {
				success: true,
				transactionHash: hash,
				receipt,
				gasUsed: receipt.gasUsed
			};
		} catch (error: unknown) {
			console.error('Write contract error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to write contract'
			};
		}
	}

	// Estimate gas for a transaction | 估算交易 gas
	async estimateGas(
		contractAddress: Address,
		abi: Abi,
		functionName: string,
		args: unknown[] = [],
		value?: bigint
	): Promise<bigint | null> {
		try {
			if (!this.publicClient || !this.walletClient) {
				throw new Error('Clients not initialized');
			}

			const [account] = await this.walletClient.getAddresses();
			if (!account) {
				throw new Error('No account connected');
			}

			const gas = await this.publicClient.estimateContractGas({
				address: contractAddress,
				abi,
				functionName,
				args,
				account,
				value
			});

			return gas;
		} catch (error) {
			console.error('Gas estimation error:', error);
			return null;
		}
	}

	// Format function signature | 格式化函数签名
	formatFunctionSignature(func: AbiFunction): string {
		const params = func.inputs.map((input) => `${input.type} ${input.name || '_'}`).join(', ');
		const returns =
			func.outputs.length > 0
				? ` returns (${func.outputs.map((output) => `${output.type} ${output.name || '_'}`).join(', ')})`
				: '';

		return `${func.name}(${params})${returns}`;
	}

	// Format result based on output types | 根据输出类型格式化结果
	formatResult(result: unknown, outputs: readonly AbiParameter[]): unknown {
		if (outputs.length === 0) return result;
		if (outputs.length === 1) {
			return this.formatSingleValue(result, outputs[0]);
		}

		// Multiple outputs | 多个输出
		const formatted: Record<string, unknown> = {};
		outputs.forEach((output, index) => {
			const value = Array.isArray(result)
				? result[index]
				: (result as Record<string, unknown>)[index];
			formatted[output.name || `output${index}`] = this.formatSingleValue(value, output);
		});
		return formatted;
	}

	// Format single value based on type | 根据类型格式化单个值
	private formatSingleValue(value: unknown, param: AbiParameter): unknown {
		if (value === null || value === undefined) return value;

		// Handle uint types | 处理 uint 类型
		if (param.type.startsWith('uint')) {
			try {
				const decimals = param.type === 'uint256' ? 18 : 0; // Assume 18 decimals for tokens | 假设代币为 18 位小数
				return {
					raw: (value as bigint).toString(),
					formatted: formatUnits(value as bigint, decimals)
				};
			} catch {
				return String(value);
			}
		}

		// Handle arrays | 处理数组
		if (param.type.endsWith('[]')) {
			const baseType = param.type.slice(0, -2);
			return (value as unknown[]).map((item: unknown) =>
				this.formatSingleValue(item, { ...param, type: baseType })
			);
		}

		// Handle tuples | 处理元组
		if (param.type === 'tuple' && 'components' in param) {
			const formatted: Record<string, unknown> = {};
			param.components?.forEach((component, index) => {
				const key = component.name || `field${index}`;
				const tupleValue = value as Record<string, unknown> | unknown[];
				const fieldValue = Array.isArray(tupleValue) ? tupleValue[index] : tupleValue[key];
				formatted[key] = this.formatSingleValue(fieldValue, component);
			});
			return formatted;
		}

		// Default formatting | 默认格式化
		if (typeof value === 'bigint') {
			return value.toString();
		}

		return value;
	}
}

// Singleton instance | 单例实例
export const contractService = new ContractService();
