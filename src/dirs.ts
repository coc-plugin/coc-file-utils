import { ChildProcess, spawn } from 'child_process';
import { BasicList, ListContext, ListTask, Location, Range, Uri, workspace } from 'coc.nvim';
import { EventEmitter } from 'events';
import fs from 'fs';
import * as minimatch from 'minimatch';
import path from 'path';
import readline from 'readline';
import { createInput, createPrompt } from './util/ui';
import { create, deleteDir, moveFile, copyFile, renameDir } from './util/file';
import { executable } from './util';

class Task extends EventEmitter implements ListTask {
  private processes: ChildProcess[] = [];

  public start(cmd: string, args: string[], cwds: string[], patterns: string[]): void {
    let remain = cwds.length;
    let config = workspace.getConfiguration('list.source.files');
    let filterByName = config.get<boolean>('filterByName', false);
    for (let cwd of cwds) {
      let process = spawn(cmd, args, { cwd });
      this.processes.push(process);
      process.on('error', (e) => {
        this.emit('error', e.message);
      });
      const rl = readline.createInterface(process.stdout);
      const range = Range.create(0, 0, 0, 0);
      let hasPattern = patterns.length > 0;
      process.stderr.on('data', (chunk) => {
        console.error(chunk.toString('utf8')); // tslint:disable-line
      });

      rl.on('line', (line) => {
        let file = line;
        if (file.indexOf(cwd) < 0) {
          file = path.join(cwd, line);
        }
        if (hasPattern && patterns.some((p) => minimatch.minimatch(file, p))) return;
        let location = Location.create(Uri.file(file).toString(), range);
        if (!filterByName) {
          this.emit('data', {
            label: line,
            sortText: file,
            location,
          });
        } else {
          let name = path.basename(file);
          this.emit('data', {
            label: `${name}\t${line}`,
            sortText: file,
            filterText: name,
            location,
          });
        }
      });
      rl.on('close', () => {
        remain = remain - 1;
        if (remain == 0) {
          this.emit('end');
        }
      });
    }
  }

  public dispose(): void {
    for (let process of this.processes) {
      if (!process.killed) {
        process.kill();
      }
    }
  }
}

export default class DirsList extends BasicList {
  public name = 'dirs';
  public readonly defaultAction = 'create(dir/file)';
  public description = 'List all dirs in current workspace';
  constructor() {
    super();
    this.addAction('move to', async (item) => {
      if (!item.sortText) return;
      const file = (await workspace.document).uri;
      const confirm = await createPrompt(
        `Are you sure you want to move this file to ${item.sortText}?`
      );
      if (confirm) {
        moveFile(file.split('file://')[1], item.sortText);
      }
    });
    this.addAction('rename', async (item) => {
      if (!item.sortText) return;
      const newName = await createInput('Enter the new name of this dir');
      if (!newName || newName === 'outPut') return;
      const confirm = await createPrompt(`Are you sure you want to rename this dir to ${newName}?`);
      if (confirm) {
        renameDir(item.sortText, newName);
      }
    });
    this.addAction('copy to', async (item) => {
      if (!item.sortText) return;
      const file = (await workspace.document).uri;
      copyFile(file.split('file://')[1], item.sortText);
    });
    this.addAction('delete', async (item) => {
      if (!item.sortText) return;
      const confirm = await createPrompt(`Are you sure you want to delete ${item.sortText}?`);
      if (confirm) {
        deleteDir(item.sortText);
      }
    });
    this.addAction('create(dir/file)', async (item) => {
      const fileName = await createInput(
        'Enter the dir/file name to be created. Dirs end with "/" . separated with "," .'
      );
      if (!fileName || fileName === 'outPut' || !item.sortText) return;
      create(item.sortText, fileName);
    });
  }

  public getCommand(): { cmd: string; args: string[] } {
    if (executable('fd')) {
      return { cmd: 'fd', args: ['--color', 'never', '--type', 'directory'] };
    } else {
      throw new Error('Unable to find command for dirs list.');
    }
  }

  public async loadItems(context: ListContext): Promise<ListTask | null> {
    let { nvim } = this;
    let { window, args } = context;
    let options = this.parseArguments(args);
    let res = this.getCommand();
    if (!res) return null;
    let used = res.args.concat(['-F', '-folder', '-W', '-workspace']);
    let extraArgs = args.filter((s) => used.indexOf(s) == -1);
    let cwds: string[];
    let dirArgs: string[] = [];
    let searchArgs: string[] = [];
    if (options.folder) {
      cwds = [workspace.root];
    } else if (options.workspace) {
      cwds = workspace.workspaceFolders.map((f) => Uri.parse(f.uri).fsPath);
    } else {
      if (extraArgs.length > 0) {
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < extraArgs.length; i++) {
          let d = (await nvim.call('expand', extraArgs[i])) as string;
          try {
            if (fs.lstatSync(d).isDirectory()) {
              dirArgs.push(d);
            } else {
              searchArgs.push(d);
            }
          } catch (e) {
            searchArgs.push(d);
          }
        }
      }
      if (dirArgs.length > 0) {
        cwds = dirArgs;
      } else {
        let valid = await window.valid;
        if (valid) {
          cwds = [(await nvim.call('getcwd', window.id)) as string];
        } else {
          cwds = [(await nvim.call('getcwd')) as string];
        }
      }
    }
    let task = new Task();
    let excludePatterns = this.getConfig().get<string[]>('excludePatterns', []);
    task.start(res.cmd, res.args.concat(searchArgs), cwds, excludePatterns);
    return task;
  }

  public doHighlight(): void {
    let config = workspace.getConfiguration('list.source.files');
    let filterByName = config.get<boolean>('filterByName', false);
    if (filterByName) {
      let { nvim } = this;
      nvim.pauseNotification();
      nvim.command('syntax match CocFilesFile /\\t.*$/ contained containedin=CocFilesLine', true);
      nvim.command('highlight default link CocFilesFile Comment', true);
      nvim.resumeNotification(false, true);
    }
  }
}
