# AGENTS.md - coc-file-utils Development Guide

This document provides guidelines for agentic coding assistants working on the coc-file-utils project.

## Project Overview

coc-file-utils is a Coc.nvim extension for file management operations (create, copy, move, rename, delete files and folders). It provides a file manager interface within Neovim/Vim with Coc integration.

## Build Commands

### Development
```bash
npm run watch      # Build and watch for changes (development)
npm run build      # Build once (production)
npm run prepare    # Build for distribution (runs on npm install)
```

### TypeScript Compilation
- TypeScript configuration: `tsconfig.json`
- Target: ES2017 with CommonJS modules
- Strict mode enabled (except `noImplicitAny: false`)
- Source maps enabled
- Output directory: `lib/`

### Build System
- Uses esbuild for fast bundling (`esbuild.mjs`)
- External dependency: `coc.nvim` (not bundled)
- Platform: Node.js 18+
- Minification in production mode

## Testing

**Note:** This project currently has no test suite. When adding new features or fixing bugs:

1. Test manually in a Coc.nvim environment
2. Verify file operations work correctly
3. Check that the extension integrates properly with Coc lists

If adding tests in the future:
- Use Jest or similar testing framework
- Mock file system operations
- Test utility functions independently

## Code Style Guidelines

### Imports
```typescript
// External modules first, then internal
import { ChildProcess, spawn } from 'child_process';
import {
  BasicList,
  ListContext,
  ListTask,
  Location,
  Range,
  Uri,
  window,
  workspace,
} from 'coc.nvim';
import { EventEmitter } from 'events';
import fs from 'fs';
import * as minimatch from 'minimatch';
import path, { dirname } from 'path';
import readline from 'readline';
import { executable, findGitRoot, generateFolders, getEscapedPath } from './util';
```

- Group imports: Node.js builtins, external dependencies, coc.nvim API, internal modules
- Use destructured imports for coc.nvim API
- Import types and values separately when appropriate
- Use relative paths for internal modules (`./util`, `./config`)

### Naming Conventions
- **Classes**: PascalCase (`FilesList`, `Task`)
- **Variables/Functions**: camelCase (`getEscapedPath`, `findGitRoot`)
- **Constants**: UPPER_SNAKE_CASE (not currently used)
- **Interfaces/Types**: PascalCase
- **Files**: kebab-case or camelCase (`filemanager.ts`, `dirs.ts`)

### TypeScript Usage
- Use explicit types for function parameters and return values
- Use `interface` for object shapes
- Use `type` for unions, intersections, and aliases
- Enable strict mode but allow implicit any (`noImplicitAny: false`)
- Use `async/await` for asynchronous operations
- Handle promises with try/catch blocks

### Error Handling
```typescript
try {
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(filePath, '');
  await nvim.command(`edit ${filePath}`);
  window.showInformationMessage(`File created: ${filePath}`);
} catch (err: any) {
  window.showErrorMessage(`Failed to create ${name}: ${err.message}`);
}
```

- Always wrap file operations in try/catch blocks
- Show user-friendly error messages via `window.showErrorMessage`
- Show success messages via `window.showInformationMessage`
- Check for specific error codes (e.g., `ENOENT` for missing files)

### File Operations Pattern
```typescript
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      window.showErrorMessage(`Not a file: ${filePath}`);
      return;
    }

    await closeFileBuffer(filePath).catch(() => {});
    await fs.unlink(filePath);

    window.showInformationMessage(`File deleted: ${filePath}`);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      window.showErrorMessage(`File does not exist: ${filePath}`);
    } else {
      window.showErrorMessage(`Failed to delete file: ${err.message}`);
    }
  }
}
```

- Always validate file/directory type before operations
- Close buffers before deleting/moving files
- Use `fs/promises` API for async operations
- Handle recursive operations appropriately

### Coc.nvim Integration
- Use `window`, `workspace`, `nvim` from `coc.nvim` imports
- Register commands in `activate()` function
- Use `ListManager` for file/directory lists
- Follow Coc extension patterns for configuration and commands

### Configuration
- Configuration keys: `coc-file-utils.enabled`, `coc-file-utils.excludePatterns`
- Use `getConfigItem()` helper from `./config`
- Default values should match package.json configuration schema

### Utility Functions
- Keep utility functions in `src/util/` directory
- Export from `src/util/index.ts` for easy importing
- Document complex utility functions
- Use pure functions when possible

### Code Organization
```
src/
├── index.ts              # Extension activation point
├── config.ts             # Configuration helpers
├── filemanager.ts        # Main file manager list
├── dirs.ts               # Directory list for copy/move operations
└── util/
    ├── index.ts          # Utility exports
    ├── file.ts           # File operations
    ├── ui.ts             # UI helpers (input, prompt)
    └── buffer.ts         # Buffer management
```

## Development Workflow

1. **Setup**: `npm install` or `pnpm install`
2. **Development**: `npm run watch` (auto-rebuild on changes)
3. **Testing**: Manual testing in Coc.nvim environment
4. **Building**: `npm run build` for production

## Adding New Features

1. **File Operations**: Add to `src/util/file.ts` with proper error handling
2. **UI Actions**: Add to appropriate list class (`filemanager.ts` or `dirs.ts`)
3. **Commands**: Register in `src/index.ts` `activate()` function
4. **Configuration**: Update `package.json` `contributes.configuration` if needed

## Common Patterns

### Creating List Actions
```typescript
this.addAction('action-name', async (item) => {
  if (!item.sortText) return;
  // Implementation
});
```

### File System Validation
```typescript
const stat = await fs.stat(path);
if (!stat.isFile()) {
  window.showErrorMessage(`Not a file: ${path}`);
  return;
}
```

### User Prompts
```typescript
import { createInput, createPrompt } from './util/ui';

const newName = await createInput('Enter the new name', defaultValue);
const confirm = await createPrompt('Are you sure?');
```

### Path Handling
- Use `path` module for cross-platform compatibility
- Handle Windows path separators (`\\` vs `/`)
- Use `path.relative()` for relative paths
- Use `path.basename()` and `path.dirname()` as needed

## Linting and Formatting

Currently no linting configuration. When adding:
- Use TypeScript compiler for type checking
- Consider adding ESLint with TypeScript support
- Use Prettier for code formatting

## Commit Guidelines

- Use conventional commit messages
- Reference issues when applicable
- Keep commits focused on single changes
- Test changes before committing

## Extension Publishing

- Version follows semver in `package.json`
- Build with `npm run prepare` before publishing
- Update README.md with new features/changes
- Test in actual Coc.nvim environment

## Notes for Agentic Assistants

- This is a Coc.nvim extension, not a standalone application
- All code runs within the Coc.nvim context
- File operations affect the user's actual file system
- Be careful with recursive operations and error handling
- Always provide user feedback via Coc.nvim notifications
- Follow existing patterns in the codebase