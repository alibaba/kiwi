"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockLangs = mockLangs;
exports.getAllUntranslatedTexts = getAllUntranslatedTexts;
/**
 * @author linhuiw
 * @desc 翻译方法
 * @TODO: index 文件需要添加 mock
 */
require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
        module: 'commonjs'
    }
});
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const _ = __importStar(require("lodash"));
const utils_1 = require("./utils");
const translate_1 = require("./translate");
const CONFIG = (0, utils_1.getProjectConfig)();
/**
 * 获取中文文案
 */
function getSourceText() {
    const srcLangDir = (0, utils_1.getLangDir)(CONFIG.srcLang);
    const srcFile = path.resolve(srcLangDir, 'index.ts');
    // 清除 require 缓存，确保读取最新文件内容
    const resolvedSrcFile = require.resolve(srcFile);
    delete require.cache[resolvedSrcFile];
    const { default: texts } = require(srcFile);
    return texts;
}
/**
 * 获取对应语言文案
 * @param dstLang
 */
function getDistText(dstLang) {
    const distLangDir = (0, utils_1.getLangDir)(dstLang);
    const distFile = path.resolve(distLangDir, 'index.ts');
    let distTexts = {};
    if (fs.existsSync(distFile)) {
        // 清除 require 缓存，确保读取最新文件内容
        const resolvedDistFile = require.resolve(distFile);
        delete require.cache[resolvedDistFile];
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
    (0, utils_1.traverse)(texts, (text, path) => {
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
function mockCurrentLang(dstLang, origin) {
    return __awaiter(this, void 0, void 0, function* () {
        const untranslatedTexts = getAllUntranslatedTexts(dstLang);
        let mocks = {};
        if (origin === 'Google') {
            mocks = yield (0, translate_1.googleTranslateTexts)(untranslatedTexts, dstLang);
        }
        else {
            mocks = yield (0, translate_1.baiduTranslateTexts)(untranslatedTexts, dstLang);
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
    const filePath = path.resolve((0, utils_1.getLangDir)(dstLang), 'mock.ts');
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
//# sourceMappingURL=mock.js.map