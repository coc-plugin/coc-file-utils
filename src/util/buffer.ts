import { nvim } from 'coc.nvim';

export async function closeDirBuffers(dir: string) {
  const folder = dir.endsWith('/') ? dir : dir + '/';
  await nvim.command('autocmd! FileChangedShell *');
  const luaCode = `
    local folder = "${folder}"
    for _, bufnr in ipairs(vim.api.nvim_list_bufs()) do
      local name = vim.api.nvim_buf_get_name(bufnr)
      if name and name:find(folder, 1, true) then
          pcall(vim.api.nvim_buf_delete, bufnr, { force = true })
      end
    end
  `;
  try {
    await nvim.lua(luaCode);
  } catch (e) {
    console.error('closeDirBuffers error:', e);
  }
  await nvim.command('doautocmd FileChangedShell');
}

export async function closeFileBuffer(filePath: string) {
  const luaCode = `
    local filePath = "${filePath}"
    for _, bufnr in ipairs(vim.api.nvim_list_bufs()) do
      local name = vim.api.nvim_buf_get_name(bufnr)
      if name and name == filePath then
          pcall(vim.api.nvim_buf_delete, bufnr, { force = true })
          break
      end
    end
  `;
  try {
    await nvim.lua(luaCode);
  } catch (e) {
    console.error('closeFileBuffer error:', e);
  }
}
