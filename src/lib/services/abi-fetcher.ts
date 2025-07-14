// ABI fetching service using whatsabi | 使用 whatsabi 的 ABI 获取服务
import { autoload, abiFromBytecode, selectorsFromBytecode, loaders } from '@shazow/whatsabi';
import type { PublicClient } from 'viem';

// ABI 获取结果接口 | ABI fetch result interface
export interface AbiFetchResult {
	abi: unknown[] | null;
	source: string;
	error?: string;
}

// ABI 获取选项 | ABI fetch options
export interface AbiFetchOptions {
	// 是否启用 Sourcify | Whether to enable Sourcify
	enableSourcify?: boolean;
	// 是否启用 4byte 签名查找 | Whether to enable 4byte signature lookup
	enableSignatureLookup?: boolean;
	// 是否启用字节码分析 | Whether to enable bytecode analysis
	enableBytecodeAnalysis?: boolean;
	// 是否跟随代理合约 | Whether to follow proxy contracts
	followProxies?: boolean;
	// 超时时间（毫秒）| Timeout in milliseconds
	timeout?: number;
}

// 默认选项 | Default options
const DEFAULT_OPTIONS: Required<AbiFetchOptions> = {
	enableSourcify: true,
	enableSignatureLookup: true,
	enableBytecodeAnalysis: true,
	followProxies: true,
	timeout: 30000
};

/**
 * 使用 whatsabi 从多个来源获取合约 ABI | Fetch contract ABI from multiple sources using whatsabi
 *
 * whatsabi 支持以下来源：| whatsabi supports the following sources:
 * 1. Sourcify - 开源合约验证平台 | Open source contract verification platform
 * 2. 4byte.directory - 函数签名数据库 | Function signature database
 * 3. 字节码分析 - 从字节码推断 ABI | Bytecode analysis - infer ABI from bytecode
 *
 * @param contractAddress - 合约地址 | Contract address
 * @param provider - viem PublicClient 实例 | viem PublicClient instance
 * @param options - 获取选项 | Fetch options
 * @returns Promise<AbiFetchResult>
 */
