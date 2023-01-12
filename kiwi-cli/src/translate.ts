/**
 * @author zongwenjian
 * @desc 全量翻译 translate命令
 */
require('ts-node').register({
  compilerOptions: {
    module: 'commonjs'
  }
});
import * as path from 'path';
import * as fs from 'fs';
import * as baiduTranslate from 'baidu-translate';
import { tsvFormatRows } from 'd3-dsv';
import { getProjectConfig, getLangDir, withTimeout, translateText } from './utils';
import { importMessages } from './import';
import { getAllUntranslatedTexts } from './mock';

const CONFIG = getProjectConfig();

/**
 * 百度单次翻译任务
 * @param text 待翻译文案
 * @param toLang 目标语种
 */
function translateTextByBaidu(text, toLang) {
  const {
    baiduApiKey: { appId, appKey },
    baiduLangMap
  } = CONFIG;
  return withTimeout(
    new Promise((resolve, reject) => {
      baiduTranslate(
        appId,
        appKey,
        baiduLangMap[toLang],
        'zh'
      )(text)
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

function textToUpperCaseByFirstWord(text) {
  // 翻译文案首字母大写
  return text
    ? `${text.charAt(0).toUpperCase()}${text.slice(1)}`
        // {val} 变量小写
        .replace(/(\{.*?\})/g, text => `${text.charAt(0).toLowerCase()}${text.slice(1)}`)
        // 文案中的\n换行翻译前转换成了$n, 翻译后转换回来
        .replace(/\$[nN]/g, '\n')
    : '';
}

/**
 * 使用google翻译所有待翻译的文案
 * @param untranslatedTexts 待翻译文案
 * @param toLang 目标语种
 */
async function googleTranslateTexts(untranslatedTexts, toLang) {
  const translateAllTexts = Object.keys(untranslatedTexts).map(key => {
    return translateText(untranslatedTexts[key], toLang).then(translatedText => [key, translatedText]);
  });
  return new Promise(resolve => {
    const result = {};
    Promise.all(translateAllTexts).then(res => {
      res.forEach(([key, translatedText]) => {
        result[key] = translatedText;
      });
      resolve(result);
    });
  });
}

/**
 * 使用百度翻译所有待翻译的文案
 * @param untranslatedTexts 待翻译文案
 * @param toLang 目标语种
 */
async function baiduTranslateTexts(untranslatedTexts, toLang) {
  return new Promise(async resolve => {
    const result = {};
    const untranslatedKeys = Object.keys(untranslatedTexts);
    const taskLists = {};
    let lastIndex = 0;
    // 由于百度api单词翻译字符长度限制，需要将待翻译的文案拆分成单个子任务
    untranslatedKeys.reduce((pre, next, index) => {
      const value = untranslatedTexts[next].replace(/\n/g, '$n');
      const byteLen = Buffer.byteLength(pre, 'utf8');
      if (byteLen > 5500) {
        // 获取翻译字节数，大于5500放到单独任务里面处理
        taskLists[lastIndex] = () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(translateTextByBaidu(pre, toLang));
            }, 1500);
          });
        };
        lastIndex = index;
        return value;
      } else if (index === untranslatedKeys.length - 1) {
        taskLists[lastIndex] = () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(translateTextByBaidu(`${pre}\n${value}`, toLang));
            }, 1500);
          });
        };
      }
      return `${pre}\n${value}`;
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
          result[currTextKey] = textToUpperCaseByFirstWord(dst);
        });
      }
    }

    resolve(result);
  });
}

/**
 * 执行翻译任务，自动导入翻译结果
 * @param dstLang
 */
async function runTranslateApi(dstLang: string, origin: string) {
  const untranslatedTexts = getAllUntranslatedTexts(dstLang);
  let mocks = {};
  if (origin === 'Google') {
    mocks = await googleTranslateTexts(untranslatedTexts, dstLang);
  } else {
    mocks = await baiduTranslateTexts(untranslatedTexts, dstLang);
  }

  const messagesToTranslate = Object.keys(mocks).map(key => [key, mocks[key]]);
  if (messagesToTranslate.length === 0) {
    return Promise.resolve();
  }
  const content = tsvFormatRows(messagesToTranslate);
  // 输出tsv文件
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(getLangDir(dstLang), `${dstLang}_translate.tsv`);
    fs.writeFile(filePath, content, err => {
      if (err) {
        reject(err);
      } else {
        console.log(`${dstLang} 自动翻译完成`);
        // 自动导入翻译结果
        importMessages(filePath, dstLang);
        resolve();
      }
    });
  });
}

/**
 * 全量翻译
 * @param origin 翻译源
 */
async function translate(origin: string) {
  const langs = CONFIG.distLangs;
  if (origin === 'Google') {
    const mockPromise = langs.map(lang => {
      return runTranslateApi(lang, origin);
    });
    return Promise.all(mockPromise);
  } else {
    for (var i = 0; i < langs.length; i++) {
      await runTranslateApi(langs[i], origin);
    }
    return Promise.resolve();
  }
}

export { translate, baiduTranslateTexts, googleTranslateTexts };
