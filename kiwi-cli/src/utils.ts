/**
 * @author linhuiw
 * @desc 工具方法
 */
import * as path from 'path';
import * as _ from 'lodash';
import * as inquirer from 'inquirer';
import * as fs from 'fs';
import { pinyin } from 'pinyin-pro';
import { PROJECT_CONFIG, KIWI_CONFIG_FILE } from './const';
const colors = require('colors');

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
  const configFile = path.resolve(process.cwd(), `./${KIWI_CONFIG_FILE}`);
  let obj = PROJECT_CONFIG.defaultConfig;

  if (configFile && fs.existsSync(configFile)) {
    obj = {
      ...obj,
      ...JSON.parse(fs.readFileSync(configFile, 'utf8'))
    };
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

/**
 * 翻译中文
 */
function translateKeyText(text: string, origin: string) {
  const CONFIG = getProjectConfig();
  const { appId, appKey } = CONFIG.baiduApiKey;
  const baiduTranslate = require('baidu-translate');

  function _translateText() {
    return withTimeout(
      new Promise((resolve, reject) => {
        // Baidu
        if (origin === 'Baidu') {
          baiduTranslate(appId, appKey, 'en', 'zh')(text)
            .then(data => {
              if (data && data.trans_result) {
                const result = data.trans_result.map(item => item.dst) || [];
                resolve(result);
              }
            })
            .catch(err => {
              reject(err);
            });
        }
        // Pinyin
        if (origin === 'Pinyin') {
          const result = pinyin(text, { toneType: 'none' });
          resolve(result.split('$'));
        }
      }),
      3000
    );
  }

  return retry(_translateText, 3);
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

  for (var attribute in obj) {
    var attr = attribute.replace(/-/g, '_');
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

/**
 * 获取翻译源类型
 */
async function getTranslateOriginType() {
  const { googleApiKey, baiduApiKey } = getProjectConfig();
  let translateType = ['Google', 'Baidu'];
  if (!googleApiKey) {
    translateType = translateType.filter(item => item !== 'Google');
  }
  if (!baiduApiKey || !baiduApiKey.appId || !baiduApiKey.appKey) {
    translateType = translateType.filter(item => item !== 'Baidu');
  }
  if (translateType.length === 0) {
    console.log('请配置 googleApiKey 或 baiduApiKey ');
    return {
      pass: false,
      origin: ''
    };
  }
  if (translateType.length == 1) {
    return {
      pass: true,
      origin: translateType[0]
    };
  }
  const { origin } = await inquirer.prompt({
    type: 'list',
    name: 'origin',
    message: '请选择使用的翻译源',
    default: 'Google',
    choices: ['Google', 'Baidu']
  });
  return {
    pass: true,
    origin: origin
  };
}

/**
 * 成功的提示
 */
function successInfo(message: string) {
  console.log('successInfo: ', colors.green(message));
}

/**
 * 失败的提示
 */
function failInfo(message: string) {
  console.log('failInfo: ', colors.red(message));
}

/**
 * 普通提示
 */
function highlightText(message: string | number) {
  return colors.yellow(`${message}`);
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
  lookForFiles,
  getTranslateOriginType,
  translateKeyText,
  successInfo,
  failInfo,
  highlightText
};
