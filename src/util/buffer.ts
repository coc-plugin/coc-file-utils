import { nvim } from 'coc.nvim';

export async function closeDirBuffers(dir: string) {
  nvim.command(`:silent! bufdo if stridx(expand('%:p'), ${dir}) != -1 | bw! | endif`);
}
