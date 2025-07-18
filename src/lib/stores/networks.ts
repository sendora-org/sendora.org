// Network management store | 网络管理状态存储
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { Json } from 'ox';
import { networks as defaultNetworks, type NetworkInfo } from '$lib/config/networks';

// Re-export NetworkInfo type for other components | 重新导出 NetworkInfo 类型供其他组件使用
export type { NetworkInfo };

// Type for serialized network info where bigints are converted to strings | 序列化网络信息的类型，其中 bigint 转换为字符串
type SerializedNetworkInfo = Omit<NetworkInfo, 'blockTime' | 'blockGasLimit'> & {
	blockTime: string;
	blockGasLimit: string;
};

// Type for partially serialized network info | 部分序列化网络信息的类型
type PartialSerializedNetworkInfo = Omit<Partial<NetworkInfo>, 'blockTime' | 'blockGasLimit'> & {
	blockTime?: string;
	blockGasLimit?: string;
};

// Custom networks storage key | 自定义网络存储键
const CUSTOM_NETWORKS_KEY = 'sendora_custom_networks';
// Built-in network overrides storage key | 内置网络覆盖存储键
const NETWORK_OVERRIDES_KEY = 'sendora_network_overrides';

// Serialize network info to handle bigint | 序列化网络信息以处理 bigint
function serializeNetworkInfo(network: NetworkInfo): SerializedNetworkInfo {
	return {
		...network,
		blockTime: network.blockTime.toString(),
		blockGasLimit: network.blockGasLimit.toString()
	};
}

// Deserialize network info to restore bigint | 反序列化网络信息以恢复 bigint
function deserializeNetworkInfo(data: SerializedNetworkInfo): NetworkInfo {
	return {
		...data,
		blockTime: BigInt(data.blockTime || '12000'),
		blockGasLimit: BigInt(data.blockGasLimit || '30000000')
	};
}

// Serialize partial network info for overrides | 序列化部分网络信息用于覆盖
function serializePartialNetworkInfo(override: Partial<NetworkInfo>): PartialSerializedNetworkInfo {
	// Extract blockTime and blockGasLimit separately | 分别提取 blockTime 和 blockGasLimit
	const { blockTime, blockGasLimit, ...rest } = override;
	const result: PartialSerializedNetworkInfo = { ...rest };

	if (blockTime !== undefined) {
		result.blockTime = blockTime.toString();
	}
	if (blockGasLimit !== undefined) {
		result.blockGasLimit = blockGasLimit.toString();
	}
	return result;
}

// Deserialize partial network info | 反序列化部分网络信息
function deserializePartialNetworkInfo(data: PartialSerializedNetworkInfo): Partial<NetworkInfo> {
	// Extract blockTime and blockGasLimit separately | 分别提取 blockTime 和 blockGasLimit
	const { blockTime, blockGasLimit, ...rest } = data;
	const result: Partial<NetworkInfo> = { ...rest };

	if (blockTime !== undefined) {
		result.blockTime = BigInt(blockTime);
	}
	if (blockGasLimit !== undefined) {
		result.blockGasLimit = BigInt(blockGasLimit);
	}
	return result;
}

// Load custom networks from localStorage | 从本地存储加载自定义网络
function loadCustomNetworks(): NetworkInfo[] {
	if (!browser) return [];

	try {
		const stored = localStorage.getItem(CUSTOM_NETWORKS_KEY);
		const data = stored ? Json.parse(stored) : [];
		return data.map(deserializeNetworkInfo);
	} catch (error) {
		console.error('Failed to load custom networks:', error);
		return [];
	}
}

// Save custom networks to localStorage | 保存自定义网络到本地存储
function saveCustomNetworks(networks: NetworkInfo[]): void {
	if (!browser) return;

	try {
		const serialized = networks.map(serializeNetworkInfo);
		localStorage.setItem(CUSTOM_NETWORKS_KEY, Json.stringify(serialized));
	} catch (error) {
		console.error('Failed to save custom networks:', error);
	}
}

