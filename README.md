# coc-file-utils

The best way to create, copy, move, rename and delete file and folder

## Install

`:CocInstall coc-file-utils`

## Configuration options

- `coc-file-utils.enabled`: Enable coc-file-utils extension, default: `true`
- `coc-file-utils.excludePatterns`: Glob patterns to exclude files and folders from file operations, default : `["**/node_modules/**","**/.git/**"]`.

## Lists

`:CocList filemanager`

## F.A.Q

Q: How to select the current file by default?

A: Create custom keymap like:

```lua
vim.keymap.set('n', '<leader>n', function()
  local relative_path = vim.fn.expand('%:.')
  local cmd = 'CocList filemanager'
  if relative_path and relative_path ~= '' then
    local escaped_path = vim.fn.escape(relative_path, ' \\|*?[]{}$')
    cmd = 'CocList --input=' .. escaped_path .. ' filemanager'
  end
  vim.cmd(cmd)
end, { desc = 'Filemanager with optional relative path input' })
```

Q: How to select the directory where the current file is located by default?

A: Create custom keymap like:

```lua
vim.keymap.set('n', '<leader>n', function()
  local relative_dir = vim.fn.expand('%:.:h')
  local cmd = 'CocList filemanager'
  if relative_dir and relative_dir ~= '' then
    local escaped_dir = vim.fn.escape(relative_dir, ' \\|*?[]{}$')
    cmd = 'CocList --input=' .. escaped_dir .. ' filemanager'
  end
  vim.cmd(cmd)
end, { desc = 'Filemanager with current directory input' })
```

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
