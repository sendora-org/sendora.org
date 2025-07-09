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
