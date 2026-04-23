import { workspace } from 'coc.nvim';
import fs from 'fs';
import path from 'path';
import which from 'which';

export function executable(cmd: string): boolean {
  try {
    which.sync(cmd);
  } catch (e) {
    return false;
  }
  return true;
}

export function characterIndex(content: string, byteIndex: number): number {
  let buf = Buffer.from(content, 'utf8');
  return buf.slice(0, byteIndex).toString('utf8').length;
}

export function wait(ms: number): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, ms);
  });
}

export function pad(n: string, total: number): string {
  let l = total - n.length;
  if (l <= 0) return '';
  return new Array(l).fill(' ').join('');
}

export function distinct<T>(array: T[], keyFn?: (t: T) => string): T[] {
  if (!keyFn) {
    return array.filter((element, position) => {
      return array.indexOf(element) === position;
    });
  }

  const seen: { [key: string]: boolean } = Object.create(null);
  return array.filter((elem) => {
    const key = keyFn(elem);
    if (seen[key]) {
      return false;
    }

    seen[key] = true;

    return true;
  });
}

export function isParentFolder(folder: string, filepath: string): boolean {
  let rel = path.relative(folder, filepath);
  return !rel.startsWith('..');
}

export function generateFolders(data: string) {
  const lines = data
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const items: string[] = [];
  const folderSet = new Set<string>();

  lines.forEach((path) => {
    if (path.endsWith('/')) {
      // 来自 ag 的输出，以 / 结尾表示文件夹
      folderSet.add(path);
      items.push(path);
    } else {
      // 来自 find/fd/rg 的输出，需要检查是否是文件夹
      items.push(path);
      
      // 从文件路径中提取父文件夹
      const parts = path.split('/');
      if (parts.length > 1) {
        let currentDir = '';
        for (let i = 0; i < parts.length - 1; i++) {
          currentDir = i === 0 ? parts[i] : `${currentDir}/${parts[i]}`;
          folderSet.add(currentDir + '/');
        }
      }
    }
  });

  // 去重并保持原始顺序
  const seen = new Set<string>();
  const uniqueItems = items.filter(item => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });

  // 按层级排序：先按目录深度，再按名称字母顺序
  return uniqueItems.sort((a, b) => {
    const cleanA = a.endsWith('/') ? a.slice(0, -1) : a;
    const cleanB = b.endsWith('/') ? b.slice(0, -1) : b;
    const partsA = cleanA.split('/');
    const partsB = cleanB.split('/');

    // 逐级比较
    for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
      const compare = partsA[i].localeCompare(partsB[i]);
      if (compare !== 0) return compare;
    }

    // 较短的路径排在前面（父目录在前）
    return partsA.length - partsB.length;
  });
}

export function findGitRoot(startPath: string): string | null {
  let currentDir = startPath;
  const root = path.parse(currentDir).root;
  while (true) {
    const gitPath = path.join(currentDir, '.git');
    try {
      if (fs.existsSync(gitPath)) {
        return currentDir;
      }
    } catch {}

    if (currentDir === root) {
      return null;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}

export async function getEscapedPath(inputPath?: string | null): Promise<string | null> {
  let relativePath: string;
  if (inputPath && typeof inputPath === 'string' && inputPath.trim().length > 0) {
    relativePath = (await workspace.nvim.call('fnamemodify', [inputPath.trim(), ':.'])) as string;
  } else {
    relativePath = (await workspace.nvim.call('expand', ['%:.'])) as string;
  }
  if (!relativePath || relativePath.length === 0) {
    return null;
  }
  const escaped = (await workspace.nvim.call('fnameescape', [relativePath])) as string;
  return escaped;
}
