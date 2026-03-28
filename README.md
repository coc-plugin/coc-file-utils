# coc-file-utils

The best way to create, copy, move, rename and delete file and folder

## Todo

- [x] batch create files or folders (supports folder selection)

- [x] folder renaming (supports folder selection)

- [x] folder delete (supports folder selection)

- [x] Copy the current file to the corresponding folder

- [x] Move the current file to the corresponding folder

- [x] Delete the current file

- [x] Rename the current file

- [ ] Before renaming a folder, you need to save and close the buffer for all files opened in the old folder

- [ ] Before deleting a folder, you need to save and close the buffer for all open files in it

- [ ] Before renaming or deleting a file, it is necessary to save and close all buffers in the file

- [ ] Choose a folder to create folders and files, support root directory

- [ ] Support copying folders

## Install

`:CocInstall coc-file-utils`

## Lists

`:CocList dirs`

## commands

`:CocCommand coc-file-utils.create` Create files or folders in the root directory of the current project

`:CocCommand coc-file-utils.delete` Delete the current file

`:CocCommand coc-file-utils.rename` Rename the current file

`:CocCommand coc-file-utils.deleteDir` Delete the folder where the current file is located

`:CocCommand coc-file-utils.renameDir` Rename the folder where the current file is located

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
