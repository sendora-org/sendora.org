# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sendora** - An Ethereum Developer's Toolkit

### Tech Stack

- **SvelteKit 5** with TypeScript and Svelte 5 runes syntax
- **shadcn-svelte** UI component library with Tailwind CSS v4
- **Package Manager**: pnpm
- **Node.js adapter** for production deployment
- **Playwright** for E2E testing and **Vitest** for unit testing
- **Internationalization**: Inlang/Paraglide (English and Chinese)
- **UI Themes**: Dark and Light modes

### Key Requirements

- Every user-facing text must support both English and Chinese
- Modern, intuitive UI design with excellent interaction experience
- Better actual memory retention compared to traditional flashcard apps
- All code comments must be bilingual (Chinese and English)

## Common Commands

### Development

```bash
# Start development server
pnpm dev

# Type checking
pnpm check

# Watch mode type checking
pnpm check:watch
```

### Testing

```bash
# Run all tests (unit + E2E)
pnpm test

# Unit tests only
pnpm test:unit

# E2E tests only
pnpm test:e2e

# Run unit tests in watch mode
pnpm test:unit --watch
```

### Code Quality

```bash
# Lint and format check
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Architecture

### Component Structure

- **UI Components**: Located in `src/lib/components/ui/` using shadcn-svelte patterns
- **App Components**: Main application components in `src/lib/components/`
- **Sidebar Architecture**: Uses a comprehensive sidebar system with nav-main, nav-projects, nav-secondary, and nav-user components

### Key Directories

- `src/lib/components/ui/`: shadcn-svelte UI components (avatar, button, sidebar, etc.)
- `src/lib/paraglide/`: Auto-generated i18n files from Paraglide
- `src/routes/`: SvelteKit routes with file-based routing
- `messages/`: i18n message files (en.json, zh.json)
- `e2e/`: Playwright E2E tests

### Aliases and Imports

- `$lib/*` maps to `src/lib/*`
- `@/*` maps to `src/*`
- shadcn-svelte aliases: `$lib/components/ui`, `$lib/utils`, `$lib/hooks`

### Internationalization

- Uses Paraglide for i18n with base locale "en" and support for "zh"
- Message files in `messages/{locale}.json`
- Generated runtime files in `src/lib/paraglide/`

### Testing Setup

- **Unit Tests**: Vitest with browser environment using Playwright
- **E2E Tests**: Playwright with test directory in `e2e/`
- **Test Patterns**:
  - Svelte component tests: `*.svelte.{test,spec}.{js,ts}`
  - Server tests: `*.{test,spec}.{js,ts}` (excluding svelte tests)

### Styling

- Tailwind CSS v4 with Vite plugin
- Base color scheme: slate
- CSS file: `src/app.css`

## Key Configuration Files

- `svelte.config.js`: SvelteKit configuration with Node adapter and mdsvex
- `vite.config.ts`: Vite configuration with Paraglide, Tailwind, and test setup
- `components.json`: shadcn-svelte configuration
- `project.inlang/settings.json`: Paraglide i18n configuration

## Coding Standards and Requirements

### Code Documentation

- **MANDATORY**: Every line of code must include bilingual comments in both English and Chinese
- Comments should follow the format: `// English description | 中文描述`
- This ensures accessibility for the widest global audience

### Internationalization (i18n)

- **MANDATORY**: All user-facing text and UI copy must support both English and Chinese languages
- **ALWAYS** use Paraglide i18n system for all text content - never use manual state management for language switching
- **NEVER** hardcode user-facing strings in components

#### Complete i18n Implementation Guide

**1. Define Messages in JSON Files:**

```json
// messages/en.json
{
  "page_title": "Internationalization Example",
  "greeting_with_name": "Hello, {name}! Welcome to our application.",
  "button_text": "Click Me",
  "item_count": "You have {count} {count, plural, =0 {items} =1 {item} other {items}}"
}

// messages/zh.json
{
  "page_title": "国际化示例",
  "greeting_with_name": "你好，{name}！欢迎使用我们的应用程序。",
  "button_text": "点击我",
  "item_count": "您有 {count} 个项目"
}
```

**2. Create Reactive Locale Store (`src/lib/stores/locale.ts`):**

```typescript
import { writable } from 'svelte/store';
import { getLocale, setLocale as paraglidetSetLocale } from '$lib/paraglide/runtime';
import { browser } from '$app/environment';

// Read language preference directly from cookie to avoid initialization jumps
function getLocaleFromCookie(): 'en' | 'zh' {
	if (!browser) return 'en';

	try {
		const cookieMatch = document.cookie.match(/PARAGLIDE_LOCALE=([^;]+)/);
		const cookieLocale = cookieMatch?.[1];

		if (cookieLocale === 'zh' || cookieLocale === 'en') {
			return cookieLocale;
		}

		const paraglidLocale = getLocale();
		return paraglidLocale === 'zh' || paraglidLocale === 'en' ? paraglidLocale : 'en';
	} catch {
		return 'en';
	}
}

export const currentLocale = writable<'en' | 'zh'>(getLocaleFromCookie());

export function setLocale(locale: 'en' | 'zh') {
	paraglidetSetLocale(locale, { reload: false });
	currentLocale.set(locale);
}
```

**3. Correct i18n Pattern in Components:**

```typescript
<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import { currentLocale, setLocale } from '$lib/stores/locale';

  // Component state
  let userName = $state('Claude');
  let selectedItem = $state('example');

  // ONLY use reactive variables for <svelte:head> content
  let pageTitle = $state('');

  // Update ONLY page title when locale changes
  $effect(() => {
    $currentLocale; // Depend on locale state
    pageTitle = m.page_title();
  });

  function switchLanguage(locale: 'en' | 'zh') {
    setLocale(locale);
  }
</script>

<!-- Reactive page title -->
<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<!-- IMPORTANT: Direct usage of m.xxx() in templates -->
<div>
  <!-- ✅ CORRECT: Direct message function calls -->
  <h1>{m.page_title()}</h1>
  <p>{m.greeting_with_name({ name: userName })}</p>
  <span>{m.status_label()}: {m.status_active()}</span>

  <!-- ❌ WRONG: Don't store messages in reactive variables -->
  <!-- let title = $state(''); -->
  <!-- $effect(() => { title = m.page_title(); }); -->
  <!-- <h1>{title}</h1> -->

  <!-- Language switcher -->
  <button
    onclick={() => switchLanguage('en')}
    class:active={$currentLocale === 'en'}
  >
    English
  </button>
  <button
    onclick={() => switchLanguage('zh')}
    class:active={$currentLocale === 'zh'}
  >
    中文
  </button>
</div>
```

**3.1. Global i18n Layout Setup:**

The `{#key $currentLocale}` block should ONLY be used once at the top level in `+layout.svelte`:

```typescript
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import { currentLocale } from '$lib/stores/locale';
  let { children } = $props();
</script>

<!-- Global i18n key for reactive updates -->
{#key $currentLocale}
  {@render children()}
{/key}
```

**4. Key Implementation Rules:**

- **Message Functions**: Always use `m.message_key()` directly in templates - DO NOT store in reactive variables
- **Parameters**: Use `m.message_key({ param: value })` for dynamic content
- **Language Switching**: Use custom `setLocale('en'|'zh')` from store (not Paraglide's directly)
- **No Page Refresh**: `{ reload: false }` preserves component state during language changes
- **Global Re-render**: Use `{#key $currentLocale}` ONLY in `+layout.svelte` at the root level
- **Page Titles**: ONLY use reactive `$effect()` pattern for `<svelte:head>` content
- **Stable Initialization**: Read from cookie directly to avoid locale "jumps" on page load
- **Performance**: Direct message function calls are more efficient than reactive variables

**Best Practices:**

✅ **DO:**

- Use `m.xxx()` directly in templates
- Use `{#key $currentLocale}` only in `+layout.svelte`
- Keep reactive variables only for `<svelte:head>` content
- Use dynamic functions for arrays: `getFeatures()` instead of `features = $state([])`

❌ **DON'T:**

- Store i18n messages in `$state()` variables
- Use multiple `{#key $currentLocale}` blocks in components
- Create unnecessary `$effect()` functions for i18n updates
- Use `{#each}` with reactive i18n arrays - use functions instead

**5. Supported Locales:**

- **English (en)**: Base locale, messages in `messages/en.json`
- **Chinese (zh)**: Secondary locale, messages in `messages/zh.json`
- **Configuration**: Defined in `project.inlang/settings.json` as `["en", "zh"]`

### Theme Support

- **MANDATORY**: Every component must support both light and dark theme modes
- Use consistent theme variables and CSS custom properties
- Follow shadcn-svelte theming patterns with Tailwind CSS v4
- Ensure proper contrast ratios in both themes

### Testing Requirements

- **MANDATORY**: Every component requires comprehensive testing coverage:

#### 1. Function Unit Tests

- Test all public functions with multiple input scenarios
- Test edge cases and error handling
- Use Vitest framework following project patterns

#### 2. Class Unit Tests

- Test all public methods and properties
- Test constructor behavior and state management
- Mock dependencies appropriately

#### 3. UI E2E Tests

- Test user interactions and workflows
- Test responsive behavior across different screen sizes
- Test theme switching functionality
- Test i18n language switching
- Use Playwright framework in `e2e/` directory

### Code Quality Enforcement

- All code must pass `pnpm lint` and `pnpm check` before submission
- Follow TypeScript strict mode requirements
- Use Svelte 5 runes syntax consistently
- Maintain consistent code formatting with `pnpm format`

### Git Commit Standards

- **MANDATORY**: All commit messages must be written in English
- Follow conventional commit format: `type: description`
- Use present tense and imperative mood (e.g., "fix", "add", "update")
- Keep commit messages concise and descriptive
- Examples:
  - `fix: resolve network editing persistence issue`
  - `feat: add RPC URL validation with chain ID verification`
  - `refactor: improve BigInt serialization with ox library`
  - `docs: update component usage guidelines`

### Component Development Checklist

Before considering any component complete, ensure:

- [ ] Bilingual comments on every line
- [ ] Full i18n support with English/Chinese text
- [ ] Light/dark theme compatibility
- [ ] Unit tests for all functions/classes
- [ ] E2E tests for UI interactions
- [ ] Proper TypeScript typing
- [ ] Responsive design implementation

## Token Optimization and Development Efficiency Guidelines

### Core Principles

1. **Understand Before Implementing** | 实现前先理解
   - Analyze requirements thoroughly before coding
   - Search and verify existing components/patterns first
   - Design interfaces and contracts before implementation
   - Write minimal, reusable code that passes tests

2. **Development Workflow** | 开发工作流程

   ```
   Analyze → Search Existing → Design Interface → Implement → Test
      ↓          ↓                  ↓              ↓          ↓
   Understand  Reuse Code    Define Contracts  Minimal Code  Verify
   ```

3. **Token-Efficient Strategies** | Token 节省策略
   - **Batch Operations**: Read multiple related files in one request
   - **Precise Searches**: Use specific patterns instead of broad searches
   - **Incremental Edits**: Modify only necessary parts, avoid full rewrites
   - **Reuse Testing**: Adapt existing test templates rather than creating new

4. **Common Error Prevention** | 常见错误预防

   #### ✅ Correct i18n Usage:

   ```typescript
   // Direct usage in templates
   <p>{m.greeting()}</p>
   ```

   #### ❌ Wrong i18n Usage:

   ```typescript
   // Never store in reactive state
   let greeting = $state('');
   $effect(() => {
   	greeting = m.greeting();
   });
   ```

   #### Component Import Verification:

   ```typescript
   // Always verify component exists before importing
   import { Dialog } from '$lib/components/ui/dialog'; // Check path first
   ```

5. **Expert Thinking Pattern** | 专家思维模式

   ```
   Problem → Abstract → Pattern → Implementation
      ↓        ↓         ↓            ↓
   Specific  Generalize  Best Practice  Minimal Code
   ```

6. **Code Quality Standards** | 代码质量标准
   - Define interfaces first, implementation second
   - Create reusable, tested components as foundation
   - Maintain interface contracts even when implementation changes
   - Run tests and linting before considering task complete

7. **Efficient Request Patterns** | 高效请求模式
   - Reference existing components: "Based on [component], implement [feature]"
   - Specify reuse: "Reuse pattern from [file path]"
   - Maintain compatibility: "Keep compatible with [interface name]"
   - Provide clear constraints and examples in requests

8. **Implementation Checklist** | 实现检查清单
   - [ ] Search and verify before creating new files
   - [ ] Use MultiEdit for batch modifications
   - [ ] Write interface and tests before implementation
   - [ ] Follow CLAUDE.md standards strictly
   - [ ] Validate with lint and type checking
