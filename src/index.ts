import { commands, ExtensionContext, listManager, nvim } from 'coc.nvim';
import DirsList from './dirs';
import FilemanagerList from './filemanager';
import { getConfigItem } from './config';
import { getEscapedPath } from './util';
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
        nvim.command(`CocList filemanager --filePath=${escapedPath}`);
      } else {
        nvim.command(`CocList filemanager`);
      }
    }),
    commands.registerCommand('file-utils.openCwd', async () => {
      nvim.command(`CocList filemanager`);
    }),
    commands.registerCommand('file-utils.openGit', async () => {
      nvim.command('CocList filemanager -G');
    })
  );
}
