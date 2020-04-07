/**
 * @author linhuiw
 * @desc 工具方法
 */
import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs';
import { PROJECT_CONFIG, KIWI_CONFIG_FILE } from './const';

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
function withTimeout(promise, ms) {
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(`Promise timed out after ${ms} ms.`);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]);
}

/**
 * 使用google翻译
 */
function translateText(text, toLang) {
  const CONFIG = getProjectConfig();
  const options = CONFIG.translateOptions;
  const { translate: googleTranslate } = require('google-translate')(CONFIG.googleApiKey, options);
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
