import type { Address, Abi } from 'viem';

// Call history item type | 调用历史项类型
export interface CallHistoryItem {
	id: string;
	timestamp: number;
	chainId: number;
	contractAddress: Address;
	contractName?: string;
	functionName: string;
	functionSignature: string;
	args: unknown[];
	result?: unknown;
	transactionHash?: string;
	gasUsed?: string;
	error?: string;
	type: 'read' | 'write';
}

// Contract info for quick access | 合约信息快速访问
export interface ContractInfo {
	address: Address;
	chainId: number;
	name?: string;
	abi: Abi;
	lastUsed: number;
}

// Parameter history | 参数历史
export interface ParameterHistory {
	functionSignature: string;
	parameterName: string;
	values: string[];
	lastUsed: number;
}

// Storage keys | 存储键
const STORAGE_KEYS = {
	CALL_HISTORY: 'sendora_call_history',
	CONTRACT_INFO: 'sendora_contract_info',
	PARAMETER_HISTORY: 'sendora_parameter_history'
};

// Maximum items to store | 最大存储项数
const MAX_HISTORY_ITEMS = 100;
const MAX_CONTRACT_ITEMS = 50;
const MAX_PARAMETER_VALUES = 10;

export class CallHistoryStorage {
	// Get call history | 获取调用历史
	getCallHistory(): CallHistoryItem[] {
		try {
			const data = localStorage.getItem(STORAGE_KEYS.CALL_HISTORY);
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Failed to parse call history:', error);
			return [];
		}
	}

	// Add call to history | 添加调用到历史
	addCallHistory(item: Omit<CallHistoryItem, 'id' | 'timestamp'>): void {
		const history = this.getCallHistory();

		// Create new item | 创建新项
		const newItem: CallHistoryItem = {
			...item,
			id: crypto.randomUUID(),
			timestamp: Date.now()
		};

		// Add to beginning | 添加到开始
		history.unshift(newItem);

		// Limit items | 限制项数
		if (history.length > MAX_HISTORY_ITEMS) {
			history.splice(MAX_HISTORY_ITEMS);
		}

		// Save | 保存
		localStorage.setItem(STORAGE_KEYS.CALL_HISTORY, JSON.stringify(history));
	}

	// Get contract info | 获取合约信息
	getContractInfo(): ContractInfo[] {
		try {
			const data = localStorage.getItem(STORAGE_KEYS.CONTRACT_INFO);
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Failed to parse contract info:', error);
			return [];
		}
	}

	// Get contract by address and chain | 通过地址和链获取合约
	getContract(address: Address, chainId: number): ContractInfo | null {
		const contracts = this.getContractInfo();
		return (
			contracts.find(
				(c) => c.address.toLowerCase() === address.toLowerCase() && c.chainId === chainId
			) || null
		);
	}

	// Save contract info | 保存合约信息
	saveContractInfo(info: Omit<ContractInfo, 'lastUsed'>): void {
		const contracts = this.getContractInfo();

		// Check if already exists | 检查是否已存在
		const existingIndex = contracts.findIndex(
			(c) => c.address.toLowerCase() === info.address.toLowerCase() && c.chainId === info.chainId
		);

		const contractInfo: ContractInfo = {
			...info,
			lastUsed: Date.now()
		};

		if (existingIndex >= 0) {
			// Update existing | 更新现有
			contracts[existingIndex] = contractInfo;
		} else {
			// Add new | 添加新的
			contracts.unshift(contractInfo);

			// Sort by last used | 按最后使用排序
			contracts.sort((a, b) => b.lastUsed - a.lastUsed);

			// Limit items | 限制项数
			if (contracts.length > MAX_CONTRACT_ITEMS) {
				contracts.splice(MAX_CONTRACT_ITEMS);
			}
		}

		// Save | 保存
		localStorage.setItem(STORAGE_KEYS.CONTRACT_INFO, JSON.stringify(contracts));
	}

	// Get parameter history | 获取参数历史
	getParameterHistory(): ParameterHistory[] {
		try {
			const data = localStorage.getItem(STORAGE_KEYS.PARAMETER_HISTORY);
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Failed to parse parameter history:', error);
			return [];
		}
	}

