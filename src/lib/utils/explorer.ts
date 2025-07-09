// Explorer utility functions | 区块链浏览器工具函数

import type { NetworkInfo } from '$lib/stores/networks';

/**
 * Generate explorer URL for a transaction | 为交易生成浏览器URL
 * @param network - Network information | 网络信息
 * @param hash - Transaction hash | 交易哈希
 * @returns Explorer URL or fallback | 浏览器URL或回退链接
 */
export function getExplorerUrl(network: NetworkInfo | null, hash: string): string {
	if (!network || !network.explorerURL || !hash) {
		return '#';
	}
	return `${network.explorerURL}/tx/${hash}`;
}

/**
 * Generate explorer URL for an address | 为地址生成浏览器URL
 * @param network - Network information | 网络信息
 * @param address - Wallet address | 钱包地址
 * @returns Explorer URL or fallback | 浏览器URL或回退链接
 */
export function getAddressExplorerUrl(network: NetworkInfo | null, address: string): string {
	if (!network || !network.explorerURL || !address) {
		return '#';
	}
	return `${network.explorerURL}/address/${address}`;
}

/**
 * Generate explorer URL for a block | 为区块生成浏览器URL
 * @param network - Network information | 网络信息
 * @param blockNumber - Block number | 区块号
 * @returns Explorer URL or fallback | 浏览器URL或回退链接
 */
export function getBlockExplorerUrl(
	network: NetworkInfo | null,
	blockNumber: string | number
): string {
	if (!network || !network.explorerURL || !blockNumber) {
		return '#';
	}
	return `${network.explorerURL}/block/${blockNumber}`;
}

/**
 * Check if network has explorer support | 检查网络是否支持浏览器
 * @param network - Network information | 网络信息
 * @returns Whether explorer is available | 是否可用浏览器
 */
export function hasExplorerSupport(network: NetworkInfo | null): boolean {
	return Boolean(network?.explorerURL);
}
