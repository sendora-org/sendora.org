// Signing service for messages and transactions | 消息和交易签名服务
import type { Address } from 'viem';
import { get } from 'svelte/store';
import { currentProvider, currentAccount } from '$lib/stores/wallet';

// Signature result interface | 签名结果接口
export interface SignatureResult {
	signature: string;
	messageHash: string;
	signerAddress: Address;
	timestamp: number;
	originalMessage: string;
	signatureType: 'message' | 'typed_data' | 'raw';
}

// Signature verification interface | 签名验证接口
export interface VerificationRequest {
	signature: string;
	message: string;
	signerAddress: Address;
	signatureType: 'message' | 'typed_data' | 'raw';
	chainId?: number; // Optional: Network where signature was created | 可选：创建签名的网络
}

// Verification result interface | 验证结果接口
export interface VerificationResult {
	isValid: boolean;
	verifiedAt: number;
	request: VerificationRequest;
	verificationMethod: 'eoa' | 'erc1271' | 'format_check';
	isContractAccount: boolean;
	verifiedOnChainId?: number; // Chain where verification was successful | 验证成功的链
	errorMessage?: string;
}

// EIP-712 typed data structure | EIP-712 类型化数据结构
export interface TypedData {
	domain: {
		name?: string;
		version?: string;
		chainId?: number;
		verifyingContract?: Address;
		salt?: `0x${string}`;
	};
	types: Record<string, Array<{ name: string; type: string }>>;
	primaryType: string;
	message: Record<string, unknown>;
}

