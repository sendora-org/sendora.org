/**
 * Contract artifact parser service for Hardhat and Foundry formats
 * 合约构件解析服务，支持 Hardhat 和 Foundry 格式
 */

// Type definitions for contract artifacts | 合约构件的类型定义
export interface ParsedArtifact {
	contractName: string; // Contract name | 合约名称
	bytecode: string; // Deployed bytecode | 部署字节码
	abi: unknown[]; // Contract ABI | 合约 ABI
	format: 'hardhat' | 'foundry' | 'remix' | 'unknown'; // Detected format | 检测到的格式
}

// Type guard to check if value is an object | 类型守卫，检查值是否为对象
function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Type guard to check if value is a valid ABI array | 类型守卫，检查值是否为有效的 ABI 数组
function isValidABI(value: unknown): value is unknown[] {
	return Array.isArray(value) && value.length > 0;
}

// Extract contract from Remix compile details | 从 Remix 编译详情中提取合约
function extractFromRemix(data: unknown): ParsedArtifact | null {
	// Remix structure: data.contracts["filename.sol"]["ContractName"] | Remix 结构
	if (!isObject(data) || !isObject(data.contracts)) {
		return null;
	}

	// Iterate through files | 遍历文件
	for (const fileName of Object.keys(data.contracts)) {
		const fileContracts = data.contracts[fileName];
		if (!isObject(fileContracts)) continue;

		// Iterate through contracts in file | 遍历文件中的合约
		for (const contractName of Object.keys(fileContracts)) {
			const contract = fileContracts[contractName];
			if (!isObject(contract)) continue;

			// Extract bytecode from evm.bytecode.object | 从 evm.bytecode.object 提取字节码
			const contractEvm = contract as Record<string, unknown>;
			let bytecode = null;

			// Check different possible bytecode locations | 检查不同的可能字节码位置
			const evm = contractEvm.evm as Record<string, unknown> | undefined;
			if (evm?.bytecode) {
				if (typeof evm.bytecode === 'string') {
					// Direct string bytecode | 直接字符串字节码
					bytecode = evm.bytecode;
				} else if (isObject(evm.bytecode) && typeof evm.bytecode.object === 'string') {
					// Nested object format | 嵌套对象格式
					bytecode = evm.bytecode.object;
				}
			}

			// Fallback to deployedBytecode if bytecode not found | 如果找不到 bytecode，回退到 deployedBytecode
			if (!bytecode && evm?.deployedBytecode) {
				if (typeof evm.deployedBytecode === 'string') {
					bytecode = evm.deployedBytecode;
				} else if (
					isObject(evm.deployedBytecode) &&
					typeof evm.deployedBytecode.object === 'string'
				) {
					bytecode = evm.deployedBytecode.object;
				}
			}

			if (!bytecode || typeof bytecode !== 'string' || bytecode.length < 2) continue;

			// Ensure bytecode has 0x prefix | 确保字节码有 0x 前缀
			if (!bytecode.startsWith('0x')) {
				bytecode = '0x' + bytecode;
			}

			// Extract ABI | 提取 ABI
			const abi = (contract as Record<string, unknown>).abi;
			if (!isValidABI(abi)) continue;

			// Final validation before return | 返回前的最终验证
			if (typeof bytecode !== 'string') {
				console.error('Bytecode is not a string before return:', bytecode);
				continue;
			}

			return {
				contractName,
				bytecode,
				abi,
				format: 'remix'
			};
		}
	}

	return null;
}

