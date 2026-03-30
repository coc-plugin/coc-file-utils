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

- [ ] When deleting, moving, or modifying files or folders, it is necessary to close the relevant files opened in the buffer

- [x] Choose a folder to create folders and files, support root directory

## Install

`:CocInstall coc-file-utils`

## Lists

`:CocList dirs`

## commands

`:CocCommand file.create` Create files or folders in the root directory of the current project

`:CocCommand file.delete` Delete the current file

`:CocCommand file.rename` Rename the current file

`:CocCommand file.deleteDir` Delete the folder where the current file is located

`:CocCommand file.renameDir` Rename the folder where the current file is located

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
