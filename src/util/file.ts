import fs from 'fs';
import { window, nvim } from 'coc.nvim';
import { closeDirBuffers } from './buffer';

export function create(basePath: string, name: string) {
  const names = name.split(',');
  for (const name of names) {
    if (name.endsWith('/')) {
      const dirPath = `${basePath}/${name}`;
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        window.showInformationMessage(`Directory created: ${dirPath}`);
      }
    } else {
      const filePath = `${basePath}/${name}`;
      if (!fs.existsSync(filePath)) {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(filePath, '');
        window.showInformationMessage(`File created: ${filePath}`);
      }
    }
  }
}

export function deleteFile(filePath: string) {
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    nvim.command('bdelete!');
    fs.unlinkSync(filePath);
    nvim.command('enew');
    window.showInformationMessage(`File deleted: ${filePath}`);
  } else {
    window.showErrorMessage(`File does not exist: ${filePath}`);
  }
}

export async function deleteDir(dirPath: string) {
  if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
    try {
      await closeDirBuffers(dirPath);
    } catch {}
    fs.rmSync(dirPath, { recursive: true, force: true });
    window.showInformationMessage(`Directory deleted: ${dirPath}`);
  } else {
    window.showErrorMessage(`Directory does not exist: ${dirPath}`);
  }
}

export function copyFile(srcFilePath: string, destPath: string) {
  if (fs.existsSync(srcFilePath) && fs.lstatSync(srcFilePath).isFile()) {
    const destFilePath = `${destPath}/${srcFilePath.split('/').pop()}`;
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    fs.copyFileSync(srcFilePath, destFilePath);
    nvim.command(`edit ${destFilePath}`);
    window.showInformationMessage(`File copied to: ${destFilePath}`);
  } else {
    window.showErrorMessage(`File does not exist: ${srcFilePath}`);
  }
}

export function moveFile(srcFilePath: string, destPath: string) {
  if (fs.existsSync(srcFilePath) && fs.lstatSync(srcFilePath).isFile()) {
    const destFilePath = `${destPath}/${srcFilePath.split('/').pop()}`;
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    fs.renameSync(srcFilePath, destFilePath);
    nvim.command('bdelete!');
    nvim.command(`edit ${destFilePath}`);
    window.showInformationMessage(`File moved to: ${destFilePath}`);
  } else {
    window.showErrorMessage(`File does not exist: ${srcFilePath}`);
  }
}

export function renameFile(srcFilePath: string, newName: string) {
  if (fs.existsSync(srcFilePath) && fs.lstatSync(srcFilePath).isFile()) {
    const destFilePath = `${srcFilePath.substring(0, srcFilePath.lastIndexOf('/'))}/${newName}`;
    fs.renameSync(srcFilePath, destFilePath);
    nvim.command('bdelete!');
    nvim.command(`edit ${destFilePath}`);
    window.showInformationMessage(`File renamed to: ${destFilePath}`);
  } else {
    window.showErrorMessage(`File does not exist: ${srcFilePath}`);
  }
}

export async function renameDir(srcDirPath: string, newName: string) {
  if (fs.existsSync(srcDirPath) && fs.lstatSync(srcDirPath).isDirectory()) {
    try {
      await closeDirBuffers(srcDirPath);
    } catch {}
    srcDirPath = srcDirPath.endsWith('/') ? srcDirPath.slice(0, -1) : srcDirPath;
    const destDirPath = `${srcDirPath.substring(0, srcDirPath.lastIndexOf('/'))}/${newName}`;
    fs.renameSync(srcDirPath, destDirPath);
    window.showInformationMessage(`Directory renamed to: ${destDirPath}`);
  } else {
    window.showErrorMessage(`Directory does not exist: ${srcDirPath}`);
  }
}
