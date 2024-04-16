/**
 * @author linhuiw
 * @desc 常量定义
 */
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import { getAllFiles, getConfiguration } from './utils';

/**
 * 适配不同的语言文件夹位置
 */
function dirAdaptor() {
  const kiwiLangPerfix = `${vscode.workspace.workspaceFolders[0].uri.fsPath}/.kiwi/zh-CN/`;
  const langPrefix = `${vscode.workspace.workspaceFolders[0].uri.fsPath}/langs/zh-CN/`;

  /** 兼容 zh_CN 情况 */
  const _kiwiLangPerfix = `${vscode.workspace.workspaceFolders[0].uri.fsPath}/.kiwi/zh_CN/`;
  const _langPrefix = `${vscode.workspace.workspaceFolders[0].uri.fsPath}/langs/zh_CN/`;

  if (fs.existsSync(kiwiLangPerfix)) {
    return kiwiLangPerfix;
  } else if (fs.existsSync(langPrefix)) {
    return langPrefix;
  } else if (fs.existsSync(_kiwiLangPerfix)) {
    return _kiwiLangPerfix;
  } else if (fs.existsSync(_langPrefix)) {
    return _langPrefix;
  } else {
    const files = getAllFiles(`${vscode.workspace.workspaceFolders[0].uri.fsPath}/`);
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

function getDefaultDir() {
  const dir = dirAdaptor();
  if (!dir) {
    const preFix = getConfiguration('langPrefix');
    if (preFix) {
      return `${vscode.workspace.workspaceFolders[0].uri.fsPath}/${preFix}`;
    }
  }
  return dir;
}

const LANG_PREFIX = getDefaultDir();
const DIR_ADAPTOR = dirAdaptor();
const I18N_GLOB = `${LANG_PREFIX}**/*.ts`;
/** unicode cjk 中日韩文 范围 */
const DOUBLE_BYTE_REGEX = /[\u4E00-\u9FFF]/g;

const KiwiSearchTypes = [
  {
    label: '在当前文件中搜索',
    description: 'cmd+ctrl+f'
  },
  {
    label: '全局搜索',
    description: 'cmd+ctrl+r'
  }
];

export { LANG_PREFIX, I18N_GLOB, DOUBLE_BYTE_REGEX, DIR_ADAPTOR, KiwiSearchTypes };
