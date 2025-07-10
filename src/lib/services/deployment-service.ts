// Smart contract deployment service | 智能合约部署服务
import type { Address, Hash, Hex } from 'viem';
import { get } from 'svelte/store';
import { currentProvider, currentAccount, currentChainId } from '$lib/stores/wallet';
import { DeploymentStorage, type DeploymentRecord } from './deployment-storage';
import * as m from '$lib/paraglide/messages.js';

// CREATE2 deterministic deployment proxy contract address | CREATE2 确定性部署代理合约地址
// Reference: https://github.com/Arachnid/deterministic-deployment-proxy
export const CREATE2_PROXY_ADDRESS: Address = '0x4e59b44847b379578588920ca78fbf26c0b4956c';

// Deployment types | 部署类型
export type DeploymentType = 'standard' | 'create2';

// Deployment request interface | 部署请求接口
export interface DeploymentRequest {
	// Contract name for identification | 合约名称用于识别
	contractName: string;
	// Contract bytecode (with constructor args if any) | 合约字节码（包含构造函数参数）
	bytecode: Hex;
	// Deployment type | 部署类型
	deploymentType: DeploymentType;
	// Salt for CREATE2 deployment | CREATE2 部署的盐值
	salt?: Hex;
	// Original salt input (for display purposes) | 原始盐值输入（用于显示）
	saltOriginal?: string;
	// Gas limit (optional, will estimate if not provided) | Gas 限制（可选，未提供时将估算）
	gasLimit?: bigint;
	// Gas price (optional, will use current if not provided) | Gas 价格（可选，未提供时使用当前价格）
	gasPrice?: bigint;
}

// Deployment result interface | 部署结果接口
export interface DeploymentResult {
	// Transaction hash | 交易哈希
	transactionHash: Hash;
	// Deployed contract address | 部署的合约地址
	contractAddress: Address;
	// Gas used for deployment | 部署使用的 Gas
	gasUsed: bigint;
	// Block number where deployment was confirmed | 部署确认的区块号
	blockNumber: bigint;
	// Network chain ID | 网络链 ID
	chainId: number;
	// Deployment type used | 使用的部署类型
	deploymentType: DeploymentType;
	// Salt used (for CREATE2) | 使用的盐值（CREATE2）
	salt?: Hex;
	// Original salt input | 原始盐值输入
	saltOriginal?: string;
	// Contract name | 合约名称
	contractName: string;
	// Deployment timestamp | 部署时间戳
	timestamp: number;
}

// Deployment service class | 部署服务类
export class DeploymentService {
	// Deploy contract using standard deployment | 使用标准部署方式部署合约
	static async deployStandard(request: DeploymentRequest): Promise<DeploymentResult> {
		// Validate deployment request | 验证部署请求
		this.validateDeploymentRequest(request);

		// Check wallet connection | 检查钱包连接
		const provider = get(currentProvider);
		const account = get(currentAccount);
		const chainId = get(currentChainId);

		if (!provider || !account) {
			throw new Error('Wallet not connected');
		}

		// const startTime = Date.now(); // Currently unused, kept for future metrics

		try {
			// Get wallet client and public client | 获取钱包客户端和公共客户端
			const walletClient = await provider.getWalletClient();
			const publicClient = provider.getPublicClient();

			// Estimate gas if not provided | 如果未提供则估算 Gas
			let gasLimit = request.gasLimit;
			if (!gasLimit) {
				try {
					gasLimit = await publicClient.estimateGas({
						account,
						data: request.bytecode,
						value: 0n
					});
					// Add 20% buffer for safety | 为安全起见增加 20% 缓冲
					gasLimit = (gasLimit * 120n) / 100n;
				} catch (error) {
					console.warn('Gas estimation failed, using default:', error);
					gasLimit = 3000000n; // Default gas limit | 默认 Gas 限制
				}
			}

			// Deploy contract | 部署合约
			console.log(`🚀 Deploying contract "${request.contractName}" using standard deployment...`);
			const hash = await walletClient.sendTransaction({
				account,
				to: null, // Important: null for contract deployment | 重要：合约部署时为 null
				data: request.bytecode,
				value: 0n,
				gas: gasLimit,
				gasPrice: request.gasPrice,
				chain: null
			});

			console.log(`⏳ Transaction sent with hash: ${hash}`);

			// Wait for transaction receipt | 等待交易收据
			console.log('⏳ Waiting for transaction confirmation...');
			const receipt = await publicClient.waitForTransactionReceipt({
				hash,
				timeout: 60_000 // 60 seconds timeout | 60 秒超时
			});

			console.log(`🧾 Transaction status: ${receipt.status}`);

			if (receipt.status === 'reverted') {
				throw new Error(m.deploy_error_reverted());
			}

			if (!receipt.contractAddress) {
				console.error('Receipt:', receipt);
				throw new Error(m.deploy_error_no_address());
			}

			console.log(`✅ Contract deployed successfully at: ${receipt.contractAddress}`);

			// Create deployment result | 创建部署结果
			const result: DeploymentResult = {
				transactionHash: hash,
				contractAddress: receipt.contractAddress,
				gasUsed: receipt.gasUsed,
				blockNumber: receipt.blockNumber,
				chainId,
				deploymentType: 'standard',
				contractName: request.contractName,
				timestamp: Date.now()
			};

			// Save to deployment history | 保存到部署历史
			await this.saveToHistory(result);

			return result;
		} catch (error) {
			console.error('Standard deployment failed:', error);

			throw new Error(`Deployment failed: ${(error as Error)?.message || 'Unknown error'}`);
		}
	}

