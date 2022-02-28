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
 * @desc 翻译方法
 * @TODO: index 文件需要添加 mock
 */
require('ts-node').register({
    compilerOptions: {
        module: 'commonjs'
    }
});
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const utils_1 = require("./utils");
const translate_1 = require("./translate");
const CONFIG = utils_1.getProjectConfig();
/**
 * 获取中文文案
 */
function getSourceText() {
    const srcLangDir = utils_1.getLangDir(CONFIG.srcLang);
    const srcFile = path.resolve(srcLangDir, 'index.ts');
    const { default: texts } = require(srcFile);
    return texts;
}
/**
 * 获取对应语言文案
 * @param dstLang
 */
function getDistText(dstLang) {
    const distLangDir = utils_1.getLangDir(dstLang);
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
    utils_1.traverse(texts, (text, path) => {
        const distText = _.get(distTexts, path);
        if (text === distText || !distText) {
            untranslatedTexts[path] = text;
        }
    });
    return untranslatedTexts;
}
exports.getAllUntranslatedTexts = getAllUntranslatedTexts;
/**
 * Mock 对应语言
 * @param dstLang
 */
function mockCurrentLang(dstLang, origin) {
    return __awaiter(this, void 0, void 0, function* () {
        const untranslatedTexts = getAllUntranslatedTexts(dstLang);
        let mocks = {};
        if (origin === 'Google') {
            mocks = yield translate_1.googleTranslateTexts(untranslatedTexts, dstLang);
        }
        else {
            mocks = yield translate_1.baiduTranslateTexts(untranslatedTexts, dstLang);
        }
        /** 所有任务执行完毕后，写入mock文件 */
        return writeMockFile(dstLang, mocks);
    });
}
/**
 * 写入 Mock 文件
 * @param dstLang
 * @param mocks
 */
function writeMockFile(dstLang, mocks) {
    const fileContent = 'export default ' + JSON.stringify(mocks, null, 2);
    const filePath = path.resolve(utils_1.getLangDir(dstLang), 'mock.ts');
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, fileContent, err => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
/**
 * Mock 语言的未翻译的文案
 * @param lang
 */
function mockLangs(origin) {
    return __awaiter(this, void 0, void 0, function* () {
        const langs = CONFIG.distLangs;
        if (origin === 'Google') {
            const mockPromise = langs.map(lang => {
                return mockCurrentLang(lang, origin);
            });
            return Promise.all(mockPromise);
        }
        else {
            for (var i = 0; i < langs.length; i++) {
                yield mockCurrentLang(langs[i], origin);
            }
            return Promise.resolve();
        }
    });
}
exports.mockLangs = mockLangs;
//# sourceMappingURL=mock.js.map