// Load network overrides from localStorage | 从本地存储加载网络覆盖
function loadNetworkOverrides(): Record<string, Partial<NetworkInfo>> {
	if (!browser) return {};

	try {
		const stored = localStorage.getItem(NETWORK_OVERRIDES_KEY);
		const data = stored ? Json.parse(stored) : {};
		const overrides: Record<string, Partial<NetworkInfo>> = {};

		for (const [chainId, override] of Object.entries(data)) {
			overrides[chainId] = deserializePartialNetworkInfo(override as PartialSerializedNetworkInfo);
		}

		return overrides;
	} catch (error) {
		console.error('Failed to load network overrides:', error);
		return {};
	}
}

// Save network overrides to localStorage | 保存网络覆盖到本地存储
function saveNetworkOverrides(overrides: Record<string, Partial<NetworkInfo>>): void {
	if (!browser) return;

	try {
		const serialized: Record<string, PartialSerializedNetworkInfo> = {};

		for (const [chainId, override] of Object.entries(overrides)) {
			serialized[chainId] = serializePartialNetworkInfo(override);
		}

		localStorage.setItem(NETWORK_OVERRIDES_KEY, Json.stringify(serialized));
	} catch (error) {
		console.error('Failed to save network overrides:', error);
	}
}

// Apply overrides to built-in networks | 应用覆盖到内置网络
function applyOverrides(networks: NetworkInfo[]): NetworkInfo[] {
	const overrides = loadNetworkOverrides();

	return networks.map((network) => {
		const override = overrides[network.chainId];
		if (override) {
			return { ...network, ...override };
		}
		return network;
	});
}

// Get network from current URL | 从当前 URL 获取网络
function getNetworkFromCurrentUrl(): NetworkInfo | null {
	if (!browser) return null;

	try {
		const chainId = new URLSearchParams(window.location.search).get('network');
		if (chainId) {
			// Load both built-in and custom networks | 加载内置和自定义网络
			const customNetworksList = loadCustomNetworks();
			const networksList = [...applyOverrides(defaultNetworks), ...customNetworksList];

			return networksList.find((n) => n.chainId === chainId) || null;
		}
		return null;
	} catch (error) {
		console.error('Failed to parse network from URL:', error);
		return null;
	}
}

// Initialize stores with proper client-side handling | 使用适当的客户端处理初始化存储
function initializeStores() {
	if (!browser) {
		// Server-side: return default values | 服务器端：返回默认值
		return {
			overrides: {},
			customNetworks: [],
			availableNetworks: defaultNetworks,
			selectedNetwork: defaultNetworks[0] || null
		};
	}

	// Client-side: load from localStorage | 客户端：从本地存储加载
	const overrides = loadNetworkOverrides();
	const customNetworksList = loadCustomNetworks();
	const networksList = [...applyOverrides(defaultNetworks), ...customNetworksList];

	// Get initial network from URL or default to Ethereum (chainId=1) | 从 URL 获取初始网络或默认为以太坊 (chainId=1)
	let initialNetwork = getNetworkFromCurrentUrl();
	if (!initialNetwork) {
		// Default to Ethereum (chainId=1) | 默认为以太坊 (chainId=1)
		initialNetwork = networksList.find((n) => n.chainId === '1') || networksList[0] || null;
	}

	return {
		overrides,
		customNetworks: customNetworksList,
		availableNetworks: networksList,
		selectedNetwork: initialNetwork
	};
}

const {
	overrides,
	customNetworks: customNetworksList,
	availableNetworks: networksList,
	selectedNetwork: initialSelected
} = initializeStores();

// Network overrides store | 网络覆盖存储
export const networkOverrides = writable<Record<string, Partial<NetworkInfo>>>(overrides);

// All available networks (built-in + custom) | 所有可用网络（内置 + 自定义）
export const availableNetworks = writable<NetworkInfo[]>(networksList);

// Currently selected network | 当前选中的网络
export const selectedNetwork = writable<NetworkInfo | null>(initialSelected);

