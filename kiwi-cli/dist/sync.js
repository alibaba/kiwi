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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sync = sync;
/**
 * @author linhuiw
 * @desc 翻译文件
 */
require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
        module: 'commonjs'
    }
});
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const _ = __importStar(require("lodash"));
const utils_1 = require("./utils");
const CONFIG = (0, utils_1.getProjectConfig)();
/**
 * 获取中文文案文件的翻译，优先使用已有翻译，若找不到则使用 google 翻译
 * */
function getTranslations(file, toLang) {
    const translations = {};
    const fileNameWithoutExt = path.basename(file).split('.')[0];
    const srcLangDir = (0, utils_1.getLangDir)(CONFIG.srcLang);
    const distLangDir = (0, utils_1.getLangDir)(toLang);
    const srcFile = path.resolve(srcLangDir, file);
    const distFile = path.resolve(distLangDir, file);
    // 清除 require 缓存，确保读取最新文件内容
    delete require.cache[require.resolve(srcFile)];
    const { default: texts } = require(srcFile);
    let distTexts;
    if (fs.existsSync(distFile)) {
        delete require.cache[require.resolve(distFile)];
        distTexts = require(distFile).default;
    }
    (0, utils_1.traverse)(texts, (text, path) => {
        const key = fileNameWithoutExt + '.' + path;
        const distText = _.get(distTexts, path);
        translations[key] = distText || text;
    });
    return translations;
}
/**
 * 将翻译写入文件
 * */
function writeTranslations(file, toLang, translations) {
    const fileNameWithoutExt = path.basename(file).split('.')[0];
    const srcLangDir = (0, utils_1.getLangDir)(CONFIG.srcLang);
    const srcFile = path.resolve(srcLangDir, file);
    const { default: texts } = require(srcFile);
    const rst = {};
    (0, utils_1.traverse)(texts, (text, path) => {
        const key = fileNameWithoutExt + '.' + path;
        // 使用 setWith 而不是 set，保证 numeric key 创建的不是数组，而是对象
        // https://github.com/lodash/lodash/issues/1316#issuecomment-120753100
        _.setWith(rst, path, translations[key], Object);
    });
    const fileContent = 'export default ' + JSON.stringify(rst, null, 2);
    const filePath = path.resolve((0, utils_1.getLangDir)(toLang), path.basename(file));
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
 * 翻译对应的文件
 * @param file
 * @param toLang
 */
function translateFile(file, toLang) {
    const translations = getTranslations(file, toLang);
    const toLangDir = path.resolve(__dirname, `../${toLang}`);
    if (!fs.existsSync(toLangDir)) {
        fs.mkdirSync(toLangDir);
    }
    writeTranslations(file, toLang, translations);
}
/**
 * 翻译所有文件
 */
function sync(callback) {
    const srcLangDir = (0, utils_1.getLangDir)(CONFIG.srcLang);
    fs.readdir(srcLangDir, (err, files) => {
        if (err) {
            console.error(err);
        }
        else {
            files = files.filter(file => file.endsWith('.ts') && file !== 'index.ts' && file !== 'mock.ts').map(file => file);
            const translateFiles = toLang => Promise.all(files.map(file => {
                translateFile(file, toLang);
            }));
            Promise.all(CONFIG.distLangs.map(translateFiles)).then(() => {
                const langDirs = CONFIG.distLangs.map(utils_1.getLangDir);
                langDirs.map(dir => {
                    const filePath = path.resolve(dir, 'index.ts');
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }
                    fs.copyFileSync(path.resolve(srcLangDir, 'index.ts'), filePath);
                });
                callback && callback();
            }, e => {
                console.error(e);
                process.exit(1);
            });
        }
    });
}
//# sourceMappingURL=sync.js.map