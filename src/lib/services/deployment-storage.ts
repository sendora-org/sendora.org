// IndexedDB storage for deployment history using Dexie | 使用 Dexie 的部署历史 IndexedDB 存储
import Dexie from 'dexie';

export interface DeploymentRecord {
	id?: number;
	contractName: string;
	contractAddress: string;
	transactionHash: string;
	chainId: number;
	deploymentType: 'standard' | 'create2';
	gasUsed: bigint;
	gasPrice?: bigint;
	salt?: string;
	saltOriginal?: string; // Original salt input (text or hex) | 原始盐值输入（文本或十六进制）
	bytecode?: string;
	constructorArgs?: string;
	timestamp: number;
	blockNumber?: number;
}

export interface NetworkInfo {
	chainId: number;
	name: string;
	rpcUrl?: string;
}

class DeploymentDatabase extends Dexie {
	deployments!: Dexie.Table<DeploymentRecord, number>;
	networks!: Dexie.Table<NetworkInfo, number>;

	constructor() {
		super('SendoraDeployments');

		this.version(1).stores({
			deployments:
				'++id, contractName, contractAddress, transactionHash, chainId, deploymentType, timestamp',
			networks: 'chainId, name'
		});

		// Version 2: Add saltOriginal field | 版本 2：添加 saltOriginal 字段
		this.version(2).stores({
			deployments:
				'++id, contractName, contractAddress, transactionHash, chainId, deploymentType, timestamp',
			networks: 'chainId, name'
		});

		// Hook to convert BigInt to string for storage | 钩子将 BigInt 转换为字符串进行存储
		this.deployments.hook('creating', function (_primKey, obj) {
			interface StorageObj {
				gasUsed?: bigint;
				gasPrice?: bigint;
				gasUsedString?: string;
				gasPriceString?: string;
			}
			const storageObj = obj as StorageObj;
			if (typeof storageObj.gasUsed === 'bigint') {
				storageObj.gasUsedString = storageObj.gasUsed.toString();
				delete storageObj.gasUsed;
			}
			if (typeof storageObj.gasPrice === 'bigint') {
				storageObj.gasPriceString = storageObj.gasPrice.toString();
				delete storageObj.gasPrice;
			}
		});

		// Hook to convert string back to BigInt when reading | 读取时将字符串转换回 BigInt 的钩子
		this.deployments.hook('reading', function (obj) {
			interface StorageObj {
				gasUsed?: bigint;
				gasPrice?: bigint;
				gasUsedString?: string;
				gasPriceString?: string;
			}
			const storageObj = obj as StorageObj;
			if (storageObj.gasUsedString) {
				storageObj.gasUsed = BigInt(storageObj.gasUsedString);
				delete storageObj.gasUsedString;
			}
			if (storageObj.gasPriceString) {
				storageObj.gasPrice = BigInt(storageObj.gasPriceString);
				delete storageObj.gasPriceString;
			}
			return obj;
		});
	}
}

export const deploymentDB = new DeploymentDatabase();

export class DeploymentStorage {
	// Save deployment record | 保存部署记录
	static async saveDeployment(deployment: Omit<DeploymentRecord, 'id'>): Promise<number> {
		try {
			const id = await deploymentDB.deployments.add({
				...deployment,
				timestamp: deployment.timestamp || Date.now()
			});
			console.log('✅ Deployment saved to IndexedDB:', id);
			return id;
		} catch (error) {
			console.error('❌ Failed to save deployment:', error);
			throw error;
		}
	}

	// Get all deployments | 获取所有部署记录
	static async getAllDeployments(): Promise<DeploymentRecord[]> {
		try {
			const deployments = await deploymentDB.deployments.orderBy('timestamp').reverse().toArray();
			return deployments;
		} catch (error) {
			console.error('❌ Failed to load deployments:', error);
			return [];
		}
	}

	// Get deployments by chain ID | 按链 ID 获取部署记录
	static async getDeploymentsByChainId(chainId: number): Promise<DeploymentRecord[]> {
		try {
			const deployments = await deploymentDB.deployments
				.where('chainId')
				.equals(chainId)
				.reverse()
				.sortBy('timestamp');
			return deployments;
		} catch (error) {
			console.error('❌ Failed to load deployments by chain ID:', error);
			return [];
		}
	}