	// Deploy contract using CREATE2 | 使用 CREATE2 部署合约
	static async deployCREATE2(request: DeploymentRequest): Promise<DeploymentResult> {
		// Validate deployment request | 验证部署请求
		this.validateDeploymentRequest(request);

		// Ensure salt is provided for CREATE2 deployment | 确保 CREATE2 部署提供盐值
		if (!request.salt) {
			throw new Error('Salt is required for CREATE2 deployment');
		}

		// Check wallet connection | 检查钱包连接
		const provider = get(currentProvider);
		const account = get(currentAccount);
		const chainId = get(currentChainId);

		if (!provider || !account) {
			throw new Error('Wallet not connected');
		}

		try {
			// Get wallet client | 获取钱包客户端
			const walletClient = await provider.getWalletClient();
			const publicClient = provider.getPublicClient();

			// Check if CREATE2 proxy is deployed | 检查 CREATE2 代理是否已部署
			const proxyCode = await publicClient.getCode({ address: CREATE2_PROXY_ADDRESS });
			if (!proxyCode || proxyCode === '0x') {
				throw new Error(
					`CREATE2 proxy not deployed on this network. Deploy the proxy at ${CREATE2_PROXY_ADDRESS} first.`
				);
			}

			// Prepare deployment data: salt + bytecode | 准备部署数据：盐值 + 字节码
			const deploymentData = `${request.salt}${request.bytecode.slice(2)}` as Hex;

			// Estimate gas if not provided | 如果未提供则估算 Gas
			let gasLimit = request.gasLimit;
			if (!gasLimit) {
				try {
					gasLimit = await publicClient.estimateGas({
						account,
						to: CREATE2_PROXY_ADDRESS,
						data: deploymentData,
						value: 0n
					});
					// Add 20% buffer for safety | 为安全起见增加 20% 缓冲
					gasLimit = (gasLimit * 120n) / 100n;
				} catch (error) {
					console.warn('Gas estimation failed, using default:', error);
					gasLimit = 3000000n; // Default gas limit | 默认 Gas 限制
				}
			}

			// Calculate predicted address | 计算预测地址
			const predictedAddress = await this.calculateCREATE2Address(
				CREATE2_PROXY_ADDRESS,
				request.salt,
				request.bytecode
			);

			console.log(`🚀 Deploying contract "${request.contractName}" using CREATE2...`);
			console.log(`📍 Predicted address: ${predictedAddress}`);

			// Send transaction to CREATE2 proxy | 向 CREATE2 代理发送交易
			const hash = await walletClient.sendTransaction({
				account,
				to: CREATE2_PROXY_ADDRESS,
				data: deploymentData,
				value: 0n,
				gas: gasLimit,
				gasPrice: request.gasPrice,
				chain: null
			});

			console.log(`⏳ Transaction sent with hash: ${hash}`);

			// Wait for transaction receipt | 等待交易收据
			console.log('⏳ Waiting for transaction confirmation...');
			const receipt = await publicClient.waitForTransactionReceipt({
				hash,
				timeout: 60_000 // 60 seconds timeout | 60 秒超时
			});

			console.log(`🧾 Transaction status: ${receipt.status}`);

			if (receipt.status === 'reverted') {
				throw new Error(m.deploy_error_create2_reverted());
			}

			// Verify contract was deployed to predicted address | 验证合约已部署到预测地址
			const deployedCode = await publicClient.getCode({ address: predictedAddress });
			if (!deployedCode || deployedCode === '0x') {
				console.error('No code at predicted address:', predictedAddress);
				throw new Error(m.deploy_error_create2_no_code());
			}

			console.log(`✅ Contract deployed successfully at predicted address: ${predictedAddress}`);

			// Create deployment result | 创建部署结果
			const result: DeploymentResult = {
				transactionHash: hash,
				contractAddress: predictedAddress,
				gasUsed: receipt.gasUsed,
				blockNumber: receipt.blockNumber,
				chainId,
				deploymentType: 'create2',
				salt: request.salt,
				saltOriginal: request.saltOriginal,
				contractName: request.contractName,
				timestamp: Date.now()
			};

			// Save to deployment history | 保存到部署历史
			await this.saveToHistory(result);

			return result;
		} catch (error) {
			console.error('CREATE2 deployment failed:', error);
			throw new Error(`CREATE2 deployment failed: ${(error as Error)?.message || 'Unknown error'}`);
		}
	}

