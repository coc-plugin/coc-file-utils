import { commands, ExtensionContext, listManager, workspace } from 'coc.nvim';
import DirList from './dir';
import { deleteFile } from './util/file';
import { createPrompt } from './util/ui';
export async function activate(context: ExtensionContext): Promise<void> {
  context.subscriptions.push(
    listManager.registerList(new DirList()),
    commands.registerCommand('coc-file-utils.deleteFile', async () => {
      const file = (await workspace.document).uri;
      const status = await createPrompt('Are you sure you want to delete this file?');
      if (status) {
        deleteFile(file.split('file://')[1]);
      }
    })
  );
}
