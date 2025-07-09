// Balance and token types | 余额和代币类型
import type { Address } from 'viem';

// Token information interface | 代币信息接口
export interface TokenInfo {
	/** Token contract address | 代币合约地址 */
	address: Address;
	/** Token symbol | 代币符号 */
	symbol: string;
	/** Token name | 代币名称 */
	name: string;
	/** Token decimals | 代币小数位数 */
	decimals: number;
	/** Token logo URL | 代币 logo 链接 */
	logoURI?: string;
	/** Chain ID where token exists | 代币所在链 ID */
	chainId: number;
	/** Whether this is a custom added token | 是否为用户自定义添加的代币 */
	isCustom?: boolean;
}

// Token balance interface | 代币余额接口
export interface TokenBalance {
	/** Token information | 代币信息 */
	token: TokenInfo;
	/** Raw balance in smallest unit | 原始余额（最小单位） */
	balance: bigint;
	/** Formatted balance as string | 格式化后的余额字符串 */
	formattedBalance: string;
	/** USD price per token | 单个代币的美元价格 */
	price?: number;
	/** Total USD value | 总美元价值 */
	value?: number;
	/** 24h price change percentage | 24 小时价格变化百分比 */
	change24h?: number;
	/** Last updated timestamp | 最后更新时间戳 */
	lastUpdated: number;
	/** Loading state | 加载状态 */
	loading?: boolean;
	/** Error message if failed to load | 加载失败的错误信息 */
	error?: string;
}

// Portfolio summary interface | 投资组合摘要接口
export interface PortfolioSummary {
	/** Total portfolio value in USD | 投资组合总价值（美元） */
	totalValue: number;
	/** ETH balance | ETH 余额 */
	ethBalance: string;
	/** ETH value in USD | ETH 美元价值 */
	ethValue: number;
	/** Total number of tokens | 代币总数 */
	tokenCount: number;
	/** Last updated timestamp | 最后更新时间戳 */
	lastUpdated: number;
}

// Balance loading state | 余额加载状态
export interface BalanceState {
	/** Whether balances are currently loading | 是否正在加载余额 */
	loading: boolean;
	/** Token balances array | 代币余额数组 */
	balances: TokenBalance[];
	/** Portfolio summary | 投资组合摘要 */
	summary: PortfolioSummary | null;
	/** Error message if failed to load | 加载失败的错误信息 */
	error: string | null;
	/** Last refresh timestamp | 最后刷新时间戳 */
	lastRefresh: number;
}

// Balance filter options | 余额筛选选项
export interface BalanceFilters {
	/** Hide tokens with zero balance | 隐藏零余额代币 */
	hideZeroBalances: boolean;
	/** Filter by specific chain ID | 按特定链 ID 筛选 */
	chainId: number | null;
	/** Search query for token name/symbol | 代币名称/符号搜索查询 */
	searchQuery: string;
	/** Sort by field | 排序字段 */
	sortBy: 'name' | 'balance' | 'value' | 'change24h';
	/** Sort direction | 排序方向 */
	sortDirection: 'asc' | 'desc';
}
