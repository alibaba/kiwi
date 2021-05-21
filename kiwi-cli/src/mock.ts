/**
 * @author linhuiw
 * @desc 翻译方法
 * @TODO: index 文件需要添加 mock
 */
require('ts-node').register({
  compilerOptions: {
    module: 'commonjs'
  }
});
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import { traverse, getProjectConfig, getLangDir, translateText } from './utils';
import { baiduTranslateTexts, googleTranslateTexts } from './translate';

const CONFIG = getProjectConfig();

/**
 * 获取中文文案
 */
function getSourceText() {
  const srcLangDir = getLangDir(CONFIG.srcLang);
  const srcFile = path.resolve(srcLangDir, 'index.ts');
  const { default: texts } = require(srcFile);

  return texts;
}
/**
 * 获取对应语言文案
 * @param dstLang
 */
function getDistText(dstLang) {
  const distLangDir = getLangDir(dstLang);
  const distFile = path.resolve(distLangDir, 'index.ts');
  let distTexts = {};
  if (fs.existsSync(distFile)) {
    distTexts = require(distFile).default;
  }

  return distTexts;
}

/**
 * 获取所有未翻译的文案
 * @param 目标语种
 */
function getAllUntranslatedTexts(toLang) {
  const texts = getSourceText();
  const distTexts = getDistText(toLang);
  const untranslatedTexts = {};
  /** 遍历文案 */
  traverse(texts, (text, path) => {
    const distText = _.get(distTexts, path);
    if (text === distText || !distText) {
      untranslatedTexts[path] = text;
    }
  });
  return untranslatedTexts;
}

/**
 * Mock 对应语言
 * @param dstLang
 */
async function mockCurrentLang(dstLang: string, origin: string) {
  const untranslatedTexts = getAllUntranslatedTexts(dstLang);
  let mocks = {};
  if (origin === 'Google') {
    mocks = await googleTranslateTexts(untranslatedTexts, dstLang);
  } else {
    mocks = await baiduTranslateTexts(untranslatedTexts, dstLang);
  }

  /** 所有任务执行完毕后，写入mock文件 */
  return writeMockFile(dstLang, mocks);
}
/**
 * 写入 Mock 文件
 * @param dstLang
 * @param mocks
 */
function writeMockFile(dstLang, mocks) {
  const fileContent = 'export default ' + JSON.stringify(mocks, null, 2);
  const filePath = path.resolve(getLangDir(dstLang), 'mock.ts');
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, fileContent, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
/**
 * Mock 语言的未翻译的文案
 * @param lang
 */
async function mockLangs(origin: string) {
  const langs = CONFIG.distLangs;
  if (origin === 'Google') {
    const mockPromise = langs.map(lang => {
      return mockCurrentLang(lang, origin);
    });
    return Promise.all(mockPromise);
  } else {
    for (var i = 0; i < langs.length; i++) {
      await mockCurrentLang(langs[i], origin);
    }
    return Promise.resolve();
  }
}

export { mockLangs, getAllUntranslatedTexts };
