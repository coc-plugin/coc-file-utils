import { commands, ExtensionContext, listManager, workspace } from 'coc.nvim';
import DirsList from './dirs';
import { deleteFile, renameFile } from './util/file';
import { createPrompt } from './util/ui';
import { getConfigItem } from './config';
import { createInput } from './util/ui';
export async function activate(context: ExtensionContext): Promise<void> {
  const enable = getConfigItem('enable', true);
  if (!enable) {
    return;
  }
  context.subscriptions.push(
    listManager.registerList(new DirsList()),
    commands.registerCommand('coc-file-utils.rename', async () => {
      const file = (await workspace.document).uri;
      const newName = await createInput('Enter the new name for the file:');
      if (!newName || newName == 'outPut') return;
      const status = await createPrompt('Are you sure you want to rename this file?');
      if (status) {
        renameFile(file.split('file://')[1], newName);
      }
    }),
    commands.registerCommand('coc-file-utils.delete', async () => {
      const file = (await workspace.document).uri;
      const status = await createPrompt('Are you sure you want to delete this file?');
      if (status) {
        deleteFile(file.split('file://')[1]);
      }
    })
  );
}
