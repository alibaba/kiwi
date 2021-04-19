/**
 * @author linhuiw
 * @desc 获取语言文件
 */
import * as vscode from 'vscode';
import { flatten, getLangJson, getCurrentProjectLangPath } from './utils';
import * as globby from 'globby';
import * as fs from 'fs';
import { I18N_GLOB } from './const';

/**
 * 获取对应文件的语言
 */
export function getLangData(fileName: string) {
  if (fs.existsSync(fileName)) {
    return getLangJson(fileName);
  } else {
    return {};
  }
}
export function getI18N() {
  const _I18N_GLOB = getCurrentProjectLangPath() || I18N_GLOB;
  const paths = globby.sync(_I18N_GLOB);
  const langObj = paths.reduce((prev, curr) => {
    const filename = curr
      .split('/')
      .pop()
      .replace(/\.tsx?$/, '');
    if (filename.replace(/\.tsx?/, '') === 'index') {
      return prev;
    }

    const fileContent = getLangData(curr);
    let jsObj = fileContent;

    if (Object.keys(jsObj).length === 0) {
      vscode.window.showWarningMessage(`\`${curr}\` 解析失败，该文件包含的文案无法自动补全`);
    }

    return {
      ...prev,
      [filename]: jsObj
    };
  }, {});
  return langObj;
}
/**
 * 获取全部语言, 展平
 */
export function getSuggestLangObj() {
  const langObj = getI18N();
  const finalLangObj = flatten(langObj) as any;
  return finalLangObj;
}
