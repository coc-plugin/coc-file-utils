import { nvim } from 'coc.nvim';

export async function closeDirBuffers(dir: string) {
  const folder = dir.endsWith('/') ? dir : dir + '/';
  await nvim.command('autocmd! FileChangedShell *');
  const cmd = `
    let folder = '${folder}'
    for i in range(1, bufnr('$'))
      if bufexists(i) && bufname(i) =~# '^' . escape(folder, '~^$.*?[]~/\\')
        execute 'bdelete! ' . i
      endif
    endfor
  `;

  try {
    await nvim.command(cmd);
  } catch (e) {
    console.error('closeDirBuffers error:', e);
  }
  await nvim.command('doautocmd FileChangedShell');
}

export async function closeFileBuffer(filePath: string) {
  const cmd = `bdelete! ${filePath}`;
  try {
    await nvim.command(cmd);
  } catch (e) {
    console.error('closeFileBuffer error:', e);
  }
}
