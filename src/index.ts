import { commands, ExtensionContext, listManager, nvim, workspace } from 'coc.nvim';
import DirsList from './dirs';
import FilemanagerList from './filemanager';
import { getConfigItem } from './config';
import { dirname } from 'path';
async function getEscapedPath() {
  const relativePath = (await workspace.nvim.call('expand', ['%:.'])) as string;
  if (relativePath && relativePath.length > 0) {
    return (await workspace.nvim.call('escape', [relativePath, ' \\|*?[]{}$'])) as string;
  } else {
    return null;
  }
}
export async function activate(context: ExtensionContext): Promise<void> {
  const enable = getConfigItem('enable', true);
  if (!enable) {
    return;
  }
  context.subscriptions.push(
    listManager.registerList(new DirsList()),
    listManager.registerList(new FilemanagerList()),
    commands.registerCommand('file-utils.open', async () => {
      const escapedPath = await getEscapedPath();
      if (escapedPath) {
        nvim.command(
          `CocList --input=${dirname(escapedPath)}/ filemanager --filePath=${escapedPath}`
        );
      } else {
        nvim.command(`CocList filemanager`);
      }
    }),
    commands.registerCommand('file-utils.openCwd', () => {
      nvim.command('CocList filemanager');
    }),
    commands.registerCommand('file-utils.openGit', async () => {
      nvim.command('CocList filemanager -G');
    })
  );
}
