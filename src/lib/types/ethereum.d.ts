// Ethereum provider type definitions | 以太坊提供者类型定义

export interface EthereumProvider {
	// Standard methods | 标准方法
	request(args: { method: string; params?: unknown[] }): Promise<unknown>;
	on(eventName: string, handler: (...args: unknown[]) => void): void;
	removeListener(eventName: string, handler: (...args: unknown[]) => void): void;

	// Optional methods | 可选方法
	removeAllListeners?(eventName?: string): void;
	disconnect?(): Promise<void>;

	// Wallet identification flags | 钱包识别标志
	isMetaMask?: boolean;
	isRabby?: boolean;
	isBraveWallet?: boolean;
	isCoinbaseWallet?: boolean;

	// Optional properties | 可选属性
	selectedAddress?: string;
	chainId?: string;
}

declare global {
	interface Window {
		ethereum?: EthereumProvider;
		coinbaseWalletExtension?: EthereumProvider;
	}
}