// Extract bytecode from various formats | 从各种格式中提取字节码
function extractBytecode(artifact: unknown): string | null {
	if (!isObject(artifact)) return null;
	// Direct bytecode field (Hardhat) | 直接的 bytecode 字段（Hardhat）
	if (typeof artifact.bytecode === 'string' && artifact.bytecode.length > 0) {
		return artifact.bytecode.startsWith('0x') ? artifact.bytecode : '0x' + artifact.bytecode;
	}

	// Nested bytecode.object field (Foundry) | 嵌套的 bytecode.object 字段（Foundry）
	if (isObject(artifact.bytecode) && typeof artifact.bytecode.object === 'string') {
		const bytecode = artifact.bytecode.object;
		return bytecode.startsWith('0x') ? bytecode : '0x' + bytecode;
	}

	// Sometimes Foundry uses deployedBytecode | 有时 Foundry 使用 deployedBytecode
	if (isObject(artifact.deployedBytecode) && typeof artifact.deployedBytecode.object === 'string') {
		const bytecode = artifact.deployedBytecode.object;
		return bytecode.startsWith('0x') ? bytecode : '0x' + bytecode;
	}

	// Direct deployedBytecode field | 直接的 deployedBytecode 字段
	if (typeof artifact.deployedBytecode === 'string' && artifact.deployedBytecode.length > 0) {
		const bytecode = artifact.deployedBytecode;
		return bytecode.startsWith('0x') ? bytecode : '0x' + bytecode;
	}

	return null;
}

// Extract contract name from various sources | 从各种来源提取合约名称
function extractContractName(artifact: unknown, fallbackName?: string): string {
	if (!isObject(artifact)) return fallbackName || 'Unknown Contract';
	// Direct contractName field | 直接的 contractName 字段
	if (typeof artifact.contractName === 'string' && artifact.contractName.trim()) {
		return artifact.contractName.trim();
	}

	// Direct name field | 直接的 name 字段
	if (typeof artifact.name === 'string' && artifact.name.trim()) {
		return artifact.name.trim();
	}

	// From metadata (Foundry) | 从元数据中提取（Foundry）
	if (isObject(artifact.metadata)) {
		try {
			const metadata =
				typeof artifact.metadata === 'string' ? JSON.parse(artifact.metadata) : artifact.metadata;
			if (isObject(metadata.settings) && isObject(metadata.settings.compilationTarget)) {
				const targets = Object.values(metadata.settings.compilationTarget);
				if (targets.length > 0 && typeof targets[0] === 'string') {
					return targets[0];
				}
			}
		} catch {
			// Ignore parsing errors | 忽略解析错误
		}
	}

	// From AST (Foundry) | 从 AST 中提取（Foundry）
	if (isObject(artifact.ast) && typeof artifact.ast.absolutePath === 'string') {
		const path = artifact.ast.absolutePath;
		const match = path.match(/([^/\\]+)\.sol$/);
		if (match) {
			return match[1];
		}
	}

	// Use fallback name or default | 使用备用名称或默认值
	return fallbackName || 'Unknown Contract';
}

// Detect artifact format based on structure | 根据结构检测构件格式
function detectFormat(artifact: unknown): 'hardhat' | 'foundry' | 'remix' | 'unknown' {
	if (!isObject(artifact)) return 'unknown';
	// Hardhat typically has direct bytecode field | Hardhat 通常有直接的 bytecode 字段
	if (typeof artifact.bytecode === 'string' && isValidABI(artifact.abi)) {
		return 'hardhat';
	}

	// Foundry typically has bytecode.object structure | Foundry 通常有 bytecode.object 结构
	if (
		isObject(artifact.bytecode) &&
		typeof artifact.bytecode.object === 'string' &&
		isValidABI(artifact.abi)
	) {
		return 'foundry';
	}

	// Additional Foundry indicators | 额外的 Foundry 标识
	if (
		artifact.metadata ||
		artifact.ast ||
		(isObject(artifact.deployedBytecode) && 'object' in artifact.deployedBytecode)
	) {
		return 'foundry';
	}

	// Additional Hardhat indicators | 额外的 Hardhat 标识
	if (artifact.contractName || artifact.sourceName || artifact.deployedBytecode) {
		return 'hardhat';
	}

	// Remix format detection | Remix 格式检测
	if (isObject(artifact.contracts)) {
		return 'remix';
	}

	return 'unknown';
}

// Parse JSON safely with error handling | 安全地解析 JSON 并处理错误
function parseJSON(input: string): unknown | null {
	try {
		// Remove potential wrapping characters | 移除可能的包装字符
		const cleaned = input
			.trim()
			.replace(/^```json\s*/, '')
			.replace(/\s*```$/, '');
		return JSON.parse(cleaned);
	} catch {
		return null;
	}
}

