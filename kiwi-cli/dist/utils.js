"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author linhuiw
 * @desc 工具方法
 */
const path = require("path");
const _ = require("lodash");
const inquirer = require("inquirer");
const fs = require("fs");
const pinyin_pro_1 = require("pinyin-pro");
const const_1 = require("./const");
const colors = require('colors');
function lookForFiles(dir, fileName) {
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
        }
        else if (info.isFile() && file === fileName) {
            return currName;
        }
    }
}
exports.lookForFiles = lookForFiles;
/**
 * 获得项目配置信息
 */
function getProjectConfig() {
    const configFile = path.resolve(process.cwd(), `./${const_1.KIWI_CONFIG_FILE}`);
    let obj = const_1.PROJECT_CONFIG.defaultConfig;
    if (configFile && fs.existsSync(configFile)) {
        obj = Object.assign({}, obj, JSON.parse(fs.readFileSync(configFile, 'utf8')));
    }
    return obj;
}
exports.getProjectConfig = getProjectConfig;
/**
 * 获取语言资源的根目录
 */
function getKiwiDir() {
    const config = getProjectConfig();
    if (config) {
        return config.kiwiDir;
    }
}
exports.getKiwiDir = getKiwiDir;
/**
 * 获取对应语言的目录位置
 * @param lang
 */
function getLangDir(lang) {
    const langsDir = getKiwiDir();
    return path.resolve(langsDir, lang);
}
exports.getLangDir = getLangDir;
/**
 * 深度优先遍历对象中的所有 string 属性，即文案
 */
function traverse(obj, cb) {
    function traverseInner(obj, cb, path) {
        _.forEach(obj, (val, key) => {
            if (typeof val === 'string') {
                cb(val, [...path, key].join('.'));
            }
            else if (typeof val === 'object' && val !== null) {
                traverseInner(val, cb, [...path, key]);
            }
        });
    }
    traverseInner(obj, cb, []);
}
exports.traverse = traverse;
/**
 * 获取所有文案
 */
function getAllMessages(lang, filter = (message, key) => true) {
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
exports.getAllMessages = getAllMessages;
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
        }
        else {
            throw e;
        }
    };
    return asyncOperation().catch(handleReject);
}
exports.retry = retry;
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
exports.withTimeout = withTimeout;
/**
 * 使用google翻译
 */
function translateText(text, toLang) {
    const CONFIG = getProjectConfig();
    const options = CONFIG.translateOptions;
    const { translate: googleTranslate } = require('google-translate')(CONFIG.googleApiKey, options);
    return withTimeout(new Promise((resolve, reject) => {
        googleTranslate(text, 'zh', const_1.PROJECT_CONFIG.langMap[toLang], (err, translation) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(translation.translatedText);
            }
        });
    }), 5000);
}
exports.translateText = translateText;
/**
 * 翻译中文
 */
function translateKeyText(text, origin) {
    const CONFIG = getProjectConfig();
    const { appId, appKey } = CONFIG.baiduApiKey;
    const baiduTranslate = require('baidu-translate');
    function _translateText() {
        return withTimeout(new Promise((resolve, reject) => {
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
                const result = pinyin_pro_1.pinyin(text, { toneType: 'none' });
                resolve(result.split('$'));
            }
        }), 3000);
    }
    return retry(_translateText, 3);
}
exports.translateKeyText = translateKeyText;
function findMatchKey(langObj, text) {
    for (const key in langObj) {
        if (langObj[key] === text) {
            return key;
        }
    }
    return null;
}
exports.findMatchKey = findMatchKey;
function findMatchValue(langObj, key) {
    return langObj[key];
}
exports.findMatchValue = findMatchValue;
/**
 * 将对象拍平
 * @param obj 原始对象
 * @param prefix
 */
function flatten(obj, prefix = '') {
    var propName = prefix ? prefix + '.' : '', ret = {};
    for (var attribute in obj) {
        var attr = attribute.replace(/-/g, '_');
        if (_.isArray(obj[attr])) {
            var len = obj[attr].length;
            ret[attr] = obj[attr].join(',');
        }
        else if (typeof obj[attr] === 'object') {
            _.extend(ret, flatten(obj[attr], propName + attr));
        }
        else {
            ret[propName + attr] = obj[attr];
        }
    }
    return ret;
}
exports.flatten = flatten;
/**
 * 获取翻译源类型
 */
function getTranslateOriginType() {
    return __awaiter(this, void 0, void 0, function* () {
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
        const { origin } = yield inquirer.prompt({
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
    });
}
exports.getTranslateOriginType = getTranslateOriginType;
/**
 * 成功的提示
 */
function successInfo(message) {
    console.log('successInfo: ', colors.green(message));
}
exports.successInfo = successInfo;
/**
 * 失败的提示
 */
function failInfo(message) {
    console.log('failInfo: ', colors.red(message));
}
exports.failInfo = failInfo;
/**
 * 普通提示
 */
function highlightText(message) {
    return colors.yellow(`${message}`);
}
exports.highlightText = highlightText;
//# sourceMappingURL=utils.js.map