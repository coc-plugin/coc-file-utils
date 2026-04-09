import { ChildProcess, spawn } from 'child_process';
import {
  BasicList,
  ListContext,
  ListTask,
  Location,
  Range,
  Uri,
  window,
  workspace,
} from 'coc.nvim';
import { EventEmitter } from 'events';
import fs from 'fs';
import * as minimatch from 'minimatch';
import path from 'path';
import readline from 'readline';
import { executable } from './util';
import { createPrompt } from './util/ui';
import { copyDir, copyFile, moveDir, moveFile } from './util/file';

class Task extends EventEmitter implements ListTask {
  private processes: ChildProcess[] = [];

  public start(cmd: string, args: string[], cwds: string[], patterns: string[]): void {
    let remain = cwds.length;
    for (let cwd of cwds) {
      let process = spawn(cmd, args, { cwd });
      process.stdout.push('/\n');
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
        this.emit('data', {
          label: line,
          sortText: file,
          location,
        });
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

export default class FilesList extends BasicList {
  public name = 'dirs';
  public readonly defaultAction = 'open';
  public description = 'move or copy';
  public args: string[] = [];

  constructor() {
    super();
    this.addAction('open', async (item) => {
      if (this.args.some((a) => a.includes('--input'))) {
        const value = this.args.find((a) => a.includes('--input'))?.split('=')[1];
        const type = this.args.find((a) => a.includes('--type'));
        const level = this.args.find((a) => a.includes('--level'))?.split('=')[1];
        if (type && value && type.includes('move')) {
          if (level && level == 'file') {
            const confirm = await createPrompt(
              `Are you sure you want to move ${value} to ${item.sortText}?`
            );
            if (confirm) {
              moveFile(value!, item.sortText!);
            }
          }
          if (level && level == 'dir') {
            const confirm = await createPrompt(
              `Are you sure you want to move ${value} to ${item.sortText}?`
            );
            if (confirm) {
              moveDir(value!, item.sortText!);
            }
          }
        }
        if (type && value && type.includes('copy')) {
          if (level && level == 'file') {
            const confirm = await createPrompt(
              `Are you sure you want to copy ${value} to ${item.sortText}?`
            );
            if (confirm) {
              copyFile(value!, item.sortText!);
            }
          }
          if (level && level == 'dir') {
            const confirm = await createPrompt(
              `Are you sure you want to copy ${value} to ${item.sortText}?`
            );
            if (confirm) {
              copyDir(value!, item.sortText!);
            }
          }
        }
      } else {
        window.showErrorMessage('Invalid action, missing --input and --type arguments', 'error');
        return;
      }
    });
  }

  public getCommand(): { cmd: string; args: string[] } {
    if (executable('fd')) {
      return { cmd: 'fd', args: ['--color', 'never', '--type', 'directory', '-H'] };
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
    this.args = args;
    let extraArgs = [];
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
    const excludePatterns = ['**/node_modules/**', '**/.git/**'];
    task.start(res.cmd, res.args.concat(searchArgs), cwds, excludePatterns);
    return task;
  }

  public doHighlight(): void {
    let { nvim } = this;
    nvim.pauseNotification();
    nvim.command('syntax match CocFilesFile /\\t.*$/ contained containedin=CocFilesLine', true);
    nvim.command('highlight default link CocFilesFile Comment', true);
    nvim.resumeNotification(false, true);
  }
}
