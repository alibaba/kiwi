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
import { tsvFormatRows } from 'd3-dsv';
import { traverse, getProjectConfig, getLangDir } from './utils';
const CONFIG = getProjectConfig();
const { translate: googleTranslate } = require('google-translate')(CONFIG.googleApiKey);
const baiduTranslate = require('baidu-translate');

import { withTimeout } from './utils';
import { PROJECT_CONFIG } from './const';
import { importMessages } from './import';

function translateText(text, toLang) {
  return withTimeout(
    new Promise((resolve, reject) => {
      googleTranslate(text, 'zh', PROJECT_CONFIG.langMap[toLang], (err, translation) => {
        if (err) {
          reject(err);
        } else {
          resolve(translation.translatedText);
        }
      });
    }),
    5000
  );
}

/** 百度翻译 */
function translateTextByBaidu(text, toLang) {
  const {
    baiduApiKey: { appId, appKey },
    baiduLangMap
  } = CONFIG;
  return withTimeout(
    new Promise((resolve, reject) => {
      baiduTranslate(appId, appKey, baiduLangMap[toLang], 'zh')(text)
        .then(data => {
          if (data && data.trans_result) {
            resolve(data.trans_result);
          } else {
            reject(`\n百度翻译api调用异常 error_code: ${data.error_code}, error_msg: ${data.error_msg}`);
          }
        })
        .catch(err => {
          reject(err);
        });
    }),
    3000
  );
}

/** 文案首字母大小 变量小写 */
function textToUpperCaseByFirstWord(text) {
  // 翻译文案首字母大写，变量小写
  return text
    ? `${text.charAt(0).toUpperCase()}${text.slice(1)}`.replace(/(\{.*?\})/g, text => text.toLowerCase())
    : '';
}

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
 * Mock 对应语言
 * @param dstLang
 */
async function mockCurrentLang(dstLang: string, origin: string) {
  const texts = getSourceText();
  const distTexts = getDistText(dstLang);
  const untranslatedTexts = {};
  const mocks = {};
  /** 遍历文案 */
  traverse(texts, (text, path) => {
    const distText = _.get(distTexts, path);
    if (text === distText) {
      untranslatedTexts[path] = text;
    }
  });
  if (origin === 'Google') {
    /** 调用 Google 翻译 */
    const translateAllTexts = Object.keys(untranslatedTexts).map(key => {
      return translateText(untranslatedTexts[key], dstLang).then(translatedText => [key, translatedText]);
    });
    /** 获取 Mocks 文案 */
    await Promise.all(translateAllTexts).then(res => {
      res.forEach(([key, translatedText]) => {
        mocks[key] = translatedText;
      });
      return mocks;
    });
  } else {
    const untranslatedKeys = Object.keys(untranslatedTexts);
    const taskLists = {};
    let lastIndex = 0;
    // 由于百度api单词翻译字符长度限制，需要将待翻译的文案拆分成单个子任务
    untranslatedKeys.reduce((pre, next, index) => {
      const byteLen = Buffer.byteLength(pre, 'utf8');
      if (byteLen > 5500) {
        // 获取翻译字节数，大于5500放到单独任务里面处理
        taskLists[lastIndex] = () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(translateTextByBaidu(pre, dstLang));
            }, 1500);
          });
        };
        lastIndex = index;
        return untranslatedTexts[next];
      } else if (index === untranslatedKeys.length - 1) {
        taskLists[lastIndex] = () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(translateTextByBaidu(`${pre}\n${untranslatedTexts[next]}`, dstLang));
            }, 1500);
          });
        };
      }
      return `${pre}\n${untranslatedTexts[next]}`;
    }, '');

    // 由于百度api调用QPS只有1, 考虑网络延迟 每1.5s请求一个子任务
    const taskKeys = Object.keys(taskLists);
    if (taskKeys.length > 0) {
      for (var i = 0; i < taskKeys.length; i++) {
        const langIndexKey = taskKeys[i];
        const taskItemFun = taskLists[langIndexKey];
        const data = await taskItemFun();
        (data || []).forEach(({ dst }, index) => {
          const currTextKey = untranslatedKeys[Number(langIndexKey) + index];
          mocks[currTextKey] = textToUpperCaseByFirstWord(dst);
        });
      }
    }
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
  const messagesToTranslate = Object.keys(mocks).map(key => [key, mocks[key]]);
  if (messagesToTranslate.length === 0) {
    return Promise.resolve();
  }
  const content = tsvFormatRows(messagesToTranslate);
  // 输出tsv文件
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(getLangDir(dstLang), 'mock.tsv');
    fs.writeFile(filePath, content, err => {
      if (err) {
        reject(err);
      } else {
        // 自动导入翻译结果
        importMessages(filePath, dstLang);
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

export { mockLangs };
