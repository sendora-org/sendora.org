// Clipboard utility functions | 剪贴板工具函数

/**
 * Copy text to clipboard with fallback support | 复制文本到剪贴板，支持回退方案
 * @param text - Text to copy | 要复制的文本
 * @returns Promise that resolves when copy is complete | 复制完成时解决的Promise
 */
export async function copyToClipboard(text: string): Promise<void> {
	try {
		// Try modern clipboard API first | 首先尝试现代剪贴板API
		await navigator.clipboard.writeText(text);
	} catch (error) {
		console.error('Modern clipboard failed:', error);

		// Fallback for browsers that don't support clipboard API | 不支持剪贴板API的浏览器的后备方案
		try {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			textArea.style.top = '-999999px';
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
		} catch (fallbackError) {
			console.error('Fallback copy failed:', fallbackError);
			throw new Error('Unable to copy to clipboard');
		}
	}
}

/**
 * Copy text to clipboard and show temporary success state | 复制文本到剪贴板并显示临时成功状态
 * @param text - Text to copy | 要复制的文本
 * @param onSuccess - Callback when copy succeeds | 复制成功时的回调
 * @param onError - Callback when copy fails | 复制失败时的回调
 */
export async function copyWithFeedback(
	text: string,
	onSuccess?: () => void,
	onError?: (error: Error) => void
): Promise<void> {
	try {
		await copyToClipboard(text);
		onSuccess?.();
	} catch (error) {
		onError?.(error instanceof Error ? error : new Error('Copy failed'));
	}
}
