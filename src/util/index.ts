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

/**
 * Removes duplicates from the given array. The optional keyFn allows to specify
 * how elements are checked for equalness by returning a unique string for each.
 */
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
  const files: string[] = [];
  const folderSet = new Set<string>();

  lines.forEach((path) => {
    if (path.endsWith('/')) {
      folderSet.add(path);
    } else {
      files.push(path);

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

  const folders = Array.from(folderSet).sort();
  return [...folders, ...files];
}

export function findGitRoot(startPath: string): string | null {
  let currentDir = startPath;
  // Prevent infinite loop by checking if we reached the filesystem root
  const root = path.parse(currentDir).root;

  while (true) {
    const gitPath = path.join(currentDir, '.git');
    try {
      if (fs.existsSync(gitPath)) {
        return currentDir;
      }
    } catch (e) {
      // Ignore errors
    }

    if (currentDir === root) {
      return null; // No git root found
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null; // Safety check for root
    }
    currentDir = parentDir;
  }
}