	// Calculate CREATE2 address | 计算 CREATE2 地址
	static async calculateCREATE2Address(
		deployerAddress: Address,
		salt: Hex,
		bytecode: Hex
	): Promise<Address> {
		// Import keccak256 and concat functions | 导入 keccak256 和 concat 函数
		const { keccak256, concat } = await import('viem');

		// CREATE2 address calculation: keccak256(0xff ++ deployer ++ salt ++ keccak256(bytecode))[12:] | CREATE2 地址计算
		const bytecodeHash = keccak256(bytecode);
		const addressBytes = keccak256(concat(['0xff', deployerAddress, salt, bytecodeHash]));

		// Take last 20 bytes as address | 取最后 20 字节作为地址
		return `0x${addressBytes.slice(26)}` as Address;
	}

	// Generate random salt for CREATE2 | 为 CREATE2 生成随机盐值
	static generateRandomSalt(): Hex {
		// Generate 32 random bytes | 生成 32 个随机字节
		const randomBytes = new Uint8Array(32);
		crypto.getRandomValues(randomBytes);

		// Convert to hex string | 转换为十六进制字符串
		const hex = Array.from(randomBytes)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		return `0x${hex}` as Hex;
	}

	// Process salt input (handle empty, text, or hex) | 处理盐值输入（处理空值、文本或十六进制）
	static processSalt(saltInput: string): { salt: Hex; saltOriginal: string } {
		const trimmed = saltInput.trim();

		if (!trimmed) {
			// Empty salt: use zero bytes32 | 空盐值：使用零 bytes32
			return {
				salt: '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex,
				saltOriginal: ''
			};
		}

		if (trimmed.startsWith('0x')) {
			// Hex input: pad to 32 bytes | 十六进制输入：填充到 32 字节
			const hex = trimmed.slice(2);
			const paddedHex = hex.padStart(64, '0').slice(0, 64); // Ensure exactly 32 bytes
			return {
				salt: `0x${paddedHex}` as Hex,
				saltOriginal: trimmed
			};
		} else {
			// Text input: convert to bytes32 | 文本输入：转换为 bytes32
			const encoder = new TextEncoder();
			const bytes = encoder.encode(trimmed);
			const paddedBytes = new Uint8Array(32);
			paddedBytes.set(bytes.slice(0, 32)); // Take first 32 bytes max

			const hex = Array.from(paddedBytes)
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');

			return {
				salt: `0x${hex}` as Hex,
				saltOriginal: trimmed
			};
		}
	}

