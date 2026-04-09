import { ChildProcess, spawn } from 'child_process';
import { BasicList, ListContext, ListTask, Location, Range, Uri, workspace } from 'coc.nvim';
import { EventEmitter } from 'events';
import fs from 'fs';
import * as minimatch from 'minimatch';
import path from 'path';
import readline from 'readline';
import { executable, generateFolders } from './util';
import { Transform } from 'stream';
import { createInput, createPrompt } from './util/ui';
import { create, deleteDir, deleteFile, renameDir, renameFile } from './util/file';

class Task extends EventEmitter implements ListTask {
  private processes: ChildProcess[] = [];
  private seen: Set<string> | null = null;
  constructor() {
    super();
    this.processes = [];
    this.seen = null;
  }
  public start(cmd: string, args: string[], cwds: string[], patterns: string[]): void {
    let remain = cwds.length;
    let config = workspace.getConfiguration('list.source.files');
    let filterByName = config.get<boolean>('filterByName', false);
    const that = this;
    if (!that.seen) {
      that.seen = new Set<string>();
    } else {
      that.seen.clear();
    }
    for (let cwd of cwds) {
      let process = spawn(cmd, args, { cwd });
      process.stdout.push('/\n');
      const formatter = new Transform({
        objectMode: false,
        transform(chunk, _encoding, callback) {
          let text = chunk.toString();
          const paths = generateFolders(text);
          paths.forEach((p) => {
            if (that.seen && !that.seen.has(p)) {
              that.seen.add(p);
              this.push(p + '\n');
            }
          });
          callback();
        },
      });
      process.stdout.pipe(formatter);
      process.on('error', (e) => {
        this.emit('error', e.message);
      });
      const rl = readline.createInterface({
        input: formatter,
        crlfDelay: Infinity,
      });
      this.processes.push(process);
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

export default class FilesList extends BasicList {
  public readonly name = 'filemanager';
  public readonly defaultAction = 'open';
  public description = 'File manager';
  public readonly detail = `File manager with full support for files and directories.
Features:
- Browse files and folders
- Create, delete, rename, copy and move
- Quick create inside folders
- Split screen support

Use -folder or -workspace to change search scope.`;
  public args: string[] = [];
  public options = [
    {
      name: '-F, -folder',
      description: 'Search files from current workspace folder instead of cwd.',
    },
    {
      name: '-W, -workspace',
      description: 'Search files from all workspace folders instead of cwd.',
    },
  ];

  isDir(path: string): boolean {
    try {
      return fs.lstatSync(path).isDirectory();
    } catch (e) {
      return false;
    }
  }

  constructor() {
    super();
    this.addAction('rename', async (item) => {
      if (!item.sortText) return;
      const isDirectory = this.isDir(item.sortText);
      let name: string;
      let newName: string;
      if (isDirectory) {
        name = path.dirname(item.sortText);
        newName = await createInput('Enter the new name of this dir', name);
      } else {
        name = path.basename(item.sortText);
        newName = await createInput('Enter the new name of this file', name);
      }
      if (!newName || newName === 'outPut') return;
      const confirm = await createPrompt(`Are you sure you want to rename ${name} to ${newName}?`);
      if (confirm) {
        if (isDirectory) {
          renameDir(item.sortText, newName);
        } else {
          renameFile(item.sortText, newName);
        }
      }
    });
    this.addAction('copy', async (item) => {
      if (!item.sortText) return;
      const isDirectory = this.isDir(item.sortText);
      const level = isDirectory ? 'dir' : 'file';
      this.nvim.command(`CocList dirs --type=copy --level=${level} --input=${item.sortText}`);
    });
    this.addAction('move', async (item) => {
      if (!item.sortText) return;
      const isDirectory = this.isDir(item.sortText);
      const level = isDirectory ? 'dir' : 'file';
      this.nvim.command(`CocList dirs --type=move --level=${level} --input=${item.sortText}`);
    });
    this.addAction('delete', async (item) => {
      if (!item.sortText) return;
      const isDirectory = this.isDir(item.sortText);
      const confirm = await createPrompt(`Are you sure you want to delete ${item.sortText}?`);
      if (confirm) {
        if (isDirectory) {
          deleteDir(item.sortText);
        } else {
          deleteFile(item.sortText);
        }
      }
    });
    this.addAction('open', async (item) => {
      if (!item.sortText) return;
      const isDirectory = this.isDir(item.sortText);
      if (isDirectory) {
        const fileName = await createInput(
          'Enter the dir/file name to be created. Dirs end with "/" . separated with "," .'
        );
        if (!fileName || fileName === 'outPut' || !item.sortText) return;
        create(item.sortText, fileName);
      } else {
        this.nvim.command(`:e ${item.sortText}`);
      }
    });
    this.addAction('vsplit', async (item) => {
      if (!item.sortText) return;
      this.nvim.command(`:vsplit ${item.sortText}`);
    });
    this.addAction('split', async (item) => {
      if (!item.sortText) return;
      this.nvim.command(`:split ${item.sortText}`);
    });
  }

  private getArgs(args: string[], defaultArgs: string[]): string[] {
    return args.length ? args : defaultArgs;
  }

  public getCommand(): { cmd: string; args: string[] } {
    let config = workspace.getConfiguration('list.source.files');
    let cmd = config.get<string>('command', '');
    let args = config.get<string[]>('args', []);
    if (!cmd) {
      if (executable('rg')) {
        return { cmd: 'rg', args: this.getArgs(args, ['--color', 'never', '--files']) };
      } else if (executable('ag')) {
        return { cmd: 'ag', args: this.getArgs(args, ['-f', '-g', '.', '--nocolor']) };
      } else if (process.platform == 'win32') {
        return { cmd: 'dir', args: this.getArgs(args, ['/a-D', '/S', '/B']) };
      } else if (executable('find')) {
        return { cmd: 'find', args: this.getArgs(args, ['.', '-type', 'f']) };
      } else {
        throw new Error('Unable to find command for files list.');
      }
    } else {
      return { cmd, args };
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
    this.args = args;
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
