/**
 * @author linhuiw
 * @desc 工具方法
 */
import * as _ from 'lodash';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import slash from 'slash2';
import * as globby from 'globby';
import axios from 'axios';
import { pinyin } from 'pinyin-pro';
import { LangSceneParam, TranslateAPiEnum } from './define';
import { getObjectLiteralExpression } from './astUtils';

/**
 * 将对象拍平
 * @param obj    原始对象
 * @param prefix
 */
export function flatten(obj, prefix?) {
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

/**
 * 查找当前位置的 Code
 */
export function findPositionInCode(text: string, code: string) {
  const lines = code.split('\n');
  const lineNum = lines.findIndex(line => line.includes(text));

  if (lineNum === -1) {
    return null;
  }

  let chNum = lines[lineNum].indexOf(text);

  if (text.startsWith(' ')) {
    chNum += 1;
  }

  return new vscode.Position(lineNum, chNum);
}

export function findMatchKey(langObj, text) {
  for (const key in langObj) {
    if (langObj[key] === text) {
      return key;
    }
  }

  return null;
}

export function findMatchKeyWithScene(langObj, text, scene) {
  for (const key in langObj) {
    // 取path上最后一级为key, 解析出key中的场景
    const langLastKey = key
      .split('.')
      .pop()
      .split('_');
    // 如果key中包含场景，则取第一项第一项
    const currScene = langLastKey.length > 1 ? langLastKey[0] : '';
    // 文案相同，且场景相同 则视为相同文案
    if (langObj[key] === text && (currScene || 'noScene') === (scene || 'noScene')) {
      return key;
    }
  }

  return null;
}

/**
 * 获取文件夹下所有文件
 * @function getAllFiles
 * @param  {string} dir Dir path string.
 * @return {string[]} Array with all file names that are inside the directory.
 */
export const getAllFiles = dir =>
  fs.readdirSync(dir).reduce((files, file) => {
    // 避免读取node_modules造成性能问题
    if (file === 'node_modules') {
      return [...files];
    }
    const name = path.join(dir, file);
    const isDirectory = fs.statSync(name).isDirectory();
    return isDirectory ? [...files, ...getAllFiles(name)] : [...files, name];
  }, []);

/**
 * 获取文件 Json
 */
export function getLangJson(fileName) {
  const fileContent = fs.readFileSync(fileName, { encoding: 'utf8' });
  let objStr = getObjectLiteralExpression(fileContent);
  let jsObj = {};
  try {
    jsObj = eval('(' + objStr + ')');
  } catch (err) {
    console.log(objStr);
    console.error(err);
  }
  return jsObj;
}

/**
 * 获取配置，支持从vscode和配置文件(优先)中取到配置项
 */
export const getConfiguration = text => {
  let value = vscode.workspace.getConfiguration('vscode-i18n-linter').get(text);
  let kiwiConfigJson = getConfigFile();
  if (!kiwiConfigJson) {
    return value;
  }
  const config = getLangJson(kiwiConfigJson);
  if (text in config) {
    value = config[text];
  }
  return value;
};

/**
 * 查找kiwi-cli配置文件
 */
export const getConfigFile = () => {
  let kiwiConfigJson = `${vscode.workspace.workspaceFolders[0].uri.fsPath}/.kiwirc.js`;
  // 先找js
  if (!fs.existsSync(kiwiConfigJson)) {
    kiwiConfigJson = `${vscode.workspace.workspaceFolders[0].uri.fsPath}/.kiwirc.ts`;
    //再找ts
    if (!fs.existsSync(kiwiConfigJson)) {
      return null;
    }
  }
  return kiwiConfigJson;
};

/**
 * 查找kiwi-linter配置文件
 */
export const getKiwiLinterConfigFile = () => {
  let kiwiConfigJson = `${vscode.workspace.workspaceFolders[0].uri.fsPath}/kiwi-config.json`;
  // 先找js
  if (!fs.existsSync(kiwiConfigJson)) {
    return null;
  }
  return kiwiConfigJson;
};

/**
 * 获得项目配置信息中的 googleApiKey
 */
function getConfigByKey(key: string): any {
  const configFile = `${vscode.workspace.workspaceFolders[0].uri.fsPath}/kiwi-config.json`;
  let content = '';

  try {
    if (fs.existsSync(configFile)) {
      content = JSON.parse(fs.readFileSync(configFile, 'utf8'))[key];
    }
  } catch (error) {
    console.log(error);
  }
  return content;
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
 * 翻译中文
 */
export function translateText(text: string, type: TranslateAPiEnum) {
  const googleApiKey = getConfigByKey('googleApiKey');
  const { translate: googleTranslate } = require('google-translate')(googleApiKey);
  const { appId, appKey } = getConfigByKey('baiduApiKey');
  const baiduTranslate = require('baidu-translate');

  function _translateText() {
    return withTimeout(
      new Promise((resolve, reject) => {
        // google
        if (type === TranslateAPiEnum.Google) {
          googleTranslate(text, 'zh', 'en', (err, translation) => {
            if (err) {
              reject(err);
            } else {
              const result = translation.translatedText ? translation.translatedText.split('$') : [];
              resolve(result);
            }
          });
        }
        // baidu
        if (type === TranslateAPiEnum.Baidu) {
          baiduTranslate(
            appId,
            appKey,
            'en',
            'zh'
          )(text)
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
        // pinyin
        if (type === TranslateAPiEnum.PinYin) {
          const result = pinyin(text, { toneType: 'none' });
          resolve(result.split('$'));
        }
      }),
      3000
    );
  }

  return retry(_translateText, 3);
}

/**
 * 获取多项目配置
 */
export function getTargetLangPath(currentFilePath) {
  const configFile = `${vscode.workspace.workspaceFolders[0].uri.fsPath}/kiwi-config.json`;
  let targetLangPath = '';

  try {
    if (fs.existsSync(configFile)) {
      const { projects = [] } = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      for (const config of projects) {
        if (currentFilePath.indexOf(`/${config.target}/`) > -1) {
          targetLangPath = `${vscode.workspace.workspaceFolders[0].uri.fsPath}/${config.kiwiDir}/zh_CN/`;
          return targetLangPath;
        }
      }
    }
  } catch (error) {
    console.log(error);
  }

  return targetLangPath;
}

/**
 * 获取当前文件对应的项目路径
 */
export function getCurrentProjectLangPath() {
  let currentProjectLangPath = '';
  try {
    const targetLangPath = getTargetLangPath(vscode.window.activeTextEditor.document.uri.path);
    if (targetLangPath) {
      currentProjectLangPath = `${targetLangPath}**/*.ts`;
    }
  } catch (error) {
    console.log(error);
  }
  return currentProjectLangPath;
}

/**
 * 获取当前文件对应的语言路径
 */
export function getLangPrefix() {
  const langPrefix = getTargetLangPath(vscode.window.activeTextEditor.document.uri.path);
  return langPrefix;
}

/**
 * 获取当前文件路径层级 [pageA, moudleA, componentA]
 */
export function getCurrActivePageI18nKey() {
  const activeEditor = vscode.window.activeTextEditor;
  let suggestion = [];
  if (activeEditor) {
    const currentFilename = activeEditor.document.fileName;
    const suggestPageRegex = /\/pages\/\w+\/([^\/]+)\/([^\/\.]+)/;
    if (currentFilename.includes('/pages/')) {
      suggestion = currentFilename.match(suggestPageRegex);
    }
    if (suggestion && suggestion.length) {
      // 匹配到则去除第一项currentFilename，保留元组项
      suggestion.shift();
    } else {
      const names = slash(currentFilename).split('/') as string[];
      const fileName = _.last(names);
      const fileKey = fileName.split('.')[0].replace(new RegExp('-', 'g'), '_');
      const dir = names[names.length - 2].replace(new RegExp('-', 'g'), '_');
      if (dir === fileKey) {
        suggestion = [dir];
      } else {
        suggestion = [dir, fileKey];
      }
    }
  }
  return suggestion;
}

/**
 * 检测翻译源
 */
export function getTranslateAPiList() {
  let apiList = [{ label: TranslateAPiEnum.PinYin, description: '拼音' }];
  const googleApiKey = getConfigByKey('googleApiKey');
  const { appId, appKey } = getConfigByKey('baiduApiKey');
  // google翻译暂时不开放
  // if (googleApiKey) {
  //   apiList.push({ label: TranslateAPiEnum.Google, description: '谷歌' });
  // }
  if (appId && appKey) {
    apiList.push({ label: TranslateAPiEnum.Baidu, description: '百度' });
  }

  return apiList;
}

/** 获取语言文件名称 */
export function getI18NFileNames(DEFAULT_I18N_GLOB?:string) {
  const _I18N_GLOB = getCurrentProjectLangPath() || DEFAULT_I18N_GLOB;
  const paths = globby.sync(_I18N_GLOB);
  return (paths || [])
    .map(i => {
      return i
        .split('/')
        .pop()
        .replace(/\.tsx?$/, '');
    })
    .filter(i => i !== 'index');
}

/** 纠正path中文件名称的方法 */
export function getSafePath(path: string, DEFAULT_I18N_GLOB?:string) {
  if (!path) {
    return path;
  }
  const fileNames = getI18NFileNames(DEFAULT_I18N_GLOB);
  const [filename, ...restPath] = path.split('.');
  const sameFileNameIndex = fileNames.map(i => i.toLowerCase()).findIndex(i => i === filename.toLowerCase());
  if (sameFileNameIndex > -1) {
    return [fileNames[sameFileNameIndex], ...restPath].join('.');
  }
  return path;
}

/**
 *
 * @param str 输入
 * @param defaultReturn JSON解析失败时的返回值
 * @returns
 */
export function safeJSONParse(str: string, defaultReturn?: any) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultReturn;
  }
}

/**
 *
 * @param obj AI场景提取 阿里云百练千问调用
 * @param AK 千问AK
 * @returns
 */
export const getLangSceneByAlibabaConsole = (obj: LangSceneParam) => {
  const aliConsoleAK = getConfiguration('aliConsoleAK') as string;
  const agentAppId = getConfiguration('agentAppId') as string;
  return new Promise((resolve, reject) => {
    axios
      .post(
        // 百练-翻译机应用-已发布API
        `https://dashscope.aliyuncs.com/api/v1/apps/${agentAppId}/completion`,
        {
          input: {
            prompt: JSON.stringify(obj)
          }
        },
        {
          headers: {
            Authorization: aliConsoleAK,
            'Content-Type': 'application/json'
          }
        }
      )
      .then(data => {
        const res = _.get(data, 'data.output.text');
        if (res) {
          resolve(safeJSONParse(res, []));
        } else {
          reject(`${res.errorMsg}: ${res.data}`);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
};