// Signing service class | 签名服务类
export class SigningService {
	// Sign personal message | 签署个人消息
	static async signPersonalMessage(message: string): Promise<SignatureResult> {
		// Check wallet connection | 检查钱包连接
		const provider = get(currentProvider);
		const account = get(currentAccount);

		if (!provider || !account) {
			throw new Error('Wallet not connected');
		}

		try {
			// Get wallet client | 获取钱包客户端
			const walletClient = await provider.getWalletClient();

			// Sign personal message | 签署个人消息
			const signature = await walletClient.signMessage({
				account,
				message
			});

			// Generate message hash for verification | 生成消息哈希用于验证
			const messageHash = await this.getPersonalMessageHash(message);

			return {
				signature,
				messageHash,
				signerAddress: account,
				timestamp: Date.now(),
				originalMessage: message,
				signatureType: 'message'
			};
		} catch (error: unknown) {
			console.error('Failed to sign personal message:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to sign personal message';
			throw new Error(errorMessage);
		}
	}

	// Sign typed data (EIP-712) | 签署类型化数据 (EIP-712)
	static async signTypedData(typedData: TypedData): Promise<SignatureResult> {
		// Check wallet connection | 检查钱包连接
		const provider = get(currentProvider);
		const account = get(currentAccount);

		if (!provider || !account) {
			throw new Error('Wallet not connected');
		}

		try {
			// Get wallet client | 获取钱包客户端
			const walletClient = await provider.getWalletClient();

			// Sign typed data | 签署类型化数据
			// Remove EIP712Domain from types as viem handles it automatically | 移除 EIP712Domain，因为 viem 会自动处理
			const typesWithoutDomain = Object.fromEntries(
				Object.entries(typedData.types).filter(([key]) => key !== 'EIP712Domain')
			);

			const signature = await walletClient.signTypedData({
				account,
				domain: typedData.domain,
				types: typesWithoutDomain,
				primaryType: typedData.primaryType,
				message: typedData.message
			} as Parameters<typeof walletClient.signTypedData>[0]);

			// Generate typed data hash | 生成类型化数据哈希
			const messageHash = await this.getTypedDataHash(typedData);

			return {
				signature,
				messageHash,
				signerAddress: account,
				timestamp: Date.now(),
				originalMessage: JSON.stringify(typedData, null, 2),
				signatureType: 'typed_data'
			};
		} catch (error: unknown) {
			console.error('Failed to sign typed data:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to sign typed data';
			throw new Error(errorMessage);
		}
	}

	// Sign raw message (hex data) | 签署原始消息（hex 数据）
	static async signRawMessage(hexData: string): Promise<SignatureResult> {
		// Check wallet connection | 检查钱包连接
		const provider = get(currentProvider);
		const account = get(currentAccount);

		if (!provider || !account) {
			throw new Error('Wallet not connected');
		}

		try {
			// Validate hex format | 验证 hex 格式
			if (!hexData.startsWith('0x')) {
				throw new Error('Hex data must start with 0x');
			}

			// Get wallet client | 获取钱包客户端
			const walletClient = await provider.getWalletClient();

			// Sign raw message data | 签署原始消息数据
			const signature = await walletClient.signMessage({
				account,
				message: { raw: hexData as `0x${string}` }
			});

			// Generate message hash for raw data | 生成原始数据的消息哈希
			const messageHash = await this.getRawMessageHash(hexData);

			return {
				signature,
				messageHash,
				signerAddress: account,
				timestamp: Date.now(),
				originalMessage: hexData,
				signatureType: 'raw'
			};
		} catch (error: unknown) {
			console.error('Failed to sign raw message:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to sign raw message';
			throw new Error(errorMessage);
		}
	}

	// Check if address is a contract | 检查地址是否是合约
	private static async isContract(address: Address): Promise<boolean> {
		try {
			const provider = get(currentProvider);
			if (!provider) {
				return false;
			}

			const publicClient = provider.getPublicClient();
			const code = await publicClient.getCode({ address });
			console.log({ code, address });
			return code !== undefined && code !== '0x' && code !== '0x0';
		} catch (error) {
			console.error('Failed to check if address is contract:', error);
			return false;
		}
	}

	// Generate alternative message hashes for smart wallets | 为智能钱包生成替代消息哈希
	private static async generateAlternativeHashes(
		originalMessage: string,
		signatureType: 'message' | 'typed_data' | 'userop' | 'raw'
	): Promise<string[]> {
		const hashes: string[] = [];

		try {
			switch (signatureType) {
				case 'message': {
					const { hashMessage, keccak256, toBytes } = await import('viem');

					// CRITICAL: For smart contract verification, we need the hash that the wallet actually signed | 关键：对于智能合约验证，我们需要钱包实际签名的哈希
					// Coinbase Smart Wallet signs the EIP-191 formatted hash, so we pass that hash to the contract | Coinbase Smart Wallet 签名 EIP-191 格式的哈希，所以我们将该哈希传给合约
					const standardHash = hashMessage(originalMessage);
					hashes.push(standardHash);

					// Alternative: Some contracts might expect just the keccak256 of the raw message | 替代：一些合约可能期望原始消息的 keccak256
					const directHash = keccak256(toBytes(originalMessage));
					hashes.push(directHash);

					console.log(`🔍 Smart Contract Verification: Generated hashes for personal message`, {
						originalMessage:
							originalMessage.slice(0, 50) + (originalMessage.length > 50 ? '...' : ''),
						eip191Hash: standardHash,
						directKeccak256: directHash,
						note: 'The wallet signed the EIP-191 hash, so the contract should verify against that'
					});

					break;
				}

				case 'raw': {
					// For raw messages, try the message as-is if it looks like a hash | 对于原始消息，如果看起来像哈希则按原样尝试
					if (originalMessage.startsWith('0x') && originalMessage.length === 66) {
						hashes.push(originalMessage);
					} else {
						const { keccak256 } = await import('viem');
						hashes.push(keccak256(originalMessage as `0x${string}`));
					}
					break;
				}

				case 'typed_data': {
					const typedData = JSON.parse(originalMessage) as TypedData;
					const { hashTypedData } = await import('viem');
					hashes.push(hashTypedData(typedData));
					break;
				}

				case 'userop': {
					const hash = originalMessage.startsWith('0x') ? originalMessage : `0x${originalMessage}`;
					hashes.push(hash);
					break;
				}
			}
		} catch (error) {
			console.error('Failed to generate alternative hashes:', error);
		}

		// Remove duplicates | 移除重复项
		return [...new Set(hashes)];
	}

	// Log signature details for debugging smart wallet issues | 记录签名详情以调试智能钱包问题
	private static logSignatureDetails(
		signature: string,
		messageHash: string,
		contractAddress: Address,
		originalMessage?: string,
		signatureType?: string
	): void {
		// Check if this looks like a Coinbase Smart Wallet signature | 检查是否像 Coinbase Smart Wallet 签名
		const isCoinbaseSignature = signature.length > 1000 && signature.includes('webauthn');

		console.log(`🔍 ERC-1271: Signature verification details:`, {
			contractAddress,
			signatureType,
			originalMessage:
				originalMessage?.slice(0, 100) +
				(originalMessage && originalMessage.length > 100 ? '...' : ''),
			messageHash,
			signature: isCoinbaseSignature
				? signature.slice(0, 100) + '...(truncated, WebAuthn signature)'
				: signature,
			signatureLength: signature.length,
			signatureIsHex: signature.startsWith('0x'),
			messageHashLength: messageHash.length,
			messageHashIsHex: messageHash.startsWith('0x'),
			isCoinbaseWebAuthnSignature: isCoinbaseSignature
		});

		// If it's a Coinbase signature, extract some WebAuthn details | 如果是 Coinbase 签名，提取一些 WebAuthn 详细信息
		if (isCoinbaseSignature) {
			try {
				// Try to find and parse WebAuthn data | 尝试查找和解析 WebAuthn 数据
				const hexWithoutPrefix = signature.slice(2);
				const matches = hexWithoutPrefix.match(/7b2274797065223a22776562617574686e2e676574/g);
				console.log(
					`🔍 Coinbase Smart Wallet: Found ${matches?.length || 0} WebAuthn challenge(s) in signature`
				);

				// Look for coinbase.com domain | 查找 coinbase.com 域名
				if (signature.includes('636f696e626173652e636f6d')) {
					console.log(`✅ Coinbase Smart Wallet: Verified signature contains coinbase.com domain`);
				}
			} catch (error) {
				console.warn('Failed to parse Coinbase WebAuthn details:', error);
			}
		}
	}

	// Validate if string is valid bytes32 (66 chars: 0x + 64 hex chars) | 验证字符串是否为有效的 bytes32
	private static isValidBytes32(data: string): boolean {
		return (
			typeof data === 'string' &&
			data.startsWith('0x') &&
			data.length === 66 &&
			/^0x[0-9a-fA-F]{64}$/.test(data)
		);
	}

	// Validate if string is valid bytes data (starts with 0x, even length, valid hex) | 验证字符串是否为有效的 bytes 数据
	private static isValidBytesData(data: string): boolean {
		return (
			typeof data === 'string' &&
			data.startsWith('0x') &&
			data.length >= 2 &&
			data.length % 2 === 0 &&
			/^0x[0-9a-fA-F]*$/.test(data)
		);
	}

	// Verify signature using ERC-1271 for smart contract wallets | 使用 ERC-1271 验证智能合约钱包签名
	private static async verifyContractSignature(
		signature: string,
		messageHash: string,
		contractAddress: Address,
		preferredChainId?: number,
		originalMessage?: string,
		signatureType?: 'message' | 'typed_data' | 'raw'
	): Promise<{ isValid: boolean; verifiedOnChainId?: number }> {
		const { createPublicClient, http } = await import('viem');
		const { mainnet, polygon, optimism, arbitrum, base } = await import('viem/chains');

		// Common networks where smart wallets are deployed | 智能钱包常部署的网络
		const commonChains = [
			{ chain: mainnet, rpc: 'https://eth.llamarpc.com' },
			{ chain: polygon, rpc: 'https://polygon.llamarpc.com' },
			{ chain: optimism, rpc: 'https://optimism.llamarpc.com' },
			{ chain: arbitrum, rpc: 'https://arbitrum.llamarpc.com' },
			{ chain: base, rpc: 'https://base.llamarpc.com' }
		];

		// ERC-1271 magic value for valid signatures | ERC-1271 有效签名的魔法值
		const ERC1271_MAGIC_VALUE = '0x1626ba7e';

		// ERC-1271 ABI for isValidSignature function | ERC-1271 isValidSignature 函数的 ABI
		const erc1271Abi = [
			{
				name: 'isValidSignature',
				type: 'function',
				stateMutability: 'view',
				inputs: [
					{ name: 'hash', type: 'bytes32' },
					{ name: 'signature', type: 'bytes' }
				],
				outputs: [{ name: '', type: 'bytes4' }]
			}
		];

		// Try current network first if available | 如果可用，首先尝试当前网络
		const provider = get(currentProvider);
		if (provider) {
			try {
				const publicClient = provider.getPublicClient();
				const currentChainId = await publicClient.getChainId();

				// If we have a preferred chain ID and it matches current, or no preference | 如果有首选链 ID 且匹配当前，或无偏好
				if (!preferredChainId || currentChainId === preferredChainId) {
					console.log(
						`🔍 ERC-1271: Trying verification on current network (Chain ID: ${currentChainId})`
					);

					// Check if contract exists on current network | 检查合约是否存在于当前网络
					const bytecode = await publicClient.getBytecode({ address: contractAddress });
					if (bytecode && bytecode !== '0x' && bytecode !== '0x0') {
						console.log(`🔍 ERC-1271: Calling isValidSignature on current network`, {
							chainId: currentChainId,
							contract: contractAddress,
							messageHash,
							signature,
							bytecodeLength: bytecode.length
						});

						// Log signature details for debugging | 记录签名详情以供调试
						this.logSignatureDetails(
							signature,
							messageHash,
							contractAddress,
							originalMessage,
							signatureType
						);

						// Try multiple hash formats for better compatibility | 尝试多种哈希格式以获得更好的兼容性
						const hashesToTry =
							originalMessage && signatureType
								? await this.generateAlternativeHashes(originalMessage, signatureType)
								: [messageHash];

						// Use signature as-is - smart wallets like Coinbase return correctly formatted signatures | 直接使用签名 - Coinbase 等智能钱包返回正确格式的签名
						for (const hashToTry of hashesToTry) {
							try {
								// Validate parameters before calling contract | 调用合约前验证参数
								if (!this.isValidBytes32(hashToTry)) {
									console.warn(`❌ ERC-1271: Invalid hash format: ${hashToTry}`);
									continue;
								}

								if (!this.isValidBytesData(signature)) {
									console.warn(
										`❌ ERC-1271: Invalid signature format: ${signature.slice(0, 100)}...`
									);
									continue;
								}

								console.log(
									`🔍 ERC-1271: Trying hash: ${hashToTry} with original signature from wallet`
								);
								console.log(`🔧 ERC-1271: Parameter validation:`, {
									hashValid: this.isValidBytes32(hashToTry),
									signatureValid: this.isValidBytesData(signature),
									hashLength: hashToTry.length,
									signatureLength: signature.length
								});

								const result = await publicClient.readContract({
									address: contractAddress,
									abi: erc1271Abi,
									functionName: 'isValidSignature',
									args: [hashToTry as `0x${string}`, signature as `0x${string}`]
								});

								console.log(`🔍 ERC-1271: Contract returned on current network:`, {
									hash: hashToTry,
									result,
									expected: ERC1271_MAGIC_VALUE,
									isValid: result === ERC1271_MAGIC_VALUE
								});

								if (result === ERC1271_MAGIC_VALUE) {
									console.log(
										`✅ ERC-1271: Signature verified on current network (Chain ID: ${currentChainId}) with hash: ${hashToTry}`
									);
									return { isValid: true, verifiedOnChainId: currentChainId };
								}
							} catch (contractError: unknown) {
								console.warn(
									`❌ ERC-1271: Contract call failed for hash ${hashToTry}:`,
									contractError
								);

								// Enhanced error analysis for reverts | 增强的 revert 错误分析
								if (
									contractError instanceof Error &&
									contractError.message.includes('execution reverted')
								) {
									console.error(
										`🚨 ERC-1271: UNEXPECTED REVERT - ERC-1271 should not revert on invalid signatures!`,
										{
											contractAddress,
											messageHash: hashToTry,
											signaturePreview: signature.slice(0, 100),
											signatureLength: signature.length,
											originalMessage: originalMessage?.slice(0, 50),
											signatureType,
											errorDetails: contractError,
											possibleCauses: [
												'Contract is not ERC-1271 compliant',
												'Hash parameter is not bytes32 format',
												'Signature parameter is not valid bytes',
												'Contract has internal bugs',
												'Gas limit too low'
											]
										}
									);
								}
								// Continue with next hash | 继续下一个哈希
							}
						}
					}
				}
			} catch (error) {
				console.warn(`❌ ERC-1271: Current network verification failed:`, error);
			}
		}

		// If preferred chain ID specified, try that network first | 如果指定了首选链 ID，首先尝试该网络
		if (preferredChainId) {
			const targetChain = commonChains.find((c) => c.chain.id === preferredChainId);
			if (targetChain) {
				try {
					console.log(
						`🔍 ERC-1271: Trying verification on preferred network (Chain ID: ${preferredChainId})`
					);
					const client = createPublicClient({
						chain: targetChain.chain,
						transport: http(targetChain.rpc)
					});

					// Check if contract exists on this network | 检查合约是否存在于此网络
					const bytecode = await client.getBytecode({ address: contractAddress });
					if (bytecode && bytecode !== '0x' && bytecode !== '0x0') {
						// Log signature details for debugging | 记录签名详情以供调试
						this.logSignatureDetails(
							signature,
							messageHash,
							contractAddress,
							originalMessage,
							signatureType
						);

						// Try multiple hash formats for better compatibility | 尝试多种哈希格式以获得更好的兼容性
						const hashesToTry =
							originalMessage && signatureType
								? await this.generateAlternativeHashes(originalMessage, signatureType)
								: [messageHash];

						for (const hashToTry of hashesToTry) {
							try {
								// Validate parameters before calling contract | 调用合约前验证参数
								if (!this.isValidBytes32(hashToTry)) {
									console.warn(`❌ ERC-1271: Invalid hash format: ${hashToTry}`);
									continue;
								}

								if (!this.isValidBytesData(signature)) {
									console.warn(
										`❌ ERC-1271: Invalid signature format: ${signature.slice(0, 100)}...`
									);
									continue;
								}

								console.log(
									`🔍 ERC-1271: Trying hash: ${hashToTry} on preferred network (Chain ID: ${preferredChainId})`
								);
								const result = await client.readContract({
									address: contractAddress,
									abi: erc1271Abi,
									functionName: 'isValidSignature',
									args: [hashToTry as `0x${string}`, signature as `0x${string}`]
								});

								console.log(`🔍 ERC-1271: Contract returned on preferred network:`, {
									hash: hashToTry,
									result,
									expected: ERC1271_MAGIC_VALUE,
									isValid: result === ERC1271_MAGIC_VALUE
								});

								if (result === ERC1271_MAGIC_VALUE) {
									console.log(
										`✅ ERC-1271: Signature verified on preferred network (Chain ID: ${preferredChainId}) with hash: ${hashToTry}`
									);
									return { isValid: true, verifiedOnChainId: preferredChainId };
								}
							} catch (contractError: unknown) {
								console.warn(
									`❌ ERC-1271: Contract call failed on preferred network for hash ${hashToTry}:`,
									contractError
								);
								if (
									contractError instanceof Error &&
									contractError.message.includes('execution reverted')
								) {
									console.error(
										`🚨 ERC-1271: UNEXPECTED REVERT on preferred network - ERC-1271 should not revert!`,
										{
											contractAddress,
											messageHash: hashToTry,
											signaturePreview: signature.slice(0, 100),
											signatureLength: signature.length,
											chainId: preferredChainId,
											errorDetails: contractError,
											possibleCauses: [
												'Contract is not ERC-1271 compliant',
												'Hash parameter is not bytes32 format',
												'Signature parameter is not valid bytes',
												'Contract has internal bugs'
											]
										}
									);
								}
							}
						}
					}
				} catch (error) {
					console.warn(
						`❌ ERC-1271: Preferred network (${preferredChainId}) verification failed:`,
						error
					);
				}
			}
		}

		// Try other common networks where smart wallets are deployed | 尝试智能钱包常部署的其他网络
		console.log('🔍 ERC-1271: Trying verification on common networks...');
		for (const { chain, rpc } of commonChains) {
			// Skip if already tried | 如果已经尝试过则跳过
			if (preferredChainId === chain.id) continue;
			if (provider) {
				try {
					const currentChainId = await provider.getPublicClient().getChainId();
					if (currentChainId === chain.id) continue;
				} catch {
					// Ignore chain ID lookup errors | 忽略链 ID 查找错误
				}
			}

			try {
				console.log(`🔍 ERC-1271: Trying Chain ID: ${chain.id} (${chain.name})`);
				const client = createPublicClient({
					chain,
					transport: http(rpc)
				});

				// Check if contract exists on this network | 检查合约是否存在于此网络
				const bytecode = await client.getBytecode({ address: contractAddress });
				if (!bytecode || bytecode === '0x' || bytecode === '0x0') {
					console.log(`📝 ERC-1271: No contract found on ${chain.name} (Chain ID: ${chain.id})`);
					continue;
				}

				console.log(`📝 ERC-1271: Contract found on ${chain.name}, attempting verification...`);

				// Try multiple hash formats for better compatibility | 尝试多种哈希格式以获得更好的兼容性
				const hashesToTry =
					originalMessage && signatureType
						? await this.generateAlternativeHashes(originalMessage, signatureType)
						: [messageHash];

				for (const hashToTry of hashesToTry) {
					try {
						// Validate parameters before calling contract | 调用合约前验证参数
						if (!this.isValidBytes32(hashToTry)) {
							console.warn(`❌ ERC-1271: Invalid hash format: ${hashToTry}`);
							continue;
						}

						if (!this.isValidBytesData(signature)) {
							console.warn(`❌ ERC-1271: Invalid signature format: ${signature.slice(0, 100)}...`);
							continue;
						}

						console.log(
							`🔍 ERC-1271: Trying hash: ${hashToTry} on ${chain.name} (Chain ID: ${chain.id})`
						);
						const result = await client.readContract({
							address: contractAddress,
							abi: erc1271Abi,
							functionName: 'isValidSignature',
							args: [hashToTry as `0x${string}`, signature as `0x${string}`]
						});

						console.log(`🔍 ERC-1271: Contract returned on ${chain.name}:`, {
							hash: hashToTry,
							result,
							expected: ERC1271_MAGIC_VALUE,
							isValid: result === ERC1271_MAGIC_VALUE
						});

						if (result === ERC1271_MAGIC_VALUE) {
							console.log(
								`✅ ERC-1271: Signature verified on ${chain.name} (Chain ID: ${chain.id}) with hash: ${hashToTry}`
							);
							return { isValid: true, verifiedOnChainId: chain.id };
						}
					} catch (contractError: unknown) {
						console.warn(
							`❌ ERC-1271: Contract call failed on ${chain.name} for hash ${hashToTry}:`,
							contractError
						);
						if (
							contractError instanceof Error &&
							contractError.message.includes('execution reverted')
						) {
							console.error(
								`🚨 ERC-1271: UNEXPECTED REVERT on ${chain.name} - ERC-1271 should not revert!`,
								{
									contractAddress,
									messageHash: hashToTry,
									signaturePreview: signature.slice(0, 100),
									signatureLength: signature.length,
									chainId: chain.id,
									errorDetails: contractError,
									possibleCauses: [
										'Contract is not ERC-1271 compliant',
										'Hash parameter is not bytes32 format',
										'Signature parameter is not valid bytes',
										'Contract has internal bugs'
									]
								}
							);
						}
					}
				}
			} catch (error) {
				console.warn(
					`❌ ERC-1271: ${chain.name} (Chain ID: ${chain.id}) verification failed:`,
					error
				);
			}
		}

		console.log('❌ ERC-1271: Signature verification failed on all attempted networks');
		return { isValid: false };
	}

	// Verify signature using viem's built-in methods with ERC-1271 support | 使用 viem 内置方法验证签名，支持 ERC-1271
	static async verifySignature(
		signature: string,
		message: string,
		signerAddress: Address,
		signatureType: 'message' | 'typed_data' | 'raw',
		preferredChainId?: number
	): Promise<boolean> {
		try {
			const provider = get(currentProvider);
			if (!provider) {
				throw new Error('Wallet not connected');
			}

			// Create public client for the appropriate chain | 为适当的链创建公共客户端
			let publicClient = provider.getPublicClient();

			// If preferred chain ID is specified, create client for that chain | 如果指定了首选链 ID，为该链创建客户端
			if (preferredChainId) {
				try {
					const currentChainId = await publicClient.getChainId();
					if (currentChainId !== preferredChainId) {
						// Create a client for the preferred chain | 为首选链创建客户端
						const { createPublicClient, http } = await import('viem');
						const { mainnet, polygon, optimism, arbitrum, base } = await import('viem/chains');

						const chainMap = {
							1: { chain: mainnet, rpc: 'https://eth.llamarpc.com' },
							137: { chain: polygon, rpc: 'https://polygon.llamarpc.com' },
							10: { chain: optimism, rpc: 'https://optimism.llamarpc.com' },
							42161: { chain: arbitrum, rpc: 'https://arbitrum.llamarpc.com' },
							8453: { chain: base, rpc: 'https://base.llamarpc.com' }
						};

						const chainConfig = chainMap[preferredChainId as keyof typeof chainMap];
						if (chainConfig) {
							publicClient = createPublicClient({
								chain: chainConfig.chain,
								transport: http(chainConfig.rpc)
							}) as typeof publicClient;
						}
					}
				} catch (error) {
					console.warn('Failed to switch to preferred chain, using current client:', error);
				}
			}

			// Use viem's built-in verification methods which handle both EOA and ERC-1271 automatically | 使用 viem 内置验证方法，自动处理 EOA 和 ERC-1271
			switch (signatureType) {
				case 'message':
					// viem's verifyMessage automatically detects contract accounts and uses ERC-1271 | viem 的 verifyMessage 自动检测合约账户并使用 ERC-1271
					return await publicClient.verifyMessage({
						address: signerAddress,
						message,
						signature: signature as `0x${string}`
					});

				case 'raw':
					// Verify raw message signature | 验证原始消息签名
					return await publicClient.verifyMessage({
						address: signerAddress,
						message: { raw: message as `0x${string}` },
						signature: signature as `0x${string}`
					});

				case 'typed_data': {
					const typedData = JSON.parse(message) as TypedData;
					// Remove EIP712Domain from types as viem handles it automatically | 移除 EIP712Domain，因为 viem 会自动处理
					const typesWithoutDomain = Object.fromEntries(
						Object.entries(typedData.types).filter(([key]) => key !== 'EIP712Domain')
					);
					// viem's verifyTypedData automatically detects contract accounts and uses ERC-1271 | viem 的 verifyTypedData 自动检测合约账户并使用 ERC-1271
					return await publicClient.verifyTypedData({
						address: signerAddress,
						signature: signature as `0x${string}`,
						domain: typedData.domain,
						types: typesWithoutDomain as unknown as Parameters<
							typeof publicClient.verifyTypedData
						>[0]['types'],
						primaryType: typedData.primaryType,
						message: typedData.message
					});
				}

				default:
					return false;
			}
		} catch (error) {
			console.error('Failed to verify signature:', error);
			return false;
		}
	}

	// Internal signature verification with chain ID tracking using viem's built-in methods | 使用 viem 内置方法的内部签名验证，带链 ID 跟踪
	private static async verifySignatureWithChainTracking(
		signature: string,
		message: string,
		signerAddress: Address,
		signatureType: 'message' | 'typed_data' | 'raw',
		preferredChainId?: number
	): Promise<{
		isValid: boolean;
		verifiedOnChainId?: number;
		verificationMethod?: 'eoa' | 'erc1271';
	}> {
		try {
			const provider = get(currentProvider);
			if (!provider) {
				throw new Error('Wallet not connected');
			}

			// Create public client for the appropriate chain | 为适当的链创建公共客户端
			let publicClient = provider.getPublicClient();
			let currentChainId: number | undefined;

			try {
				currentChainId = await publicClient.getChainId();
			} catch {
				// Chain ID not available | 链 ID 不可用
			}

			// If preferred chain ID is specified and different from current, try that chain | 如果指定了首选链 ID 且与当前不同，尝试该链
			if (preferredChainId && currentChainId !== preferredChainId) {
				try {
					// Create a client for the preferred chain | 为首选链创建客户端
					const { createPublicClient, http } = await import('viem');
					const { mainnet, polygon, optimism, arbitrum, base } = await import('viem/chains');

					const chainMap = {
						1: { chain: mainnet, rpc: 'https://eth.llamarpc.com' },
						137: { chain: polygon, rpc: 'https://polygon.llamarpc.com' },
						10: { chain: optimism, rpc: 'https://optimism.llamarpc.com' },
						42161: { chain: arbitrum, rpc: 'https://arbitrum.llamarpc.com' },
						8453: { chain: base, rpc: 'https://base.llamarpc.com' }
					};

					const chainConfig = chainMap[preferredChainId as keyof typeof chainMap];
					if (chainConfig) {
						publicClient = createPublicClient({
							chain: chainConfig.chain,
							transport: http(chainConfig.rpc)
						}) as typeof publicClient;
						currentChainId = preferredChainId;
					}
				} catch (error) {
					console.warn('Failed to switch to preferred chain, using current client:', error);
				}
			}

			// Check if the signer is a contract to determine verification method | 检查签名者是否是合约以确定验证方法
			const isContract = await this.isContract(signerAddress);
			let verificationMethod: 'eoa' | 'erc1271' = 'eoa';

			// Use viem's built-in verification methods which handle both EOA and ERC-1271 automatically | 使用 viem 内置验证方法，自动处理 EOA 和 ERC-1271
			let isValid = false;

			// If it's a contract, we know ERC-1271 will be used | 如果是合约，我们知道将使用 ERC-1271
			if (isContract) {
				verificationMethod = 'erc1271';
				console.log(`🔍 Account ${signerAddress} is a contract, will use ERC-1271 verification`);
			}

			switch (signatureType) {
				case 'message':
					// viem's verifyMessage automatically detects contract accounts and uses ERC-1271 | viem 的 verifyMessage 自动检测合约账户并使用 ERC-1271
					isValid = await publicClient.verifyMessage({
						address: signerAddress,
						message,
						signature: signature as `0x${string}`
					});
					break;

				case 'raw':
					// Verify raw message signature | 验证原始消息签名
					isValid = await publicClient.verifyMessage({
						address: signerAddress,
						message: { raw: message as `0x${string}` },
						signature: signature as `0x${string}`
					});
					break;

				case 'typed_data': {
					const typedData = JSON.parse(message) as TypedData;
					// Remove EIP712Domain from types as viem handles it automatically | 移除 EIP712Domain，因为 viem 会自动处理
					const typesWithoutDomain = Object.fromEntries(
						Object.entries(typedData.types).filter(([key]) => key !== 'EIP712Domain')
					);
					// viem's verifyTypedData automatically detects contract accounts and uses ERC-1271 | viem 的 verifyTypedData 自动检测合约账户并使用 ERC-1271
					isValid = await publicClient.verifyTypedData({
						address: signerAddress,
						signature: signature as `0x${string}`,
						domain: typedData.domain,
						types: typesWithoutDomain as unknown as Parameters<
							typeof publicClient.verifyTypedData
						>[0]['types'],
						primaryType: typedData.primaryType,
						message: typedData.message
					});
					break;
				}

				default:
					isValid = false;
			}

			return { isValid, verifiedOnChainId: currentChainId, verificationMethod };
		} catch (error) {
			console.error('Failed to verify signature:', error);
			return { isValid: false, verificationMethod: 'eoa' };
		}
	}

	// Comprehensive signature verification | 综合签名验证
	static async verifySignatureComprehensive(
		request: VerificationRequest
	): Promise<VerificationResult> {
		try {
			const provider = get(currentProvider);
			if (!provider) {
				throw new Error('Wallet not connected');
			}

			// Check if the signer is a contract account | 检查签名者是否是合约账户
			const isContractAccount = await this.isContract(request.signerAddress);

			let verificationMethod: 'eoa' | 'erc1271' | 'format_check' = 'eoa';
			let verificationResult: { isValid: boolean; verifiedOnChainId?: number };
			let errorMessage: string | undefined;

			try {
				// Use our internal verification with chain tracking | 使用内部验证带链跟踪
				const result = await this.verifySignatureWithChainTracking(
					request.signature,
					request.message,
					request.signerAddress,
					request.signatureType,
					request.chainId
				);
				verificationResult = {
					isValid: result.isValid,
					verifiedOnChainId: result.verifiedOnChainId
				};

				// Use the verification method from the result | 使用结果中的验证方法
				verificationMethod = result.verificationMethod || (isContractAccount ? 'erc1271' : 'eoa');
			} catch (error: unknown) {
				errorMessage = error instanceof Error ? error.message : 'Verification failed';
				verificationResult = { isValid: false };
			}

			return {
				isValid: verificationResult.isValid,
				verifiedAt: Date.now(),
				request,
				verificationMethod,
				isContractAccount,
				verifiedOnChainId: verificationResult.verifiedOnChainId,
				errorMessage
			};
		} catch (error: unknown) {
			console.error('Signature verification failed:', error);
			return {
				isValid: false,
				verifiedAt: Date.now(),
				request,
				verificationMethod: 'eoa',
				isContractAccount: false,
				errorMessage: error instanceof Error ? error.message : 'Verification failed'
			};
		}
	}

	// Get personal message hash | 获取个人消息哈希
	private static async getPersonalMessageHash(message: string): Promise<string> {
		try {
			// Use the same hashMessage function that wallets use for signing | 使用与钱包签名相同的 hashMessage 函数
			// This adds the Ethereum personal message prefix: "\x19Ethereum Signed Message:\n" + length + message
			const { hashMessage } = await import('viem');
			return hashMessage(message);
		} catch (error) {
			console.error('Failed to generate message hash:', error);
			return '0x0';
		}
	}

	// Get raw message hash | 获取原始消息哈希
	private static async getRawMessageHash(hexData: string): Promise<string> {
		try {
			// For raw messages, the hash is the keccak256 of the hex data itself | 对于原始消息，哈希是 hex 数据本身的 keccak256
			const { keccak256 } = await import('viem');
			return keccak256(hexData as `0x${string}`);
		} catch (error) {
			console.error('Failed to generate raw message hash:', error);
			return '0x0';
		}
	}

	// Get typed data hash | 获取类型化数据哈希
	private static async getTypedDataHash(typedData: TypedData): Promise<string> {
		try {
			const provider = get(currentProvider);
			if (!provider) {
				throw new Error('Wallet not connected');
			}

			// Use hashTypedData to generate EIP-712 hash | 使用 hashTypedData 生成 EIP-712 哈希
			const { hashTypedData } = await import('viem');
			return hashTypedData(typedData);
		} catch (error) {
			console.error('Failed to generate typed data hash:', error);
			return '0x0';
		}
	}

	// Get example typed data | 获取示例类型化数据
	static getExampleTypedData(): TypedData {
		return {
			domain: {
				name: 'Sendora',
				version: '1',
				chainId: 1,
				verifyingContract: '0x1234567890123456789012345678901234567890' as Address
			},
			types: {
				EIP712Domain: [
					{ name: 'name', type: 'string' },
					{ name: 'version', type: 'string' },
					{ name: 'chainId', type: 'uint256' },
					{ name: 'verifyingContract', type: 'address' }
				],
				Message: [
					{ name: 'content', type: 'string' },
					{ name: 'timestamp', type: 'uint256' },
					{ name: 'sender', type: 'address' }
				]
			},
			primaryType: 'Message',
			message: {
				content: 'Hello from Sendora!',
				timestamp: Math.floor(Date.now() / 1000),
				sender: '0x0000000000000000000000000000000000000000'
			}
		};
	}

	// Get example raw message data | 获取示例原始消息数据
	static getExampleRawMessageData(): string {
		// Convert "Hello World" to hex | 将 "Hello World" 转换为 hex
		return '0x48656c6c6f20576f726c64';
	}

	// Convert string to hex | 将字符串转换为 hex
	static stringToHex(str: string): string {
		// Use TextEncoder for browser compatibility | 使用 TextEncoder 以确保浏览器兼容性
		const encoder = new TextEncoder();
		const uint8Array = encoder.encode(str);
		return (
			'0x' +
			Array.from(uint8Array)
				.map((byte) => byte.toString(16).padStart(2, '0'))
				.join('')
		);
	}

	// Convert hex to string | 将 hex 转换为字符串
	static hexToString(hex: string): string {
		try {
			if (!hex.startsWith('0x')) {
				return hex;
			}
			// Remove 0x prefix and convert pairs of hex digits to bytes | 移除 0x 前缀并将十六进制对转换为字节
			const hexString = hex.slice(2);
			const uint8Array = new Uint8Array(hexString.length / 2);
			for (let i = 0; i < hexString.length; i += 2) {
				uint8Array[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
			}
			// Use TextDecoder for browser compatibility | 使用 TextDecoder 以确保浏览器兼容性
			const decoder = new TextDecoder();
			return decoder.decode(uint8Array);
		} catch {
			return hex; // Return original if conversion fails | 如果转换失败返回原始值
		}
	}
}
