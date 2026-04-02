import { ExtensionContext, listManager } from 'coc.nvim';
import DirsList from './dirs';
import FilesList from './files';
import { getConfigItem } from './config';
export async function activate(context: ExtensionContext): Promise<void> {
  const enable = getConfigItem('enable', true);
  if (!enable) {
    return;
  }
  context.subscriptions.push(
    listManager.registerList(new DirsList()),
    listManager.registerList(new FilesList())
  );
}
