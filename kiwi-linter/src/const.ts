/**
 * @author linhuiw
 * @desc 常量定义
 */
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import { getAllFiles } from './utils';

/**
 * 适配不同的语言文件夹位置
 */
function dirAdaptor() {
  const firstLangPerfix = `${vscode.workspace.rootPath}/.kiwi/zh-CN/`;
  const backupLangPrefix = `${vscode.workspace.rootPath}/langs/zh-CN/`;

  if (fs.existsSync(firstLangPerfix)) {
    return firstLangPerfix;
  } else if (fs.existsSync(backupLangPrefix)) {
    return backupLangPrefix;
  } else {
    const files = getAllFiles(`${vscode.workspace.rootPath}/`);
    const matchFiles = files.filter((fileName) => {
      if (fileName.includes('/.kiwi/zh-CN/index.ts') || fileName.includes('/langs/zh-CN/index.ts')) {
        return true;
      }
      return false;
    });

    if (matchFiles.length) {
      return matchFiles[0].replace('index.ts', '');
    }
  }
}

const LANG_PREFIX = dirAdaptor();
const I18N_GLOB = `${LANG_PREFIX}**/*.ts`;
const DOUBLE_BYTE_REGEX = /[^\x00-\xff]/g;
export {
  LANG_PREFIX,
  I18N_GLOB,
  DOUBLE_BYTE_REGEX
};