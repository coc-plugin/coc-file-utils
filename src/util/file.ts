import fs from 'fs/promises';
import * as path from 'path';
import { window, nvim } from 'coc.nvim';
import { closeDirBuffers, closeFileBuffer } from './buffer';

export async function create(basePath: string, name: string): Promise<void> {
  const names = name
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);

  for (const name of names) {
    try {
      if (name.endsWith('/')) {
        const dirPath = path.join(basePath, name);
        await fs.mkdir(dirPath, { recursive: true });
        window.showInformationMessage(`Directory created: ${dirPath}`);
      } else {
        const filePath = path.join(basePath, name);
        const dirPath = path.dirname(filePath);

        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(filePath, '');

        window.showInformationMessage(`File created: ${filePath}`);
      }
    } catch (err: any) {
      window.showErrorMessage(`Failed to create ${name}: ${err.message}`);
    }
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      window.showErrorMessage(`Not a file: ${filePath}`);
      return;
    }

    await closeFileBuffer(filePath).catch(() => {});
    await fs.unlink(filePath);

    window.showInformationMessage(`File deleted: ${filePath}`);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      window.showErrorMessage(`File does not exist: ${filePath}`);
    } else {
      window.showErrorMessage(`Failed to delete file: ${err.message}`);
    }
  }
}

export async function deleteDir(dirPath: string): Promise<void> {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      window.showErrorMessage(`Not a directory: ${dirPath}`);
      return;
    }

    await closeDirBuffers(dirPath).catch(() => {});
    await fs.rm(dirPath, { recursive: true, force: true });

    window.showInformationMessage(`Directory deleted: ${dirPath}`);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      window.showErrorMessage(`Directory does not exist: ${dirPath}`);
    } else {
      window.showErrorMessage(`Failed to delete directory: ${err.message}`);
    }
  }
}

export async function copyFile(srcFilePath: string, destPath: string): Promise<void> {
  try {
    const stat = await fs.stat(srcFilePath);
    if (!stat.isFile()) {
      window.showErrorMessage(`Not a file: ${srcFilePath}`);
      return;
    }

    const fileName = path.basename(srcFilePath);
    const destFilePath = path.join(destPath, fileName);

    await fs.mkdir(destPath, { recursive: true });
    await fs.copyFile(srcFilePath, destFilePath);

    nvim.command(`edit ${destFilePath}`);
    window.showInformationMessage(`File copied to: ${destFilePath}`);
  } catch (err: any) {
    window.showErrorMessage(`Failed to copy file: ${err.message}`);
  }
}

export async function moveFile(srcFilePath: string, destPath: string): Promise<void> {
  try {
    const stat = await fs.stat(srcFilePath);
    if (!stat.isFile()) {
      window.showErrorMessage(`Not a file: ${srcFilePath}`);
      return;
    }

    const fileName = path.basename(srcFilePath);
    const destFilePath = path.join(destPath, fileName);

    await fs.mkdir(destPath, { recursive: true });
    await closeFileBuffer(srcFilePath).catch(() => {});

    await fs.rename(srcFilePath, destFilePath);

    nvim.command(`edit ${destFilePath}`);
    window.showInformationMessage(`File moved to: ${destFilePath}`);
  } catch (err: any) {
    window.showErrorMessage(`Failed to move file: ${err.message}`);
  }
}

export async function renameFile(srcFilePath: string, newName: string): Promise<void> {
  try {
    const stat = await fs.stat(srcFilePath);
    if (!stat.isFile()) {
      window.showErrorMessage(`Not a file: ${srcFilePath}`);
      return;
    }

    await closeFileBuffer(srcFilePath).catch(() => {});

    const dir = path.dirname(srcFilePath);
    const destFilePath = path.join(dir, newName);

    await closeFileBuffer(srcFilePath).catch(() => {});
    await fs.rename(srcFilePath, destFilePath);
    window.showInformationMessage(`File renamed to: ${destFilePath}`);
  } catch (err: any) {
    window.showErrorMessage(`Failed to rename file: ${err.message}`);
  }
}

export async function renameDir(srcDirPath: string, newName: string): Promise<void> {
  try {
    const stat = await fs.stat(srcDirPath);
    if (!stat.isDirectory()) {
      window.showErrorMessage(`Not a directory: ${srcDirPath}`);
      return;
    }

    await closeDirBuffers(srcDirPath).catch(() => {});

    const parentDir = path.dirname(srcDirPath);
    const destDirPath = path.join(parentDir, newName);

    await fs.rename(srcDirPath, destDirPath);

    window.showInformationMessage(`Directory renamed to: ${destDirPath}`);
  } catch (err: any) {
    window.showErrorMessage(`Failed to rename directory: ${err.message}`);
  }
}
