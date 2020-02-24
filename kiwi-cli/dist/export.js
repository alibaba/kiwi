"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author linhuiw
 * @desc 导出未翻译文件
 */
require('ts-node').register({
    compilerOptions: {
        module: 'commonjs'
    }
});
const fs = require("fs");
const path = require("path");
const d3_dsv_1 = require("d3-dsv");
const utils_1 = require("./utils");
const _ = require("lodash");
function getLangUnTranslate(lang) {
    const messagesToTranslate = [];
    const srcLangDir = path.resolve(utils_1.getKiwiDir(), 'zh-CN');
    let files = fs.readdirSync(srcLangDir);
    files = files.filter(file => file.endsWith('.ts') && file !== 'index.ts');
    files.map(file => {
        const srcFile = path.resolve(srcLangDir, file);
        const { default: messages } = require(srcFile);
        const distFile = path.resolve(utils_1.getLangDir(lang), file);
        let dstMessages;
        if (fs.existsSync(distFile)) {
            dstMessages = require(distFile).default;
        }
        utils_1.traverse(messages, (text, path) => {
            const distText = _.get(dstMessages, path);
            if (distText === text) {
                messagesToTranslate.push([path, text]);
            }
        });
    });
    return messagesToTranslate;
}
function exportMessages(lang) {
    const CONFIG = utils_1.getProjectConfig();
    const langs = lang ? [lang] : CONFIG.distLangs;
    langs.map(lang => {
        const unTranslateMessages = getLangUnTranslate(lang);
        if (unTranslateMessages.length === 0) {
            console.log(`${lang} 该语言文件以及全部被翻译`);
        }
        const content = d3_dsv_1.tsvFormatRows(unTranslateMessages);
        fs.writeFileSync(`./export-${lang}`, content);
        console.log(`${lang} 该语言导出 ${unTranslateMessages.length} 未翻译文案.`);
    });
}
exports.exportMessages = exportMessages;
//# sourceMappingURL=export.js.map