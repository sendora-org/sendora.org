<!-- Deployment history component | 部署历史组件 -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import CopyButton from '$lib/components/ui/copy-button.svelte';
	import { Trash2, Download } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import { formatUnits } from 'viem';
	import * as m from '$lib/paraglide/messages.js';
	import { DeploymentStorage, type DeploymentRecord } from '$lib/services/deployment-storage';
	// Note: currentChainId available for future filtering feature | 注释：currentChainId 可用于未来的过滤功能
	import { getNetworkByChainId } from '$lib/stores/networks';

	// Initialize dayjs plugins | 初始化 dayjs 插件
	dayjs.extend(relativeTime);

	// Get chain name from chain ID | 从链 ID 获取链名称
	function getChainName(chainId: number): string {
		const network = getNetworkByChainId(chainId.toString());
		return network ? network.name : `Chain ${chainId}`;
	}

	// Component state | 组件状态
	let deployments = $state<DeploymentRecord[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Load deployments on mount | 挂载时加载部署记录
	onMount(async () => {
		await loadDeployments();
	});

	// Load all deployments | 加载所有部署记录
	async function loadDeployments() {
		try {
			loading = true;
			error = null;
			deployments = await DeploymentStorage.getAllDeployments();
		} catch (err) {
			console.error('Failed to load deployments:', err);
			error = m.deploy_history_load_error();
		} finally {
			loading = false;
		}
	}

	// Delete deployment | 删除部署记录
	async function deleteDeployment(id: number) {
		if (!confirm(m.deploy_history_delete_confirm())) {
			return;
		}

		try {
			await DeploymentStorage.deleteDeployment(id);
			await loadDeployments();
		} catch (err) {
			console.error('Failed to delete deployment:', err);
			alert(m.deploy_history_delete_error());
		}
	}

	// Clear all deployments | 清除所有部署记录
	async function clearAllDeployments() {
		if (!confirm(m.deploy_history_clear_confirm())) {
			return;
		}

		try {
			await DeploymentStorage.clearAllDeployments();
			await loadDeployments();
		} catch (err) {
			console.error('Failed to clear deployments:', err);
			alert(m.deploy_history_clear_error());
		}
	}

	// Export deployments | 导出部署记录
	async function exportDeployments() {
		try {
			const json = await DeploymentStorage.exportDeployments();
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `sendora-deployments-${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Failed to export deployments:', err);
			alert(m.deploy_history_export_error());
		}
	}

	// Get explorer URL for address | 获取地址的浏览器 URL
	function getExplorerUrl(chainId: number, address: string): string | null {
		const network = getNetworkByChainId(chainId.toString());
		if (!network?.explorerURL) return null;
		return `${network.explorerURL}/address/${address}`;
	}

	// Get explorer URL for transaction | 获取交易的浏览器 URL
	function getTransactionUrl(chainId: number, txHash: string): string | null {
		const network = getNetworkByChainId(chainId.toString());
		if (!network?.explorerURL) return null;
		return `${network.explorerURL}/tx/${txHash}`;
	}

	// Get explorer URL for block | 获取区块的浏览器 URL
	function getBlockUrl(chainId: number, blockNumber: number): string | null {
		const network = getNetworkByChainId(chainId.toString());
		if (!network?.explorerURL) return null;
		return `${network.explorerURL}/block/${blockNumber}`;
	}

	// Format gas used | 格式化 gas 使用量
	function formatGasUsed(gasUsed: bigint): string {
		return gasUsed.toLocaleString();
	}

	// Format gas price | 格式化 gas 价格
	function formatGasPrice(gasPrice?: bigint): string {
		if (!gasPrice) return 'N/A';
		return `${formatUnits(gasPrice, 9)} Gwei`;
	}

	// Get deployment type badge color | 获取部署类型徽章颜色
	function getDeploymentTypeBadgeVariant(type: string): 'default' | 'secondary' {
		return type === 'create2' ? 'secondary' : 'default';
	}

	// Note: Currently showing all deployments, but could filter by current chain if needed
	// | 注释：当前显示所有部署，但如果需要可以按当前链过滤
</script>

<div class="space-y-4">
	<!-- Header with actions | 带操作的头部 -->
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold">{m.deploy_history_title()}</h3>
			<p class="text-muted-foreground text-sm">
				{m.deploy_history_subtitle({ count: deployments.length })}
			</p>
		</div>
		<div class="flex gap-2">
			<Button
				size="sm"
				variant="outline"
				onclick={exportDeployments}
				disabled={deployments.length === 0}
			>
				<Download class="mr-2 h-4 w-4" />
				{m.deploy_history_export()}
			</Button>
			<Button
				size="sm"
				variant="outline"
				onclick={clearAllDeployments}
				disabled={deployments.length === 0}
			>
				<Trash2 class="mr-2 h-4 w-4" />
				{m.clear_all()}
			</Button>
		</div>
	</div>

	<!-- Loading state | 加载状态 -->
	{#if loading}
		<div class="py-8 text-center">
			<p class="text-muted-foreground">{m.deploy_history_loading()}</p>
		</div>
	{:else if error}
		<!-- Error state | 错误状态 -->
		<div class="py-8 text-center">
			<p class="text-destructive">{error}</p>
			<Button size="sm" variant="outline" onclick={loadDeployments} class="mt-4">
				{m.deploy_history_retry()}
			</Button>
		</div>
	{:else if deployments.length === 0}
		<!-- Empty state | 空状态 -->
		<div class="py-8 text-center">
			<p class="text-muted-foreground">{m.deploy_history_empty()}</p>
		</div>
	{:else}
		<!-- Deployment list | 部署列表 -->
		<div class="space-y-4">
			{#each deployments as deployment (deployment.id)}
				<Card>
					<CardHeader>
						<div class="flex items-start justify-between">
							<div>
								<CardTitle class="text-base">{deployment.contractName}</CardTitle>
								<CardDescription class="mt-1">
									{m.deploy_history_deployed_at({
										time: dayjs(deployment.timestamp).fromNow()
									})}
								</CardDescription>
							</div>
							<div class="flex items-center gap-2">
								<Badge variant={getDeploymentTypeBadgeVariant(deployment.deploymentType)}>
									{deployment.deploymentType.toUpperCase()}
								</Badge>
								<Badge variant="outline">{getChainName(deployment.chainId)}</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent class="space-y-3">
						<!-- Contract address | 合约地址 -->
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground text-sm">{m.deploy_history_address()}</span>
							<div class="flex items-center gap-2 overflow-auto pl-4">
								{#if getExplorerUrl(deployment.chainId, deployment.contractAddress)}
									<a
										href={getExplorerUrl(deployment.chainId, deployment.contractAddress)}
										target="_blank"
										rel="noopener noreferrer"
										class="text-primary font-mono text-sm hover:underline"
									>
										{deployment.contractAddress}
									</a>
								{:else}
									<code class="font-mono text-sm">{deployment.contractAddress}</code>
								{/if}
								<CopyButton
									text={deployment.contractAddress}
									size="icon"
									class="h-6 w-6 opacity-60 hover:opacity-100"
								/>
							</div>
						</div>

						<!-- Transaction hash | 交易哈希 -->
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground text-sm">{m.deploy_history_tx_hash()}</span>
							<div class="flex items-center gap-2 overflow-auto pl-4">
								{#if getTransactionUrl(deployment.chainId, deployment.transactionHash)}
									<a
										href={getTransactionUrl(deployment.chainId, deployment.transactionHash)}
										target="_blank"
										rel="noopener noreferrer"
										class="text-primary font-mono text-sm hover:underline"
									>
										{deployment.transactionHash.slice(0, 10)}...{deployment.transactionHash.slice(
											-8
										)}
									</a>
								{:else}
									<code class="font-mono text-sm">
										{deployment.transactionHash.slice(0, 10)}...{deployment.transactionHash.slice(
											-8
										)}
									</code>
								{/if}
								<CopyButton
									text={deployment.transactionHash}
									size="icon"
									class="h-6 w-6 opacity-60 hover:opacity-100"
								/>
							</div>
						</div>

						<!-- Gas details | Gas 详情 -->
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground text-sm">{m.deploy_history_gas_used()}</span>
							<span class="font-mono text-sm">{formatGasUsed(deployment.gasUsed)}</span>
						</div>

						{#if deployment.gasPrice}
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground text-sm">{m.deploy_history_gas_price()}</span>
								<span class="font-mono text-sm">{formatGasPrice(deployment.gasPrice)}</span>
							</div>
						{/if}

						<!-- CREATE2 salt if applicable | CREATE2 盐值（如果适用） -->
						{#if deployment.deploymentType === 'create2' && deployment.saltOriginal}
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground text-sm">{m.deploy_history_salt()}</span>
								<code class="overflow-auto pl-4 font-mono text-sm">{deployment.saltOriginal}</code>
							</div>
						{/if}

						<!-- Block number | 区块号 -->
						{#if deployment.blockNumber}
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground text-sm">{m.deploy_history_block()}</span>
								{#if getBlockUrl(deployment.chainId, deployment.blockNumber)}
									<a
										href={getBlockUrl(deployment.chainId, deployment.blockNumber)}
										target="_blank"
										rel="noopener noreferrer"
										class="text-primary overflow-auto pl-4 font-mono text-sm hover:underline"
									>
										#{deployment.blockNumber.toLocaleString()}
									</a>
								{:else}
									<span class="overflow-auto pl-4 font-mono text-sm"
										>#{deployment.blockNumber.toLocaleString()}</span
									>
								{/if}
							</div>
						{/if}

						<!-- Delete button | 删除按钮 -->
						<div class="mt-4 flex justify-end">
							<Button
								size="sm"
								variant="ghost"
								onclick={() => deleteDeployment(deployment.id!)}
								class="text-muted-foreground hover:text-destructive opacity-60 hover:opacity-100"
							>
								<Trash2 class="mr-2 h-4 w-4" />
								{m.deploy_history_delete()}
							</Button>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
