/**
 * @author linhuiw
 * @desc 工具方法
 */
import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs';
import Axios from 'axios';
import * as pLimit from 'p-limit';
import { PROJECT_CONFIG, KIWI_CONFIG_FILE, KIWI_DEFAULT_TRANSLATE_TIMEOUT } from './const';
import MD5 from './baiduTranslateMd5Util';

const CONFIG = getProjectConfig();

const limit = pLimit(CONFIG.translateOptions.concurrentLimit);

/**
 * 统一错误包装
 */
export function wrapError(error: string, detail: any) {
  return `${error}：${JSON.stringify(detail, undefined, 2)}`
}

function lookForFiles(dir: string, fileName: string): string {
  const files = fs.readdirSync(dir);

  for (let file of files) {
    const currName = path.join(dir, file);
    const info = fs.statSync(currName);
    if (info.isDirectory()) {
      if (file === '.git' || file === 'node_modules') {
        continue;
      }
      const result = lookForFiles(currName, fileName);
      if (result) {
        return result;
      }
    } else if (info.isFile() && file === fileName) {
      return currName;
    }
  }
}

/**
 * 获得项目配置信息
 */
function getProjectConfig() {
  const rootDir = path.resolve(process.cwd(), `./`);
  const configFile = lookForFiles(rootDir, KIWI_CONFIG_FILE);
  let obj = PROJECT_CONFIG.defaultConfig;

  if (configFile && fs.existsSync(configFile)) {
    obj = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  }
  return obj;
}

/**
 * 获取语言资源的根目录
 */
function getKiwiDir() {
  const config = getProjectConfig();

  if (config) {
    return config.kiwiDir;
  }
}

/**
 * 获取对应语言的目录位置
 * @param lang
 */
function getLangDir(lang) {
  const langsDir = getKiwiDir();
  return path.resolve(langsDir, lang);
}

/**
 * 深度优先遍历对象中的所有 string 属性，即文案
 */
function traverse(obj, cb) {
  function traverseInner(obj, cb, path) {
    _.forEach(obj, (val, key) => {
      if (typeof val === 'string') {
        cb(val, [...path, key].join('.'));
      } else if (typeof val === 'object' && val !== null) {
        traverseInner(val, cb, [...path, key]);
      }
    });
  }

  traverseInner(obj, cb, []);
}

/**
 * 获取所有文案
 */
function getAllMessages(lang: string, filter = (message: string, key: string) => true) {
  const srcLangDir = getLangDir(lang);
  let files = fs.readdirSync(srcLangDir);
  files = files.filter(file => file.endsWith('.ts') && file !== 'index.ts').map(file => path.resolve(srcLangDir, file));

  const allMessages = files.map(file => {
    const { default: messages } = require(file);
    const fileNameWithoutExt = path.basename(file).split('.')[0];
    const flattenedMessages = {};

    traverse(messages, (message, path) => {
      const key = fileNameWithoutExt + '.' + path;
      if (filter(message, key)) {
        flattenedMessages[key] = message;
      }
    });

    return flattenedMessages;
  });

  return Object.assign({}, ...allMessages);
}

/**
 * 重试方法
 * @param asyncOperation
 * @param times
 */
function retry(asyncOperation, times = 1) {
  let runTimes = 1;
  const handleReject = e => {
    if (runTimes++ < times) {
      return asyncOperation().catch(handleReject);
    } else {
      throw e;
    }
  };
  return asyncOperation().catch(handleReject);
}

/**
 * 设置超时
 * @param promise
 * @param ms
 */
function withTimeout(promise: Promise<any>, ms?: number) {
  const timeout = ms ?? KIWI_DEFAULT_TRANSLATE_TIMEOUT;

  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(`Promise timed out after ${timeout} ms.`);
    }, timeout);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * 使用 Google 翻译
 */
function googleTranslate(text: string, toLang: string) {
  const options = CONFIG.translateOptions;
  const { translate: googleTranslate } = require('google-translate')(CONFIG.googleApiKey, options);
  return withTimeout(
    new Promise((resolve, reject) => {
      googleTranslate(text, 'zh', PROJECT_CONFIG.langMap[toLang], (err, translation) => {
        if (err) {
          reject(wrapError("Google 翻译出错啦", err.body));
        } else {
          resolve(translation.translatedText);
        }
      });
    }));
}

/**
 * 使用百度翻译
 * 
 * 详细 api 接入文档请看：http://api.fanyi.baidu.com/api/trans/product/apidoc
 */
function baiduTranslate(text: string, toLang: string) {
  const appid = CONFIG.baiduTranslate.appId;
  const key = CONFIG.baiduTranslate.appKey;
  const salt = (new Date).getTime();
  // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
  // （虽然 API 支持，但目前暂不对多 query 做兼容）
  const query = text;
  const from = 'zh';
  const to = PROJECT_CONFIG.langMap[toLang];
  const str1 = appid + query + salt + key;
  const sign = MD5(str1);

  return limit(() => new Promise((resolve, reject) => {
    setTimeout(() => {
      Axios('https://fanyi-api.baidu.com/api/trans/vip/translate', {
        method: 'GET',
        withCredentials: true,
        params: {
          q: query,
          appid: appid,
          salt,
          from,
          to,
          sign
        }
      }).then(response => response.data).then(resJson => {
        if (resJson.error_code) {
          reject(wrapError("百度翻译出错啦", resJson));
        } else {
          const [res] = resJson.trans_result;
          console.log(res);
          // 暂时只处理单 query 的情况，多 query 的结果除了第一个其余都会忽略
          resolve(res.dst);
        }
      })
    }, 1000);
  }));
}

/**
 * 翻译文案
 */
function translateText(text: string, toLang: string) {

  if (CONFIG.googleApiKey) {
    return googleTranslate(text, toLang);
  }

  if (CONFIG.baiduTranslate.appId && CONFIG.baiduTranslate.appKey) {
    return baiduTranslate(text, toLang);
  }
}

function findMatchKey(langObj, text) {
  for (const key in langObj) {
    if (langObj[key] === text) {
      return key;
    }
  }

  return null;
}

function findMatchValue(langObj, key) {
  return langObj[key];
}

/**
 * 将对象拍平
 * @param obj 原始对象
 * @param prefix
 */
function flatten(obj, prefix = '') {
  var propName = prefix ? prefix + '.' : '',
    ret = {};

  for (var attr in obj) {
    if (_.isArray(obj[attr])) {
      var len = obj[attr].length;
      ret[attr] = obj[attr].join(',');
    } else if (typeof obj[attr] === 'object') {
      _.extend(ret, flatten(obj[attr], propName + attr));
    } else {
      ret[propName + attr] = obj[attr];
    }
  }
  return ret;
}

export {
  getKiwiDir,
  getLangDir,
  traverse,
  retry,
  withTimeout,
  getAllMessages,
  getProjectConfig,
  translateText,
  findMatchKey,
  findMatchValue,
  flatten,
  lookForFiles
};