// Custom networks only | 仅自定义网络
export const customNetworks = writable<NetworkInfo[]>(customNetworksList);

// Add a custom network | 添加自定义网络
export function addCustomNetwork(network: NetworkInfo): void {
	customNetworks.update((networks) => {
		// Check if network already exists by chainId in custom networks | 通过链 ID 检查自定义网络中是否已存在
		const existsInCustom = networks.some((n) => n.chainId === network.chainId);
		if (existsInCustom) {
			throw new Error('Network with this Chain ID already exists in custom networks');
		}

		// Check if network already exists by chainId in built-in networks | 通过链 ID 检查内置网络中是否已存在
		const existsInBuiltIn = defaultNetworks.some((n) => n.chainId === network.chainId);
		if (existsInBuiltIn) {
			throw new Error('Network with this Chain ID already exists in built-in networks');
		}

		const updated = [...networks, network];
		saveCustomNetworks(updated);

		// Update available networks | 更新可用网络
		availableNetworks.update(() => [...applyOverrides(defaultNetworks), ...updated]);

		return updated;
	});
}

// Update a network (custom or built-in) | 更新网络（自定义或内置）
export function updateCustomNetwork(chainId: string, updatedNetwork: NetworkInfo): void {
	// Check if it's a built-in network | 检查是否为内置网络
	const isBuiltIn = isBuiltInNetwork(chainId);

	if (isBuiltIn) {
		// Update overrides for built-in network | 更新内置网络的覆盖
		networkOverrides.update((overrides) => {
			// Find the original built-in network | 查找原始内置网络
			const originalNetwork = defaultNetworks.find((n: NetworkInfo) => n.chainId === chainId);
			if (!originalNetwork) {
				throw new Error('Built-in network not found');
			}

			// Calculate what fields have changed | 计算哪些字段已更改
			const changes: Partial<NetworkInfo> = {};
			for (const key in updatedNetwork) {
				if (key === 'chainId') continue; // Cannot change chain ID | 不能更改链 ID

				const k = key as keyof NetworkInfo;
				// Special handling for bigint comparison | 特殊处理 bigint 比较
				const updatedValue = updatedNetwork[k];
				const originalValue = originalNetwork[k];

				let hasChanged = false;
				if (typeof updatedValue === 'bigint' && typeof originalValue === 'bigint') {
					hasChanged = updatedValue !== originalValue;
				} else if (updatedValue !== originalValue) {
					// For arrays and objects, do deep comparison | 对于数组和对象，进行深度比较
					hasChanged = Json.stringify(updatedValue) !== Json.stringify(originalValue);
				}

				if (hasChanged) {
					(changes as Record<string, unknown>)[k] = updatedNetwork[k];
				}
			}

			const updated = { ...overrides, [chainId]: changes };
			saveNetworkOverrides(updated);

			// Update available networks | 更新可用网络
			availableNetworks.update(() => [...applyOverrides(defaultNetworks), ...loadCustomNetworks()]);

			// Update selected network if it was the one being edited | 如果编辑的是当前选中网络，更新选中状态
			selectedNetwork.update((selected) => {
				if (selected?.chainId === chainId) {
					return updatedNetwork;
				}
				return selected;
			});

			return updated;
		});
	} else {
		// Update custom network | 更新自定义网络
		customNetworks.update((networks) => {
			const index = networks.findIndex((n) => n.chainId === chainId);
			if (index === -1) {
				throw new Error('Network not found');
			}

			const updated = [...networks];
			updated[index] = updatedNetwork;
			saveCustomNetworks(updated);

			// Update available networks | 更新可用网络
			availableNetworks.update(() => [...applyOverrides(defaultNetworks), ...updated]);

			// Update selected network if it was the one being edited | 如果编辑的是当前选中网络，更新选中状态
			selectedNetwork.update((selected) => {
				if (selected?.chainId === chainId) {
					return updatedNetwork;
				}
				return selected;
			});

			return updated;
		});
	}
}