	// Get parameter values for a function | 获取函数的参数值
	getParameterValues(functionSignature: string, parameterName: string): string[] {
		const history = this.getParameterHistory();
		const item = history.find(
			(h) => h.functionSignature === functionSignature && h.parameterName === parameterName
		);
		return item?.values || [];
	}

	// Save parameter value | 保存参数值
	saveParameterValue(functionSignature: string, parameterName: string, value: string): void {
		const history = this.getParameterHistory();

		// Find or create history item | 查找或创建历史项
		let item = history.find(
			(h) => h.functionSignature === functionSignature && h.parameterName === parameterName
		);

		if (!item) {
			item = {
				functionSignature,
				parameterName,
				values: [],
				lastUsed: Date.now()
			};
			history.push(item);
		}

		// Update values | 更新值
		item.values = [value, ...item.values.filter((v) => v !== value)];

		// Limit values | 限制值数量
		if (item.values.length > MAX_PARAMETER_VALUES) {
			item.values.splice(MAX_PARAMETER_VALUES);
		}

		item.lastUsed = Date.now();

		// Save | 保存
		localStorage.setItem(STORAGE_KEYS.PARAMETER_HISTORY, JSON.stringify(history));
	}

	// Clear all history | 清除所有历史
	clearAllHistory(): void {
		localStorage.removeItem(STORAGE_KEYS.CALL_HISTORY);
		localStorage.removeItem(STORAGE_KEYS.CONTRACT_INFO);
		localStorage.removeItem(STORAGE_KEYS.PARAMETER_HISTORY);
	}

	// Clear call history only | 仅清除调用历史
	clearCallHistory(): void {
		localStorage.removeItem(STORAGE_KEYS.CALL_HISTORY);
	}

	// Search contracts by name or address | 按名称或地址搜索合约
	searchContracts(query: string): ContractInfo[] {
		const contracts = this.getContractInfo();
		const lowerQuery = query.toLowerCase();

		return contracts.filter(
			(c) =>
				c.address.toLowerCase().includes(lowerQuery) || c.name?.toLowerCase().includes(lowerQuery)
		);
	}

	// Get recent contracts | 获取最近的合约
	getRecentContracts(limit: number = 5): ContractInfo[] {
		const contracts = this.getContractInfo();
		return contracts.slice(0, limit);
	}

	// Get recent contracts by chainId | 根据链ID获取最近的合约
	getRecentContractsByChainId(chainId: number, limit: number = 5): ContractInfo[] {
		const contracts = this.getContractInfo();
		return contracts.filter((c) => c.chainId === chainId).slice(0, limit);
	}

	// Get recent calls | 获取最近的调用
	getRecentCalls(limit: number = 10): CallHistoryItem[] {
		const history = this.getCallHistory();
		return history.slice(0, limit);
	}

	// Get recent calls by chainId | 根据链ID获取最近的调用
	getRecentCallsByChainId(chainId: number, limit: number = 10): CallHistoryItem[] {
		const history = this.getCallHistory();
		return history.filter((call) => call.chainId === chainId).slice(0, limit);
	}

	// Remove contract by address and chainId | 根据地址和链ID删除合约
	removeContract(address: Address, chainId: number): void {
		const contracts = this.getContractInfo();
		const updatedContracts = contracts.filter(
			(c) => !(c.address.toLowerCase() === address.toLowerCase() && c.chainId === chainId)
		);
		localStorage.setItem(STORAGE_KEYS.CONTRACT_INFO, JSON.stringify(updatedContracts));
	}

	// Remove call history item by id | 根据ID删除调用历史项
	removeCallHistoryItem(id: string): void {
		const history = this.getCallHistory();
		const updatedHistory = history.filter((call) => call.id !== id);
		localStorage.setItem(STORAGE_KEYS.CALL_HISTORY, JSON.stringify(updatedHistory));
	}

	// Clear parameter history for specific function | 清除特定函数的参数历史
	clearParameterHistoryForFunction(functionSignature: string): void {
		const history = this.getParameterHistory();
		const updatedHistory = history.filter((h) => h.functionSignature !== functionSignature);
		localStorage.setItem(STORAGE_KEYS.PARAMETER_HISTORY, JSON.stringify(updatedHistory));
	}
}

// Singleton instance | 单例实例
export const callHistoryStorage = new CallHistoryStorage();