	// Get deployments by contract name | 按合约名称获取部署记录
	static async getDeploymentsByName(contractName: string): Promise<DeploymentRecord[]> {
		try {
			const deployments = await deploymentDB.deployments
				.where('contractName')
				.equals(contractName)
				.reverse()
				.sortBy('timestamp');
			return deployments;
		} catch (error) {
			console.error('❌ Failed to load deployments by name:', error);
			return [];
		}
	}

	// Delete deployment by ID | 按 ID 删除部署记录
	static async deleteDeployment(id: number): Promise<void> {
		try {
			await deploymentDB.deployments.delete(id);
			console.log('✅ Deployment deleted from IndexedDB:', id);
		} catch (error) {
			console.error('❌ Failed to delete deployment:', error);
			throw error;
		}
	}

	// Clear all deployments | 清除所有部署记录
	static async clearAllDeployments(): Promise<void> {
		try {
			await deploymentDB.deployments.clear();
			console.log('✅ All deployments cleared from IndexedDB');
		} catch (error) {
			console.error('❌ Failed to clear deployments:', error);
			throw error;
		}
	}

	// Save network info | 保存网络信息
	static async saveNetworkInfo(network: NetworkInfo): Promise<void> {
		try {
			await deploymentDB.networks.put(network);
			console.log('✅ Network info saved:', network.name);
		} catch (error) {
			console.error('❌ Failed to save network info:', error);
			throw error;
		}
	}

	// Get network info by chain ID | 按链 ID 获取网络信息
	static async getNetworkInfo(chainId: number): Promise<NetworkInfo | undefined> {
		try {
			return await deploymentDB.networks.get(chainId);
		} catch (error) {
			console.error('❌ Failed to get network info:', error);
			return undefined;
		}
	}

	// Export deployments as JSON | 导出部署记录为 JSON
	static async exportDeployments(): Promise<string> {
		try {
			const deployments = await this.getAllDeployments();

			// Convert BigInt values to strings for JSON serialization | 将 BigInt 值转换为字符串以进行 JSON 序列化
			const exportData = deployments.map((deployment) => ({
				...deployment,
				gasUsed: deployment.gasUsed.toString(),
				gasPrice: deployment.gasPrice?.toString()
			}));

			return JSON.stringify(exportData, null, 2);
		} catch (error) {
			console.error('❌ Failed to export deployments:', error);
			throw error;
		}
	}

	// Import deployments from JSON | 从 JSON 导入部署记录
	static async importDeployments(jsonData: string): Promise<number> {
		try {
			const deployments = JSON.parse(jsonData);

			if (!Array.isArray(deployments)) {
				throw new Error('Invalid data format: expected array');
			}

			// Convert string values back to BigInt | 将字符串值转换回 BigInt
			const processedDeployments = deployments.map((deployment) => ({
				...deployment,
				gasUsed: BigInt(deployment.gasUsed),
				gasPrice: deployment.gasPrice ? BigInt(deployment.gasPrice) : undefined,
				id: undefined // Remove ID to allow auto-increment | 移除 ID 以允许自动递增
			}));

			await deploymentDB.deployments.bulkAdd(processedDeployments);

			console.log('✅ Deployments imported successfully:', processedDeployments.length);
			return processedDeployments.length;
		} catch (error) {
			console.error('❌ Failed to import deployments:', error);
			throw error;
		}
	}

	// Get deployment statistics | 获取部署统计信息
	static async getDeploymentStats(): Promise<{
		total: number;
		byChain: { [chainId: number]: number };
		byType: { standard: number; create2: number };
	}> {
		try {
			const deployments = await this.getAllDeployments();

			const stats = {
				total: deployments.length,
				byChain: {} as { [chainId: number]: number },
				byType: { standard: 0, create2: 0 }
			};

			deployments.forEach((deployment) => {
				// Count by chain | 按链统计
				stats.byChain[deployment.chainId] = (stats.byChain[deployment.chainId] || 0) + 1;

				// Count by type | 按类型统计
				stats.byType[deployment.deploymentType]++;
			});

			return stats;
		} catch (error) {
			console.error('❌ Failed to get deployment stats:', error);
			return { total: 0, byChain: {}, byType: { standard: 0, create2: 0 } };
		}
	}
}
