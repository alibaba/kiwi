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
  const kiwiLangPerfix = `${vscode.workspace.rootPath}/.kiwi/zh-CN/`;
  const langPrefix = `${vscode.workspace.rootPath}/langs/zh-CN/`;

  /** 兼容 zh_CN 情况 */
  const _kiwiLangPerfix = `${vscode.workspace.rootPath}/.kiwi/zh_CN/`;
  const _langPrefix = `${vscode.workspace.rootPath}/langs/zh_CN/`;

  if (fs.existsSync(kiwiLangPerfix)) {
    return kiwiLangPerfix;
  } else if (fs.existsSync(langPrefix)) {
    return langPrefix;
  } else if (fs.existsSync(_kiwiLangPerfix)) {
    return _kiwiLangPerfix;
  } else if (fs.existsSync(_langPrefix)) {
    return _langPrefix;
  } else {
    const files = getAllFiles(`${vscode.workspace.rootPath}/`);
    const matchFiles = files.filter(fileName => {
      if (
        fileName.includes('/.kiwi/zh-CN/index.ts') ||
        fileName.includes('/langs/zh-CN/index.ts') ||
        fileName.includes('/.kiwi/zh_CN/index.ts') ||
        fileName.includes('/langs/zh_CN/index.ts')
      ) {
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
export { LANG_PREFIX, I18N_GLOB, DOUBLE_BYTE_REGEX };
