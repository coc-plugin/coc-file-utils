import { commands, ExtensionContext, listManager, workspace } from 'coc.nvim';
import DirsList from './dirs';
import { deleteFile, renameFile, renameDir, deleteDir, create } from './util/file';
import { createPrompt } from './util/ui';
import { getConfigItem } from './config';
import { createInput } from './util/ui';
import { dirname } from 'path';
export async function activate(context: ExtensionContext): Promise<void> {
  const enable = getConfigItem('enable', true);
  if (!enable) {
    return;
  }
  context.subscriptions.push(
    listManager.registerList(new DirsList()),
    commands.registerCommand('file.rename', async () => {
      const file = (await workspace.document).uri;
      if (!file) return;
      const newName = await createInput('Enter the new name for the file:');
      if (!newName || newName == 'outPut') return;
      const status = await createPrompt('Are you sure you want to rename this file?');
      if (status) {
        renameFile(file.split('file://')[1], newName);
      }
    }),
    commands.registerCommand('file.renameDir', async () => {
      const file = (await workspace.document).uri;
      if (!file) return;
      const newName = await createInput('Enter the new name of this dir');
      if (!newName || newName === 'outPut') return;
      const dir = dirname(file.split('file://')[1]);
      const confirm = await createPrompt(`Are you sure you want to rename this dir to ${newName}?`);
      if (confirm) {
        renameDir(dir, newName);
      }
    }),
    commands.registerCommand('file.create', async () => {
      const fileName = await createInput(
        'Enter the dir/file name to be created. Dirs end with "/" . separated with "," .'
      );
      if (!fileName || fileName === 'outPut') return;
      create(process.cwd(), fileName);
    }),
    commands.registerCommand('file.delete', async () => {
      const file = (await workspace.document).uri;
      if (!file) return;
      const status = await createPrompt('Are you sure you want to delete this file?');
      if (status) {
        deleteFile(file.split('file://')[1]);
      }
    }),
    commands.registerCommand('file.deleteDir', async () => {
      const file = (await workspace.document).uri;
      if (!file) return;
      const dir = dirname(file.split('file://')[1]);
      const status = await createPrompt('Are you sure you want to delete this dir?');
      if (status) {
        deleteDir(dir);
      }
    })
  );
}