// Remove a custom network | 删除自定义网络
export function removeCustomNetwork(chainId: string): void {
	customNetworks.update((networks) => {
		const filtered = networks.filter((n) => n.chainId !== chainId);
		saveCustomNetworks(filtered);

		// Update available networks | 更新可用网络
		availableNetworks.update(() => [...applyOverrides(defaultNetworks), ...filtered]);

		// Update selected network if it was the one being removed | 如果删除的是当前选中网络，重置为默认
		selectedNetwork.update((selected) => {
			if (selected?.chainId === chainId) {
				return defaultNetworks[0] || null;
			}
			return selected;
		});

		return filtered;
	});
}

// Update URL with network parameter | 更新 URL 中的网络参数
function updateUrlWithNetwork(chainId: string): void {
	if (!browser) return;

	try {
		const url = new URL(window.location.href);
		url.searchParams.set('network', chainId);
		window.history.replaceState({}, '', url.toString());
	} catch (error) {
		console.error('Failed to update URL with network:', error);
	}
}

// Select a network | 选择网络
export function selectNetwork(network: NetworkInfo): void {
	selectedNetwork.set(network);
	// Update URL with the selected network | 更新 URL 中的选中网络
	updateUrlWithNetwork(network.chainId);
}

// Select a network without updating URL | 选择网络但不更新 URL
export function selectNetworkSilently(network: NetworkInfo): void {
	selectedNetwork.set(network);
}

// Initialize URL synchronization with network selection | 初始化 URL 与网络选择的同步
export function initializeNetworkUrlSync(): (() => void) | void {
	if (!browser) return;

	// Handle browser navigation events (back/forward) | 处理浏览器导航事件（前进/后退）
	const handlePopState = () => {
		const networkFromUrl = getNetworkFromCurrentUrl();
		if (networkFromUrl) {
			// Update selected network without updating URL to avoid infinite loop | 更新选中网络但不更新 URL 以避免无限循环
			selectNetworkSilently(networkFromUrl);
		} else {
			// If no network in URL, default to Ethereum (chainId=1) | 如果 URL 中没有网络，默认为以太坊 (chainId=1)
			const availableNetworksList = [...applyOverrides(defaultNetworks), ...loadCustomNetworks()];
			const ethereumNetwork =
				availableNetworksList.find((n) => n.chainId === '1') || availableNetworksList[0];
			if (ethereumNetwork) {
				selectNetworkSilently(ethereumNetwork);
			}
		}
	};

	// Listen for browser navigation events | 监听浏览器导航事件
	window.addEventListener('popstate', handlePopState);

	// Perform initial sync when function is called | 调用函数时执行初始同步
	handlePopState();

	// Return cleanup function | 返回清理函数
	return () => {
		window.removeEventListener('popstate', handlePopState);
	};
}

// Check if a network is built-in | 检查网络是否为内置网络
export function isBuiltInNetwork(chainId: string): boolean {
	return defaultNetworks.some((n: NetworkInfo) => n.chainId === chainId);
}

// Get network by chain ID | 通过链 ID 获取网络
export function getNetworkByChainId(chainId: string): NetworkInfo | undefined {
	const networks = [...applyOverrides(defaultNetworks), ...loadCustomNetworks()];
	return networks.find((n) => n.chainId === chainId);
}

// Refresh networks from localStorage | 从本地存储刷新网络
export function refreshNetworks(): void {
	if (!browser) return;

	const overrides = loadNetworkOverrides();
	const customNetworksList = loadCustomNetworks();
	const networksList = [...applyOverrides(defaultNetworks), ...customNetworksList];

	networkOverrides.set(overrides);
	customNetworks.set(customNetworksList);
	availableNetworks.set(networksList);
}

