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
 * @author zongwenjian
 * @desc 全量翻译 translate命令
 */
require('ts-node').register({
    compilerOptions: {
        module: 'commonjs'
    }
});
const path = require("path");
const fs = require("fs");
const baiduTranslate = require("baidu-translate");
const d3_dsv_1 = require("d3-dsv");
const utils_1 = require("./utils");
const import_1 = require("./import");
const mock_1 = require("./mock");
const CONFIG = utils_1.getProjectConfig();
/**
 * 百度单次翻译任务
 * @param text 待翻译文案
 * @param toLang 目标语种
 */
function translateTextByBaidu(text, toLang) {
    const { baiduApiKey: { appId, appKey }, baiduLangMap } = CONFIG;
    return utils_1.withTimeout(new Promise((resolve, reject) => {
        baiduTranslate(appId, appKey, baiduLangMap[toLang], 'zh')(text)
            .then(data => {
            if (data && data.trans_result) {
                resolve(data.trans_result);
            }
            else {
                reject(`\n百度翻译api调用异常 error_code: ${data.error_code}, error_msg: ${data.error_msg}`);
            }
        })
            .catch(err => {
            reject(err);
        });
    }), 3000);
}
/** 文案首字母大小 变量小写 */
function textToUpperCaseByFirstWord(text) {
    // 翻译文案首字母大写，变量小写
    return text
        ? `${text.charAt(0).toUpperCase()}${text.slice(1)}`.replace(/(\{.*?\})/g, text => text.toLowerCase())
        : '';
}
/**
 * 使用google翻译所有待翻译的文案
 * @param untranslatedTexts 待翻译文案
 * @param toLang 目标语种
 */
function googleTranslateTexts(untranslatedTexts, toLang) {
    return __awaiter(this, void 0, void 0, function* () {
        const translateAllTexts = Object.keys(untranslatedTexts).map(key => {
            return utils_1.translateText(untranslatedTexts[key], toLang).then(translatedText => [key, translatedText]);
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
    });
}
exports.googleTranslateTexts = googleTranslateTexts;
/**
 * 使用百度翻译所有待翻译的文案
 * @param untranslatedTexts 待翻译文案
 * @param toLang 目标语种
 */
function baiduTranslateTexts(untranslatedTexts, toLang) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const result = {};
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
                                resolve(translateTextByBaidu(pre, toLang));
                            }, 1500);
                        });
                    };
                    lastIndex = index;
                    return untranslatedTexts[next];
                }
                else if (index === untranslatedKeys.length - 1) {
                    taskLists[lastIndex] = () => {
                        return new Promise(resolve => {
                            setTimeout(() => {
                                resolve(translateTextByBaidu(`${pre}\n${untranslatedTexts[next]}`, toLang));
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
                    const data = yield taskItemFun();
                    (data || []).forEach(({ dst }, index) => {
                        const currTextKey = untranslatedKeys[Number(langIndexKey) + index];
                        result[currTextKey] = textToUpperCaseByFirstWord(dst);
                    });
                }
            }
            resolve(result);
        }));
    });
}
exports.baiduTranslateTexts = baiduTranslateTexts;
/**
 * 执行翻译任务，自动导入翻译结果
 * @param dstLang
 */
function runTranslateApi(dstLang, origin) {
    return __awaiter(this, void 0, void 0, function* () {
        const untranslatedTexts = mock_1.getAllUntranslatedTexts(dstLang);
        let mocks = {};
        if (origin === 'Google') {
            mocks = yield googleTranslateTexts(untranslatedTexts, dstLang);
        }
        else {
            mocks = yield baiduTranslateTexts(untranslatedTexts, dstLang);
        }
        const messagesToTranslate = Object.keys(mocks).map(key => [key, mocks[key]]);
        if (messagesToTranslate.length === 0) {
            return Promise.resolve();
        }
        const content = d3_dsv_1.tsvFormatRows(messagesToTranslate);
        // 输出tsv文件
        return new Promise((resolve, reject) => {
            const filePath = path.resolve(utils_1.getLangDir(dstLang), `${dstLang}_translate.tsv`);
            fs.writeFile(filePath, content, err => {
                if (err) {
                    reject(err);
                }
                else {
                    console.log(`${dstLang} 自动翻译完成`);
                    // 自动导入翻译结果
                    import_1.importMessages(filePath, dstLang);
                    resolve();
                }
            });
        });
    });
}
/**
 * 全量翻译
 * @param origin 翻译源
 */
function translate(origin) {
    return __awaiter(this, void 0, void 0, function* () {
        const langs = CONFIG.distLangs;
        if (origin === 'Google') {
            const mockPromise = langs.map(lang => {
                return runTranslateApi(lang, origin);
            });
            return Promise.all(mockPromise);
        }
        else {
            for (var i = 0; i < langs.length; i++) {
                yield runTranslateApi(langs[i], origin);
            }
            return Promise.resolve();
        }
    });
}
exports.translate = translate;
//# sourceMappingURL=translate.js.map