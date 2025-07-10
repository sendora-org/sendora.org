// Ethereum Base Arbitrum BNBChain Polygon Avax
import { type Static, Type } from '@sinclair/typebox';

export const NetworkInfoType = Type.Object({
	name: Type.String(),
	rpcURL: Type.String(),
	rpcURLs: Type.Array(Type.String()),
	chainId: Type.String(),
	symbol: Type.String(),
	explorerURL: Type.String(),
	isPopular: Type.Boolean(),
	isTestnet: Type.Boolean(),
	blockTime: Type.BigInt(),
	blockGasLimit: Type.BigInt(),
	features: Type.Array(Type.String())
});

export type NetworkInfo = Static<typeof NetworkInfoType>;

// https://chainid.network/
export const networks: NetworkInfo[] = [
	{
		name: 'Ethereum',
		rpcURL: 'https://1rpc.io/eth',
		rpcURLs: ['https://1rpc.io/eth'],
		chainId: '1',
		symbol: 'ETH',
		explorerURL: 'https://etherscan.io',
		isPopular: true,
		isTestnet: false,
		blockTime: 12_000n,
		blockGasLimit: 30_000_000n,
		features: ['EIP1559', 'EIP7702']
	},
	{
		name: 'Base Mainnet',
		rpcURL: 'https://mainnet.base.org',
		rpcURLs: ['https://mainnet.base.org'],
		chainId: '8453',
		symbol: 'ETH',
		explorerURL: 'https://basescan.org',
		isPopular: true,
		isTestnet: false,
		blockTime: 2_000n,
		blockGasLimit: 120_000_000n,
		features: ['EIP1559', 'EIP7702']
	},
	{
		name: 'BNB Chain',
		rpcURL: 'https://bsc-dataseed4.bnbchain.org',
		rpcURLs: ['https://bsc-dataseed4.bnbchain.org'],
		chainId: '56',
		symbol: 'BNB',
		explorerURL: 'https://bscscan.com',
		isPopular: true,
		isTestnet: false,
		blockTime: 3_000n,
		blockGasLimit: 140_000_000n,
		features: ['EIP1559', 'EIP7702']
	},
	{
		name: 'OP Mainnet',
		rpcURL: 'https://optimism.llamarpc.com',
		rpcURLs: ['https://optimism.llamarpc.com'],
		chainId: '10',
		symbol: 'ETH',
		explorerURL: 'https://optimistic.etherscan.io',
		isPopular: true,
		isTestnet: false,
		blockTime: 2_000n,
		blockGasLimit: 60_000_000n,
		features: ['EIP1559', 'EIP7702']
	},
	{
		name: 'Polygon',
		rpcURL: 'https://polygon-rpc.com',
		rpcURLs: ['https://polygon-rpc.com'],
		chainId: '137',
		symbol: 'POL',
		explorerURL: 'https://polygonscan.com',
		isPopular: true,
		isTestnet: false,
		blockTime: 2_200n,
		blockGasLimit: 30_000_000n,
		features: ['EIP1559', 'EIP7702']
	}
];

/**
 * Get chain name by chain ID | 根据链 ID 获取链名称
 * @param chainId - Chain ID | 链 ID
 * @returns Chain name or chain ID as string if not found | 链名称或链 ID 字符串（如果未找到）
 */
export function getChainName(chainId: number): string {
	const network = networks.find((n) => n.chainId === chainId.toString());
	if (network) {
		return network.name;
	}

	// Fallback chain names for common chains not in the list | 不在列表中的常见链的后备名称
	const chainNames: Record<number, string> = {
		1: 'Ethereum',
		3: 'Ropsten',
		4: 'Rinkeby',
		5: 'Goerli',
		42: 'Kovan',
		97: 'BSC Testnet',
		250: 'Fantom',
		420: 'Optimism Goerli',
		1284: 'Moonbeam',
		1285: 'Moonriver',
		4002: 'Fantom Testnet',
		42161: 'Arbitrum',
		42220: 'Celo',
		43114: 'Avalanche',
		80001: 'Polygon Mumbai',
		84531: 'Base Goerli',
		421613: 'Arbitrum Goerli',
		11155111: 'Sepolia',
		11155420: 'Optimism Sepolia'
	};

	return chainNames[chainId] || `Chain ${chainId}`;
}