	// Predict CREATE2 address | 预测 CREATE2 地址
	static async predictCREATE2Address(
		bytecode: Hex,
		saltInput: string
	): Promise<{ address: Address; salt: Hex; saltOriginal: string }> {
		const { salt, saltOriginal } = this.processSalt(saltInput);
		const address = await this.calculateCREATE2Address(CREATE2_PROXY_ADDRESS, salt, bytecode);

		return {
			address,
			salt,
			saltOriginal
		};
	}

	// Validate deployment request | 验证部署请求
	private static validateDeploymentRequest(request: DeploymentRequest): void {
		// Check contract name | 检查合约名称
		if (!request.contractName || request.contractName.trim().length === 0) {
			throw new Error('Contract name is required');
		}

		// Check bytecode format | 检查字节码格式
		if (!request.bytecode || !request.bytecode.startsWith('0x')) {
			throw new Error('Invalid bytecode format: must start with 0x');
		}

		// Validate bytecode is valid hex | 验证字节码是有效的十六进制
		if (!/^0x[0-9a-fA-F]*$/.test(request.bytecode)) {
			throw new Error('Invalid bytecode format: must be valid hexadecimal');
		}

		// For CREATE2, validate salt | 对于 CREATE2，验证盐值
		if (request.deploymentType === 'create2') {
			if (request.salt === undefined || request.salt === null) {
				throw new Error('Salt is required for CREATE2 deployment');
			}

			if (!request.salt.startsWith('0x') || request.salt.length !== 66) {
				throw new Error('Invalid salt format: must be 32 bytes (0x + 64 hex characters)');
			}

			if (!/^0x[0-9a-fA-F]{64}$/.test(request.salt)) {
				throw new Error('Invalid salt format: must be valid 32-byte hexadecimal');
			}
		}
	}

	// Save deployment to history | 保存部署到历史
	private static async saveToHistory(result: DeploymentResult): Promise<void> {
		try {
			// Convert to DeploymentRecord format | 转换为 DeploymentRecord 格式
			const record: Omit<DeploymentRecord, 'id'> = {
				contractName: result.contractName,
				contractAddress: result.contractAddress,
				transactionHash: result.transactionHash,
				chainId: result.chainId,
				deploymentType: result.deploymentType,
				gasUsed: result.gasUsed,
				salt: result.salt,
				saltOriginal: result.saltOriginal,
				timestamp: result.timestamp,
				blockNumber: Number(result.blockNumber)
			};

			// Save to IndexedDB | 保存到 IndexedDB
			await DeploymentStorage.saveDeployment(record);

			console.log('💾 Deployment saved to IndexedDB');
		} catch (error) {
			console.error('Failed to save deployment to IndexedDB:', error);
			// Don't throw - this is not critical | 不抛出异常 - 这不是关键功能
		}
	}

	// Get deployment history | 获取部署历史
	static async getDeploymentHistory(): Promise<DeploymentRecord[]> {
		try {
			return await DeploymentStorage.getAllDeployments();
		} catch (error) {
			console.error('Failed to load deployment history:', error);
			// Return empty history if loading fails | 如果加载失败返回空历史
			return [];
		}
	}

	// Clear deployment history | 清除部署历史
	static async clearDeploymentHistory(): Promise<void> {
		try {
			await DeploymentStorage.clearAllDeployments();
			console.log('🗑️ Deployment history cleared');
		} catch (error) {
			console.error('Failed to clear deployment history:', error);
		}
	}

	// Get block explorer URL for contract | 获取合约的区块浏览器 URL
	static getExplorerUrl(chainId: number, address: Address): string | null {
		// Fallback to common explorers based on chainId | 基于 chainId 回退到常见浏览器
		const explorers: Record<number, string> = {
			1: 'https://etherscan.io',
			42161: 'https://arbiscan.io',
			10: 'https://optimistic.etherscan.io',
			8453: 'https://basescan.org',
			137: 'https://polygonscan.com',
			11155111: 'https://sepolia.etherscan.io'
		};

		const explorerBase = explorers[chainId];
		return explorerBase ? `${explorerBase}/address/${address}` : null;
	}
}
