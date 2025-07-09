// Subscription contract ABI and configuration | 订阅合约 ABI 和配置
import { browser } from '$app/environment';
import { networks } from '$lib/config/networks.js';

// Contract ABI | 合约 ABI
export const SUBSCRIPTION_CONTRACT_ABI = [
	{
		type: 'constructor',
		inputs: [
			{
				name: '_sendoraGenesisNFT',
				type: 'address',
				internalType: 'address'
			}
		],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'BASIC_PRICE',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'FEE_COLLECTOR',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'PRO_PRICE',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'SUBSCRIPTION_DURATION',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'approve',
		inputs: [
			{
				name: 'to',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'balanceOf',
		inputs: [
			{
				name: 'owner',
				type: 'address',
				internalType: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'getApproved',
		inputs: [
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'getSubscriptionData',
		inputs: [
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [
			{
				name: '',
				type: 'tuple',
				internalType: 'struct Subscription.SubscriptionData',
				components: [
					{
						name: 'tier',
						type: 'uint8',
						internalType: 'enum Subscription.Tier'
					},
					{
						name: 'expiry',
						type: 'uint256',
						internalType: 'uint256'
					},
					{
						name: 'createdAt',
						type: 'uint256',
						internalType: 'uint256'
					}
				]
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'getUserNFTCount',
		inputs: [
			{
				name: 'user',
				type: 'address',
				internalType: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'getUserNFTDetails',
		inputs: [
			{
				name: 'user',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'offset',
				type: 'uint256',
				internalType: 'uint256'
			},
			{
				name: 'limit',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [
			{
				name: '',
				type: 'tuple[]',
				internalType: 'struct Subscription.UserNFTDetail[]',
				components: [
					{
						name: 'tokenId',
						type: 'uint256',
						internalType: 'uint256'
					},
					{
						name: 'tier',
						type: 'uint8',
						internalType: 'enum Subscription.Tier'
					},
					{
						name: 'expiry',
						type: 'uint256',
						internalType: 'uint256'
					},
					{
						name: 'createdAt',
						type: 'uint256',
						internalType: 'uint256'
					},
					{
						name: 'isValid',
						type: 'bool',
						internalType: 'bool'
					},
					{
						name: 'tierName',
						type: 'string',
						internalType: 'string'
					},
					{
						name: 'metadata',
						type: 'string',
						internalType: 'string'
					}
				]
			},
			{
				name: 'total',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'getUserSubscription',
		inputs: [
			{
				name: 'user',
				type: 'address',
				internalType: 'address'
			}
		],
		outputs: [
			{
				name: 'tier',
				type: 'uint8',
				internalType: 'enum Subscription.Tier'
			},
			{
				name: 'isValid',
				type: 'bool',
				internalType: 'bool'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'isApprovedForAll',
		inputs: [
			{
				name: 'owner',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'operator',
				type: 'address',
				internalType: 'address'
			}
		],
		outputs: [
			{
				name: '',
				type: 'bool',
				internalType: 'bool'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'isSubscriptionValid',
		inputs: [
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [
			{
				name: '',
				type: 'bool',
				internalType: 'bool'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'name',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'string',
				internalType: 'string'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'ownerOf',
		inputs: [
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'purchaseBasic',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				internalType: 'address'
			}
		],
		outputs: [],
		stateMutability: 'payable'
	},
	{
		type: 'function',
		name: 'purchasePro',
		inputs: [
			{
				name: 'referrer',
				type: 'address',
				internalType: 'address'
			}
		],
		outputs: [],
		stateMutability: 'payable'
	},
	{
		type: 'function',
		name: 'safeTransferFrom',
		inputs: [
			{
				name: 'from',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'to',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'safeTransferFrom',
		inputs: [
			{
				name: 'from',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'to',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			},
			{
				name: 'data',
				type: 'bytes',
				internalType: 'bytes'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'sendoraGenesisNFT',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'address',
				internalType: 'address'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'setApprovalForAll',
		inputs: [
			{
				name: 'operator',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'approved',
				type: 'bool',
				internalType: 'bool'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'function',
		name: 'subscriptions',
		inputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [
			{
				name: 'tier',
				type: 'uint8',
				internalType: 'enum Subscription.Tier'
			},
			{
				name: 'expiry',
				type: 'uint256',
				internalType: 'uint256'
			},
			{
				name: 'createdAt',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'supportsInterface',
		inputs: [
			{
				name: 'interfaceId',
				type: 'bytes4',
				internalType: 'bytes4'
			}
		],
		outputs: [
			{
				name: '',
				type: 'bool',
				internalType: 'bool'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'symbol',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'string',
				internalType: 'string'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'tokenByIndex',
		inputs: [
			{
				name: 'index',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'tokenOfOwnerByIndex',
		inputs: [
			{
				name: 'owner',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'index',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'tokenURI',
		inputs: [
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [
			{
				name: '',
				type: 'string',
				internalType: 'string'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'totalSupply',
		inputs: [],
		outputs: [
			{
				name: '',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		stateMutability: 'view'
	},
	{
		type: 'function',
		name: 'transferFrom',
		inputs: [
			{
				name: 'from',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'to',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			}
		],
		outputs: [],
		stateMutability: 'nonpayable'
	},
	{
		type: 'event',
		name: 'Approval',
		inputs: [
			{
				name: 'owner',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'approved',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'tokenId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'ApprovalForAll',
		inputs: [
			{
				name: 'owner',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'operator',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'approved',
				type: 'bool',
				indexed: false,
				internalType: 'bool'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'SendoraGenesisNFTUpdated',
		inputs: [
			{
				name: 'oldAddress',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'newAddress',
				type: 'address',
				indexed: true,
				internalType: 'address'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'SubscriptionPurchased',
		inputs: [
			{
				name: 'buyer',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'referrer',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'tokenId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			},
			{
				name: 'tier',
				type: 'uint8',
				indexed: false,
				internalType: 'enum Subscription.Tier'
			},
			{
				name: 'price',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256'
			},
			{
				name: 'commission',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256'
			},
			{
				name: 'expiry',
				type: 'uint256',
				indexed: false,
				internalType: 'uint256'
			}
		],
		anonymous: false
	},
	{
		type: 'event',
		name: 'Transfer',
		inputs: [
			{
				name: 'from',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'to',
				type: 'address',
				indexed: true,
				internalType: 'address'
			},
			{
				name: 'tokenId',
				type: 'uint256',
				indexed: true,
				internalType: 'uint256'
			}
		],
		anonymous: false
	},
	{
		type: 'error',
		name: 'ERC721EnumerableForbiddenBatchMint',
		inputs: []
	},
	{
		type: 'error',
		name: 'ERC721IncorrectOwner',
		inputs: [
			{
				name: 'sender',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			},
			{
				name: 'owner',
				type: 'address',
				internalType: 'address'
			}
		]
	},
	{
		type: 'error',
		name: 'ERC721InsufficientApproval',
		inputs: [
			{
				name: 'operator',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			}
		]
	},
	{
		type: 'error',
		name: 'ERC721InvalidApprover',
		inputs: [
			{
				name: 'approver',
				type: 'address',
				internalType: 'address'
			}
		]
	},
	{
		type: 'error',
		name: 'ERC721InvalidOperator',
		inputs: [
			{
				name: 'operator',
				type: 'address',
				internalType: 'address'
			}
		]
	},
	{
		type: 'error',
		name: 'ERC721InvalidOwner',
		inputs: [
			{
				name: 'owner',
				type: 'address',
				internalType: 'address'
			}
		]
	},
	{
		type: 'error',
		name: 'ERC721InvalidReceiver',
		inputs: [
			{
				name: 'receiver',
				type: 'address',
				internalType: 'address'
			}
		]
	},
	{
		type: 'error',
		name: 'ERC721InvalidSender',
		inputs: [
			{
				name: 'sender',
				type: 'address',
				internalType: 'address'
			}
		]
	},
	{
		type: 'error',
		name: 'ERC721NonexistentToken',
		inputs: [
			{
				name: 'tokenId',
				type: 'uint256',
				internalType: 'uint256'
			}
		]
	},
	{
		type: 'error',
		name: 'ERC721OutOfBoundsIndex',
		inputs: [
			{
				name: 'owner',
				type: 'address',
				internalType: 'address'
			},
			{
				name: 'index',
				type: 'uint256',
				internalType: 'uint256'
			}
		]
	}
] as const;

// NFT Metadata interface | NFT 元数据接口
export interface SubscriptionNFTMetadata {
	tokenId: string;
	tier: PlanTier;
	tierName: string;
	isValid: boolean;
	expiryDate: Date | null;
	purchaseDate: Date;
	tokenURI?: string;
	metadata?: {
		name?: string;
		description?: string;
		image?: string;
		attributes?: Array<{
			trait_type: string;
			value: string | number;
		}>;
	};
}

// Environment-based configuration | 基于环境的配置
export function getPaymentConfig() {
	const isLocalhost =
		browser &&
		(window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1' ||
			window.location.hostname.startsWith('192.168.') ||
			window.location.hostname.endsWith('.local'));

	if (isLocalhost) {
		// Localhost/development configuration | 本地/开发环境配置
		return {
			chainId: 648,
			contractAddress: '0xb9fda8ba1bcadd206563a34d2f4bc7f9d1a12b99' as `0x${string}`,
			networkName: 'Endurance Mainnet',
			rpcUrls: ['https://rpc-endurance.fusionist.io'],
			blockExplorerUrls: ['https://explorer-endurance.fusionist.io'],
			isTestnet: true
		};
	} else {
		// Production configuration | 生产环境配置
		return {
			chainId: 8453,
			contractAddress: '0x742d35Cc6e123456789abcdef1234567890efC0' as `0x${string}`, // 生产环境合约地址 | Production contract address
			networkName: 'Base Mainnet',
			rpcUrls: ['https://mainnet.base.org'],
			blockExplorerUrls: ['https://basescan.org'],
			isTestnet: false
		};
	}
}

// Plan tier enum mapping | 计划层级枚举映射
export enum PlanTier {
	BASIC = 1,
	PRO = 2,
	ULTIMATE = 3
}

// Plan name to tier mapping | 计划名称到层级的映射
export function getPlanTier(planName: string): PlanTier {
	const lowerName = planName.toLowerCase();

	// Check for Basic plan | 检查基础版计划
	if (lowerName.includes('basic') || lowerName.includes('基础')) return PlanTier.BASIC;

	// Check for Pro plan | 检查专业版计划
	if (lowerName.includes('pro') || lowerName.includes('专业')) return PlanTier.PRO;

	// Check for Ultimate/Enterprise plan | 检查终极版/企业版计划
	if (
		lowerName.includes('ultimate') ||
		lowerName.includes('enterprise') ||
		lowerName.includes('终极') ||
		lowerName.includes('企业')
	)
		return PlanTier.ULTIMATE;

	return PlanTier.BASIC; // Default fallback | 默认回退
}

// Contract function mapping | 合约函数映射
export function getContractFunction(tier: PlanTier): string {
	switch (tier) {
		case PlanTier.BASIC:
			return 'purchaseBasic';
		case PlanTier.PRO:
			return 'purchasePro';
		case PlanTier.ULTIMATE:
			return ''; // Ultimate uses NFT purchase, not contract | Ultimate 使用 NFT 购买，不是合约
		default:
			return 'purchaseBasic';
	}
}

// Tier name mapping | 层级名称映射
export function getTierName(tier: PlanTier): string {
	switch (tier) {
		case PlanTier.BASIC:
			return 'Basic';
		case PlanTier.PRO:
			return 'Pro';
		case PlanTier.ULTIMATE:
			return 'Ultimate';
		default:
			return 'Unknown';
	}
}

// Get user's subscription status with SENDORA NFT check | 获取用户的订阅状态并检查 SENDORA NFT
export async function getUserSubscription(userAddress: string): Promise<{
	hasValidSubscription: boolean;
	hasSendoraNFT: boolean;
	subscriptionTier: PlanTier | null;
}> {
	const config = getPaymentConfig();

	try {
		const { createPublicClient, http } = await import('viem');
		const { readContract } = await import('viem/actions');

		// Create client for current network to check subscription | 为当前网络创建客户端以检查订阅
		const subscriptionClient = createPublicClient({
			chain: {
				id: config.chainId,
				name: config.networkName,
				rpcUrls: { default: { http: config.rpcUrls } },
				blockExplorers: { default: { name: 'Explorer', url: config.blockExplorerUrls[0] } },
				nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
			},
			transport: http(config.rpcUrls[0])
		});

		// Check subscription validity on current network | 在当前网络检查订阅有效性
		const subscription = (await readContract(subscriptionClient, {
			address: config.contractAddress,
			abi: SUBSCRIPTION_CONTRACT_ABI,
			functionName: 'getUserSubscription',
			args: [userAddress as `0x${string}`]
		})) as [number, boolean];

		const [tier, isValid] = subscription;

		// Convert tier number to PlanTier enum | 将层级数字转换为 PlanTier 枚举
		let subscriptionTier: PlanTier | null = null;
		if (isValid) {
			switch (tier) {
				case 0:
					subscriptionTier = PlanTier.BASIC;
					break;
				case 1:
					subscriptionTier = PlanTier.PRO;
					break;
			}
		}

		// Find Base network configuration from project settings | 从项目设置中找到 Base 网络配置
		const baseNetwork = networks.find((network) => network.chainId === '8453');
		if (!baseNetwork) {
			console.warn('Base network configuration not found');
			return { hasValidSubscription: isValid, hasSendoraNFT: false, subscriptionTier };
		}

		// Create client for Base network to check Sendora Genesis NFT | 为 Base 网络创建客户端以检查 Sendora 创世 NFT
		const baseClient = createPublicClient({
			chain: {
				id: 8453,
				name: baseNetwork.name,
				rpcUrls: { default: { http: [baseNetwork.rpcURL] } },
				blockExplorers: { default: { name: 'BaseScan', url: baseNetwork.explorerURL } },
				nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
			},
			transport: http(baseNetwork.rpcURL)
		});

		// Check if user has SENDORA Genesis NFT on Base network | 检查用户是否在 Base 网络拥有 SENDORA 创世 NFT
		let hasSendoraNFT = false;
		try {
			const SENDORA_GENESIS_NFT_ADDRESS =
				'0x442F2FF8e3a8bCb983fe47efd5AF9993A71594da' as `0x${string}`;

			const sendoraNFTBalance = (await readContract(baseClient, {
				address: SENDORA_GENESIS_NFT_ADDRESS,
				abi: [
					{
						type: 'function',
						name: 'balanceOf',
						inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
						outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
						stateMutability: 'view'
					}
				],
				functionName: 'balanceOf',
				args: [userAddress as `0x${string}`]
			})) as bigint;

			hasSendoraNFT = sendoraNFTBalance > 0n;

			console.log('🔍 [Sendora Genesis NFT Check]', {
				userAddress,
				nftAddress: SENDORA_GENESIS_NFT_ADDRESS,
				baseNetworkRPC: baseNetwork.rpcURL,
				balance: sendoraNFTBalance.toString(),
				hasSendoraNFT
			});
		} catch (error) {
			console.warn('Failed to check SENDORA Genesis NFT balance on Base:', error);
		}

		return { hasValidSubscription: isValid, hasSendoraNFT, subscriptionTier };
	} catch (error) {
		console.error('Error checking subscription status:', error);
		return { hasValidSubscription: false, hasSendoraNFT: false, subscriptionTier: null };
	}
}

// UserNFTDetail interface from contract | 来自合约的 UserNFTDetail 接口
export interface UserNFTDetail {
	tokenId: bigint;
	tier: number; // enum Subscription.Tier
	expiry: bigint;
	createdAt: bigint;
	isValid: boolean;
	tierName: string;
	metadata: string;
}

// Get total count of user's subscription NFTs | 获取用户订阅 NFT 的总数
export async function getUserNFTCount(userAddress: string): Promise<number> {
	const config = getPaymentConfig();

	try {
		// Import viem functions | 导入 viem 函数
		const { createPublicClient, http } = await import('viem');
		const { readContract } = await import('viem/actions');

		// Create public client for reading contract | 创建用于读取合约的公共客户端
		const publicClient = createPublicClient({
			chain: {
				id: config.chainId,
				name: config.networkName,
				rpcUrls: { default: { http: config.rpcUrls } },
				blockExplorers: { default: { name: 'Explorer', url: config.blockExplorerUrls[0] } },
				nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
			},
			transport: http(config.rpcUrls[0])
		});

		// Use getUserNFTDetails to get total count (more efficient than balanceOf for this contract) | 使用 getUserNFTDetails 获取总数
		const result = (await readContract(publicClient, {
			address: config.contractAddress,
			abi: SUBSCRIPTION_CONTRACT_ABI,
			functionName: 'getUserNFTDetails',
			args: [userAddress as `0x${string}`, BigInt(0), BigInt(1)] // Just get 1 item to check total
		})) as [UserNFTDetail[], bigint];

		const [, totalCount] = result;
		return Number(totalCount);
	} catch (error) {
		console.error('❌ [Subscription Debug] Error fetching NFT count:', error);
		return 0;
	}
}

// Fetch user's subscription NFTs using paginated getUserNFTDetails | 使用分页的 getUserNFTDetails 获取用户的订阅 NFT
export async function getUserSubscriptionNFTs(
	userAddress: string,
	_provider: unknown,
	onNFTLoaded?: (nft: SubscriptionNFTMetadata) => void,
	offset: number = 0,
	limit: number = 50
): Promise<SubscriptionNFTMetadata[]> {
	const config = getPaymentConfig();

	console.log('🔍 [Subscription Debug] Starting paginated NFT query with getUserNFTDetails...');
	console.log('🔍 [Subscription Debug] User address:', userAddress);
	console.log('🔍 [Subscription Debug] Pagination:', { offset, limit });
	console.log('🔍 [Subscription Debug] Config:', {
		chainId: config.chainId,
		contractAddress: config.contractAddress,
		networkName: config.networkName,
		isTestnet: config.isTestnet
	});

	try {
		// Import viem functions | 导入 viem 函数
		const { createPublicClient, http } = await import('viem');
		const { readContract } = await import('viem/actions');

		// Create public client for reading contract | 创建用于读取合约的公共客户端
		const publicClient = createPublicClient({
			chain: {
				id: config.chainId,
				name: config.networkName,
				rpcUrls: { default: { http: config.rpcUrls } },
				blockExplorers: { default: { name: 'Explorer', url: config.blockExplorerUrls[0] } },
				nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
			},
			transport: http(config.rpcUrls[0])
		});

		console.log('🔍 [Subscription Debug] Public client created, calling getUserNFTDetails...');

		// Call the new getUserNFTDetails function with pagination | 调用新的 getUserNFTDetails 函数并支持分页
		const result = (await readContract(publicClient, {
			address: config.contractAddress,
			abi: SUBSCRIPTION_CONTRACT_ABI,
			functionName: 'getUserNFTDetails',
			args: [userAddress as `0x${string}`, BigInt(offset), BigInt(limit)]
		})) as [UserNFTDetail[], bigint];

		console.log('🔍 [Subscription Debug] Raw contract result:', result);

		// Extract NFT details array and total count from the tuple result | 从元组结果中提取 NFT 详情数组和总数
		const [nftDetails, totalCount] = result;

		console.log('🔍 [Subscription Debug] NFT details fetched:', nftDetails);
		console.log('🔍 [Subscription Debug] Total count:', Number(totalCount));

		// If no NFTs, return empty array | 如果没有 NFT，返回空数组
		if (!nftDetails || nftDetails.length === 0) {
			console.log('🔍 [Subscription Debug] No NFTs found for user');
			return [];
		}

		const nftMetadataList: SubscriptionNFTMetadata[] = [];

		// Process each NFT detail from contract | 处理合约返回的每个 NFT 详情
		for (let i = 0; i < nftDetails.length; i++) {
			const detail = nftDetails[i];

			console.log(`🔍 [Subscription Debug] Processing NFT ${i + 1}/${nftDetails.length}:`, {
				tokenId: Number(detail.tokenId),
				tier: detail.tier,
				tierName: detail.tierName,
				isValid: detail.isValid,
				expiry: Number(detail.expiry),
				createdAt: Number(detail.createdAt)
			});

			// Parse metadata from the contract response | 从合约响应中解析元数据
			let metadata: Record<string, unknown> = {};
			try {
				if (detail.metadata && detail.metadata.trim()) {
					if (detail.metadata.startsWith('data:application/json')) {
						// Base64 encoded JSON | Base64编码的JSON
						const base64Data = detail.metadata.split(',')[1];
						const jsonString = atob(base64Data);
						metadata = JSON.parse(jsonString);
					} else if (detail.metadata.startsWith('http')) {
						// Fetch from HTTP | 从HTTP获取
						const response = await fetch(detail.metadata);
						metadata = await response.json();
					} else {
						// Try to parse as direct JSON | 尝试直接解析JSON
						metadata = JSON.parse(detail.metadata);
					}
				}
			} catch (metaError) {
				console.warn(
					`🔍 [Subscription Debug] Failed to parse metadata for token ${Number(detail.tokenId)}:`,
					metaError
				);
			}

			// Convert contract tier enum to PlanTier | 将合约层级枚举转换为 PlanTier
			let tier = PlanTier.BASIC;
			let tierName = detail.tierName || 'Basic';

			switch (detail.tier) {
				case 0: // BASIC
					tier = PlanTier.BASIC;
					tierName = tierName || 'Basic';
					break;
				case 1: // PRO
					tier = PlanTier.PRO;
					tierName = tierName || 'Pro';
					break;
				case 2: // ULTIMATE
					tier = PlanTier.ULTIMATE;
					tierName = tierName || 'Ultimate';
					break;
				default:
					tier = PlanTier.BASIC;
					tierName = 'Basic';
			}

			// Convert timestamps to dates | 将时间戳转换为日期
			const expiryDate = detail.expiry > 0 ? new Date(Number(detail.expiry) * 1000) : null;
			const purchaseDate =
				detail.createdAt > 0 ? new Date(Number(detail.createdAt) * 1000) : new Date();

			const nftMetadata: SubscriptionNFTMetadata = {
				tokenId: Number(detail.tokenId).toString(),
				tier,
				tierName,
				isValid: detail.isValid,
				expiryDate,
				purchaseDate,
				tokenURI: detail.metadata || '',
				metadata: {
					name: (metadata.name as string) || tierName,
					description: (metadata.description as string) || `${tierName} subscription NFT`,
					image: (metadata.image as string) || `https://sendora.org/images/nft-${tier}.png`,
					attributes: (metadata.attributes as { trait_type: string; value: string | number }[]) || [
						{ trait_type: 'Tier', value: tierName },
						{ trait_type: 'Network', value: config.networkName },
						{ trait_type: 'Valid', value: detail.isValid ? 'Active' : 'Expired' },
						{
							trait_type: 'Expiry',
							value: expiryDate ? expiryDate.toISOString().split('T')[0] : 'N/A'
						},
						{ trait_type: 'Created', value: purchaseDate.toISOString().split('T')[0] }
					]
				}
			};

			nftMetadataList.push(nftMetadata);
			console.log(`🔍 [Subscription Debug] Added NFT metadata:`, nftMetadata);

			// Call onNFTLoaded callback if provided for incremental display | 如果提供了回调函数，用于增量显示
			if (onNFTLoaded) {
				onNFTLoaded(nftMetadata);
			}
		}

		console.log('🔍 [Subscription Debug] Successfully processed all NFT details:', nftMetadataList);

		// Sort NFTs: Priority order - higher tier and valid first | 排序 NFT：优先级顺序 - 高层级且有效的优先
		const sortedNFTs = nftMetadataList.sort((a, b) => {
			// First sort by validity (valid first) | 首先按有效性排序（有效的优先）
			if (a.isValid !== b.isValid) {
				return a.isValid ? -1 : 1;
			}

			// Then sort by tier (higher tier first) | 然后按层级排序（高层级优先）
			return b.tier - a.tier;
		});

		console.log('🔍 [Subscription Debug] Sorted NFTs:', sortedNFTs);
		return sortedNFTs;
	} catch (error) {
		console.error('❌ [Subscription Debug] Error fetching subscription NFTs:', error);

		// For debugging: If there's a contract error, try to create mock data to test UI
		// 调试用：如果合约错误，尝试创建模拟数据来测试 UI
		// Comment out mock data to see real errors | 注释掉模拟数据以查看真实错误
		/* if (browser && window.location.hostname === 'localhost') {
			console.log('🔧 [Subscription Debug] Creating mock subscription data for testing...');
			
			// Create mock subscriptions for testing | 创建用于测试的模拟订阅
			const mockSubscriptions: SubscriptionNFTMetadata[] = [
				{
					tokenId: `mock-basic-${userAddress.slice(-4)}`,
					tier: PlanTier.BASIC,
					tierName: 'Basic',
					isValid: false, // Expired basic plan | 过期的基础计划
					expiryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
					purchaseDate: new Date(Date.now() - 370 * 24 * 60 * 60 * 1000), // 370 days ago
					tokenURI: `https://sendora.org/nft/mock-basic`,
					metadata: {
						name: 'Basic',
						description: '',
						image: 'https://sendora.org/images/nft-basic.png',
						attributes: [
							{ trait_type: 'Tier', value: 'Basic' },
							{ trait_type: 'Network', value: config.networkName },
							{ trait_type: 'Valid', value: 'Expired' }
						]
					}
				},
				{
					tokenId: `mock-pro-${userAddress.slice(-4)}`,
					tier: PlanTier.PRO,
					tierName: 'Pro',
					isValid: true,
					expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
					purchaseDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
					tokenURI: `https://sendora.org/nft/mock-pro`,
					metadata: {
						name: 'Pro',
						description: '',
						image: 'https://sendora.org/images/nft-pro.png',
						attributes: [
							{ trait_type: 'Tier', value: 'Pro' },
							{ trait_type: 'Network', value: config.networkName },
							{ trait_type: 'Valid', value: 'Active' }
						]
					}
				},
				{
					tokenId: `mock-ultimate-${userAddress.slice(-4)}`,
					tier: PlanTier.ULTIMATE,
					tierName: 'Ultimate',
					isValid: true,
					expiryDate: null, // Lifetime plan | 终身计划
					purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
					tokenURI: `https://sendora.org/nft/mock-ultimate`,
					metadata: {
						name: 'Ultimate',
						description: '',
						image: 'https://sendora.org/images/nft-ultimate.png',
						attributes: [
							{ trait_type: 'Tier', value: 'Ultimate' },
							{ trait_type: 'Network', value: config.networkName },
							{ trait_type: 'Valid', value: 'Active' }
						]
					}
				}
			];
			
			// Simulate incremental loading for mock data | 模拟增量加载模拟数据
			if (onNFTLoaded) {
				// Add each mock NFT with a delay to simulate real loading | 添加延迟来模拟真实加载
				for (let i = 0; i < mockSubscriptions.length; i++) {
					setTimeout(() => {
						console.log(`🔧 [Subscription Debug] Adding mock NFT ${i + 1}:`, mockSubscriptions[i]);
						onNFTLoaded(mockSubscriptions[i]);
					}, i * 500); // 500ms delay between each NFT | 每个 NFT 间隔 500ms
				}
			}
			
			// Sort mock data same as real data | 对模拟数据进行相同的排序
			const sortedMockData = mockSubscriptions.sort((a, b) => {
				// First sort by validity (valid first) | 首先按有效性排序（有效的优先）
				if (a.isValid !== b.isValid) {
					return a.isValid ? -1 : 1;
				}
				
				// Then sort by tier (higher tier first) | 然后按层级排序（高层级优先）
				return b.tier - a.tier;
			});
			
			console.log('🔧 [Subscription Debug] Returning sorted mock subscriptions:', sortedMockData);
			return sortedMockData;
		} */

		// Return empty array on error instead of mock data | 出错时返回空数组而不是模拟数据
		return [];
	}
}