// Main parser function | 主解析函数
export function parseContractArtifact(input: string): ParsedArtifact | null {
	if (!input || typeof input !== 'string') {
		return null;
	}

	// Try to parse as JSON | 尝试解析为 JSON
	const artifact = parseJSON(input);
	if (!artifact || !isObject(artifact)) {
		return null;
	}

	// Check if it's Remix format first | 首先检查是否为 Remix 格式
	if (isObject(artifact.contracts)) {
		const remixResult = extractFromRemix(artifact);
		if (remixResult) {
			return remixResult;
		}
	}

	// Extract ABI | 提取 ABI
	const abi = isValidABI(artifact.abi) ? artifact.abi : null;
	if (!abi) {
		return null;
	}

	// Extract bytecode | 提取字节码
	const bytecode = extractBytecode(artifact);
	if (!bytecode) {
		return null;
	}

	// Detect format | 检测格式
	const format = detectFormat(artifact);

	// Extract contract name | 提取合约名称
	const contractName = extractContractName(artifact);

	return {
		contractName,
		bytecode,
		abi,
		format
	};
}

// Parse with multiple attempts and formats | 使用多种尝试和格式进行解析
export function parseArtifactWithFallbacks(input: string): ParsedArtifact | null {
	if (!input || typeof input !== 'string') {
		return null;
	}

	// First attempt: direct parse | 第一次尝试：直接解析
	const directResult = parseContractArtifact(input);
	if (directResult) {
		return directResult;
	}

	// Second attempt: try to extract JSON from mixed content | 第二次尝试：从混合内容中提取 JSON
	// Look for JSON that might be a Remix output | 查找可能是 Remix 输出的 JSON
	const jsonMatch = input.match(/\{\s*"contracts"\s*:[\s\S]*\}/);
	if (jsonMatch) {
		const extracted = parseContractArtifact(jsonMatch[0]);
		if (extracted) {
			return extracted;
		}
	}

	// Try general JSON extraction | 尝试通用 JSON 提取
	const generalJsonMatch = input.match(/\{[\s\S]*\}/);
	if (generalJsonMatch) {
		const extracted = parseContractArtifact(generalJsonMatch[0]);
		if (extracted) {
			return extracted;
		}
	}

	// Third attempt: try to find artifact in larger structure | 第三次尝试：在更大的结构中查找构件
	const parsed = parseJSON(input);
	if (isObject(parsed)) {
		// Check for Remix format first | 首先检查 Remix 格式
		const remixResult = extractFromRemix(parsed);
		if (remixResult) {
			return remixResult;
		}

		// Check for nested artifact structures | 检查嵌套的构件结构
		const possibleKeys = ['artifact', 'contract', 'output', 'result'];
		for (const key of possibleKeys) {
			if (isObject(parsed[key])) {
				const nested = parseContractArtifact(JSON.stringify(parsed[key]));
				if (nested) {
					return nested;
				}
			}
		}
	}

	return null;
}

// Validate parsed artifact | 验证解析的构件
export function validateArtifact(artifact: ParsedArtifact): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Validate contract name | 验证合约名称
	if (!artifact.contractName || artifact.contractName === 'Unknown Contract') {
		errors.push('Contract name could not be determined');
	}

	// Validate bytecode | 验证字节码
	if (!artifact.bytecode || !artifact.bytecode.startsWith('0x')) {
		errors.push('Invalid bytecode format');
	} else if (artifact.bytecode.length < 10) {
		errors.push('Bytecode is too short');
	}

	// Validate ABI | 验证 ABI
	if (!Array.isArray(artifact.abi) || artifact.abi.length === 0) {
		errors.push('Invalid or empty ABI');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

// Format artifact for display | 格式化构件以供显示
export function formatArtifactInfo(artifact: ParsedArtifact): string {
	const validation = validateArtifact(artifact);
	const status = validation.valid ? '✅ Valid' : '❌ Invalid';

	return `
Contract: ${artifact.contractName}
Format: ${artifact.format}
Status: ${status}
Bytecode: ${artifact.bytecode.slice(0, 10)}...${artifact.bytecode.slice(-8)}
ABI Methods: ${artifact.abi.filter((item: unknown) => item && typeof item === 'object' && 'type' in item && (item as { type: string }).type === 'function').length}
${validation.errors.length > 0 ? `Errors: ${validation.errors.join(', ')}` : ''}
`.trim();
}
