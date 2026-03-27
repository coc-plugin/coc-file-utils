import fs from 'fs';
import { window, nvim } from 'coc.nvim';

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
  }
}

export function deleteDir(dirPath: string) {
  if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
    if (fs.readdirSync(dirPath).length === 0) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } else {
      window.showInformationMessage(`Directory is not empty: ${dirPath}`);
    }
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
  }
}
