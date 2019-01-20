/**
 * @author linhuiw
 * @desc 常量定义
 */
import * as vscode from 'vscode';

const LANG_PREFIX = `${vscode.workspace.rootPath}/langs/zh_CN/`;
const I18N_GLOB = `${LANG_PREFIX}**/*.ts`;
const DOUBLE_BYTE_REGEX = /[^\x00-\xff]/g;

export {
  LANG_PREFIX,
  I18N_GLOB,
  DOUBLE_BYTE_REGEX
};