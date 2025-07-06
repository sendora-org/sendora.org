/**
 * 主题状态管理 / Theme state management
 *
 * 管理明暗模式切换和持久化
 * Manages light/dark mode switching and persistence
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// 主题类型定义 / Theme type definition
export type Theme = 'light' | 'dark';

// 从 cookie 获取主题偏好（避免闪烁） / Get theme preference from cookie (avoid flashing)
function getThemeFromCookie(): Theme | null {
	if (!browser) return null;

	try {
		// 从 cookie 中读取主题设置 / Read theme setting from cookie
		const cookieMatch = document.cookie.match(/SENDORA_THEME=([^;]+)/);
		const cookieTheme = cookieMatch?.[1];

		if (cookieTheme === 'light' || cookieTheme === 'dark') {
			return cookieTheme;
		}
	} catch {
		// 忽略错误 / Ignore errors
	}

	return null;
}

// 从本地存储获取主题偏好 / Get theme preference from localStorage
function getInitialTheme(): Theme {
	if (!browser) return 'light';

	try {
		// 优先使用 cookie 中的设置（避免闪烁） / Prefer cookie setting (avoid flashing)
		const cookieTheme = getThemeFromCookie();
		if (cookieTheme) {
			return cookieTheme;
		}

		// 其次使用本地存储的设置 / Then use localStorage setting
		const stored = localStorage.getItem('theme');
		if (stored === 'light' || stored === 'dark') {
			return stored;
		}

		// 最后使用系统偏好 / Fall back to system preference
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		return prefersDark ? 'dark' : 'light';
	} catch {
		return 'light';
	}
}

// 创建响应式主题状态 / Create reactive theme state
export const theme = writable<Theme>(getInitialTheme());

// 设置 cookie 的辅助函数 / Helper function to set cookie
function setCookie(name: string, value: string, days = 365) {
	if (!browser) return;

	const expires = new Date();
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
	document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// 应用主题到文档 / Apply theme to document
function applyTheme(newTheme: Theme) {
	if (!browser) return;

	// 更新 document 类 / Update document class
	if (newTheme === 'dark') {
		document.documentElement.classList.add('dark');
	} else {
		document.documentElement.classList.remove('dark');
	}

	// 保存到本地存储和 cookie / Save to localStorage and cookie
	localStorage.setItem('theme', newTheme);
	setCookie('SENDORA_THEME', newTheme);
}

// 初始化时应用主题 / Apply theme on initialization
if (browser) {
	const initialTheme = getInitialTheme();
	applyTheme(initialTheme);

	// 监听系统主题变化 / Listen for system theme changes
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', (e) => {
		// 只有在没有手动设置时才跟随系统 / Only follow system if no manual setting
		const stored = localStorage.getItem('theme');
		if (!stored) {
			const newTheme = e.matches ? 'dark' : 'light';
			theme.set(newTheme);
			applyTheme(newTheme);
		}
	});
}

// 订阅主题变化并应用 / Subscribe to theme changes and apply
theme.subscribe((newTheme) => {
	applyTheme(newTheme);
});

// 切换主题函数 / Toggle theme function
export function toggleTheme() {
	theme.update((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
}

// 设置特定主题 / Set specific theme
export function setTheme(newTheme: Theme) {
	theme.set(newTheme);
}
