/**
 * @author doubledream
 * @desc 获取语言文件
 */

import * as globby from 'globby';
import * as fs from 'fs';
import * as path from 'path';
import { getProjectConfig, flatten } from '../utils';

const CONFIG = getProjectConfig();
const LANG_DIR = path.resolve(CONFIG.kiwiDir, CONFIG.srcLang);
const I18N_GLOB = `${LANG_DIR}/**/*.ts`;

/**
 * 获取对应文件的语言
 */
function getLangData(fileName) {
  if (fs.existsSync(fileName)) {
    return getLangJson(fileName);
  } else {
    return {};
  }
}

/**
 * 获取文件 Json
 */
function getLangJson(fileName) {
  const fileContent = fs.readFileSync(fileName, { encoding: 'utf8' });
  const matches = fileContent.match(/export\s*default\s*({[\s\S]+);?$/);
  let obj = matches && matches[1];
  if (obj) {
    obj = obj.replace(/\s*;\s*$/, '');
  }
  let jsObj = {};
  try {
    jsObj = eval('(' + obj + ')');
  } catch (err) {
    console.log(obj);
    console.error(err);
  }
  return jsObj || {};
}

function getI18N() {
  const paths = globby.sync(I18N_GLOB);
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
      console.log(`\`${curr}\` 解析失败，该文件包含的文案无法自动补全`);
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
function getSuggestLangObj() {
  const langObj = getI18N();
  const finalLangObj = flatten(langObj);
  return finalLangObj;
}

export { getSuggestLangObj, getLangData };