// Update RPC URL for a network | 更新网络的 RPC URL
export function updateNetworkRPC(chainId: string, rpcURL: string): void {
	// For built-in networks, this would only update the selected RPC | 对于内置网络，只更新选中的 RPC
	// For custom networks, this updates the network definition | 对于自定义网络，更新网络定义
	const isBuiltIn = isBuiltInNetwork(chainId);

	if (isBuiltIn) {
		// Update network overrides to persist RPC selection | 更新网络覆盖以持久化 RPC 选择
		networkOverrides.update((overrides) => {
			const updated = {
				...overrides,
				[chainId]: {
					...overrides[chainId],
					rpcURL
				}
			};
			saveNetworkOverrides(updated);

			// Update available networks | 更新可用网络
			availableNetworks.update(() => [...applyOverrides(defaultNetworks), ...loadCustomNetworks()]);

			// Update selected network if it's currently selected | 如果是当前选中的内置网络，更新其 RPC
			selectedNetwork.update((selected) => {
				if (selected?.chainId === chainId) {
					return { ...selected, rpcURL };
				}
				return selected;
			});

			return updated;
		});
	} else {
		// Update custom network | 更新自定义网络
		customNetworks.update((networks) => {
			const updated = networks.map((n) => (n.chainId === chainId ? { ...n, rpcURL } : n));
			saveCustomNetworks(updated);

			// Update available networks | 更新可用网络
			availableNetworks.update(() => [...defaultNetworks, ...updated]);

			// Update selected network if needed | 如需要，更新选中网络
			selectedNetwork.update((selected) => {
				if (selected?.chainId === chainId) {
					return updated.find((n) => n.chainId === chainId) || selected;
				}
				return selected;
			});

			return updated;
		});
	}
}

// Add RPC URL to a network | 为网络添加 RPC URL
export function addNetworkRPC(chainId: string, rpcURL: string): void {
	const network = getNetworkByChainId(chainId);
	if (!network) return;

	const isBuiltIn = isBuiltInNetwork(chainId);

	if (isBuiltIn) {
		// For built-in networks, we can't modify the original | 内置网络无法修改原始定义
		// User would need to create a custom network | 用户需要创建自定义网络
		throw new Error('Cannot modify built-in network. Create a custom network instead.');
	} else {
		// Update custom network | 更新自定义网络
		updateCustomNetwork(chainId, {
			...network,
			rpcURLs: [...network.rpcURLs, rpcURL]
		});
	}
}

// Remove RPC URL from a network | 从网络中删除 RPC URL
export function removeNetworkRPC(chainId: string, rpcURL: string): void {
	const network = getNetworkByChainId(chainId);
	if (!network) return;

	const isBuiltIn = isBuiltInNetwork(chainId);

	if (isBuiltIn) {
		throw new Error('Cannot modify built-in network. Create a custom network instead.');
	} else {
		// Update custom network | 更新自定义网络
		const updatedRPCs = network.rpcURLs.filter((url: string) => url !== rpcURL);
		if (updatedRPCs.length === 0) {
			throw new Error('Cannot remove all RPC URLs from a network');
		}

		updateCustomNetwork(chainId, {
			...network,
			rpcURLs: updatedRPCs,
			rpcURL: network.rpcURL === rpcURL ? updatedRPCs[0] : network.rpcURL
		});
	}
}

// Generate shareable URL with network parameter | 生成带有网络参数的可分享 URL
export function generateShareableUrl(baseUrl: string, chainId?: string): string {
	try {
		const url = new URL(baseUrl);

		if (chainId) {
			// Add network parameter | 添加网络参数
			url.searchParams.set('network', chainId);
		} else {
			// Remove network parameter | 删除网络参数
			url.searchParams.delete('network');
		}

		return url.href;
	} catch (error) {
		// Fallback to original URL if parsing fails | 解析失败时回退到原始 URL
		console.error('Failed to generate shareable URL:', error);
		return baseUrl;
	}
}

// Get network from URL parameter | 从 URL 参数获取网络
export function getNetworkFromUrl(url: string): NetworkInfo | null {
	try {
		const urlObj = new URL(url);
		const chainId = urlObj.searchParams.get('network');

		if (chainId) {
			return getNetworkByChainId(chainId) || null;
		}

		return null;
	} catch (error) {
		console.error('Failed to parse network from URL:', error);
		return null;
	}
}