export async function fetchContractAbi(
	contractAddress: string,
	provider: PublicClient,
	options: AbiFetchOptions = {}
): Promise<AbiFetchResult> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	console.log('🔍 [ABI Fetcher] Starting ABI fetch for:', {
		address: contractAddress,
		chainId: await provider.getChainId(),
		options: opts
	});

	try {
		// 获取链 ID | Get chain ID
		const chainId = await provider.getChainId();

		console.log({ chainId });

		// 创建多个加载器 | Create multiple loaders
		const loaderList = [];

		// 添加 Sourcify 加载器 | Add Sourcify loader
		if (opts.enableSourcify) {
			loaderList.push(new loaders.SourcifyABILoader({ chainId }));
		}

		// 添加 Etherscan 加载器（如果配置了 API key）| Add Etherscan loader if API key is configured
		if (opts.enableSignatureLookup && import.meta.env.VITE_ETHERSCAN_API_KEY) {
			// 根据链 ID 选择正确的 Etherscan 端点 | Choose correct Etherscan endpoint based on chain ID
			const etherscanConfig = getEtherscanConfig(chainId);
			if (etherscanConfig) {
				loaderList.push(
					new loaders.EtherscanABILoader({
						apiKey: import.meta.env.VITE_ETHERSCAN_API_KEY,
						baseURL: etherscanConfig.baseURL
					})
				);
			}
		}

		// 如果有可用的加载器，使用 MultiABILoader | If loaders are available, use MultiABILoader
		if (loaderList.length > 0) {
			console.log('🔍 [ABI Fetcher] Using MultiABILoader with', loaderList.length, 'loaders');
			const multiLoader = new loaders.MultiABILoader(loaderList);

			try {
				const abi = await multiLoader.loadABI(contractAddress);
				if (abi && abi.length > 0) {
					console.log('✅ [ABI Fetcher] Successfully fetched ABI from MultiABILoader');
					return {
						abi: abi,
						source: 'Sourcify/Etherscan'
					};
				}
			} catch (error) {
				console.warn('⚠️ [ABI Fetcher] MultiABILoader failed:', error);
			}
		}

		// 使用 whatsabi.autoload 作为备用 | Use whatsabi.autoload as fallback
		console.log('🔍 [ABI Fetcher] Using whatsabi autoload as fallback...');
		const autoloadOptions = {
			provider: provider,
			followProxies: opts.followProxies,
			onProgress: (phase: string) => {
				console.log('🔄 [ABI Fetcher] Progress:', phase);
			},
			onError: (phase: string, context: unknown) => {
				console.warn('⚠️ [ABI Fetcher] Error in phase:', phase, context);
			}
		};

		const result = await autoload(contractAddress, autoloadOptions);

		if (result && result.abi && result.abi.length > 0) {
			console.log('✅ [ABI Fetcher] Successfully fetched ABI:', {
				address: contractAddress,
				abiLength: result.abi.length,
				hasProxies: result.proxies.length > 0,
				proxies: result.proxies.map((p) => p.toString()),
				abiLoadedFrom: result.abiLoadedFrom?.constructor.name || 'Unknown'
			});

			// 确定来源信息 | Determine source information
			let source = 'whatsabi';
			if (result.proxies.length > 0) {
				source += ` (${result.proxies.length} Proxy${result.proxies.length > 1 ? 'ies' : ''} Detected)`;
			}
			if (result.abiLoadedFrom) {
				source += ` via ${result.abiLoadedFrom.constructor.name}`;
			}

			return {
				abi: result.abi,
				source: source
			};
		}

		// 如果 autoload 没有返回 ABI，尝试基本的字节码分析 | If autoload didn't return ABI, try basic bytecode analysis
		if (opts.enableBytecodeAnalysis) {
			console.log('🔍 [ABI Fetcher] Trying bytecode analysis fallback...');

			const code = await provider.getCode({ address: contractAddress as `0x${string}` });
			if (code && code !== '0x') {
				// 尝试从字节码获取 ABI | Try to get ABI from bytecode
				const abi = abiFromBytecode(code);

				if (abi && abi.length > 0) {
					console.log('✅ [ABI Fetcher] Generated ABI from bytecode analysis');

					// 如果启用了签名查找，尝试解析函数名称 | If signature lookup is enabled, try to resolve function names
					if (opts.enableSignatureLookup) {
						const selectors = selectorsFromBytecode(code);
						if (selectors.length > 0) {
							console.log('🔍 [ABI Fetcher] Looking up function signatures...');

							try {
								const signatureLookup = new loaders.OpenChainSignatureLookup();

								// 为每个选择器查找签名 | Look up signatures for each selector
								for (let i = 0; i < abi.length; i++) {
									const item = abi[i];
									if (item.type === 'function' && item.selector) {
										const signatures = await signatureLookup.loadFunctions(item.selector);
										if (signatures && signatures.length > 0) {
											// 解析第一个签名来获取函数名 | Parse first signature to get function name
											const match = signatures[0].match(/^([^(]+)/);
											if (match) {
												item.name = match[1];
											}
										}
									}
								}

								console.log('✅ [ABI Fetcher] Enhanced ABI with function signatures');
							} catch (sigError) {
								console.warn('⚠️ [ABI Fetcher] Signature lookup failed:', sigError);
							}
						}
					}

					return {
						abi: abi,
						source: 'Bytecode Analysis'
					};
				}
			}
		}

		// 所有方法都失败 | All methods failed
		return {
			abi: null,
			source: '',
			error: 'No ABI found from any source'
		};
	} catch (error) {
		console.error('❌ [ABI Fetcher] Failed to fetch ABI:', error);

		return {
			abi: null,
			source: '',
			error: error instanceof Error ? error.message : 'Unknown error during ABI fetch'
		};
	}
}

/**
 * 检查 whatsabi 支持的网络 | Check networks supported by whatsabi
 */
export function isNetworkSupported(_chainId: number): boolean {
	// whatsabi 支持所有 EVM 网络 | whatsabi supports all EVM networks
	console.log({ _chainId });
	return true;
}

/**
 * 获取 Etherscan 配置 | Get Etherscan configuration
 */
function getEtherscanConfig(chainId: number): { baseURL: string } | null {
	const configs: Record<number, { baseURL: string }> = {
		1: { baseURL: 'https://api.etherscan.io/api' },
		5: { baseURL: 'https://api-goerli.etherscan.io/api' },
		11155111: { baseURL: 'https://api-sepolia.etherscan.io/api' },
		137: { baseURL: 'https://api.polygonscan.com/api' },
		80001: { baseURL: 'https://api-testnet.polygonscan.com/api' },
		56: { baseURL: 'https://api.bscscan.com/api' },
		97: { baseURL: 'https://api-testnet.bscscan.com/api' }
	};

	return configs[chainId] || null;
}

/**
 * 获取推荐的获取选项 | Get recommended fetch options
 */
export function getRecommendedOptions(_chainId: number): AbiFetchOptions {
	// 对于所有网络使用相同配置 | Use same configuration for all networks
	console.log({ _chainId });
	return {
		enableSourcify: true,
		enableSignatureLookup: true,
		enableBytecodeAnalysis: true,
		followProxies: true,
		timeout: 30000
	};
}
