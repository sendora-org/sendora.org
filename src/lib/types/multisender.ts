// Multisender type definitions | 多发送器类型定义

// ERC20 token info | ERC20 代币信息
export interface UserToken {
	address: string;
	name: string;
	symbol: string;
	decimals: number;
	balance: string;
	logo?: string;
}

// ERC721 NFT info | ERC721 NFT 信息
export interface UserNFT {
	tokenId: string;
	name: string;
	image: string;
}

// ERC1155 token info | ERC1155 代币信息
export interface UserERC1155Token {
	tokenId: string;
	name: string;
	balance: number;
	image: string;
}

// Parsed recipient data for ETH | ETH 接收者数据
export interface ParsedETHRecipient {
	address: string;
	amount: number;
	isValid: boolean;
}

// Parsed recipient data for ERC20 | ERC20 接收者数据
export interface ParsedERC20Recipient {
	address: string;
	amount: number;
	isValid: boolean;
}

// Parsed recipient data for ERC721 | ERC721 接收者数据
export interface ParsedERC721Recipient {
	address: string;
	tokenId: string;
	isValid: boolean;
}

// Parsed recipient data for ERC1155 | ERC1155 接收者数据
export interface ParsedERC1155Recipient {
	address: string;
	tokenId: string;
	amount: number;
	isValid: boolean;
}
