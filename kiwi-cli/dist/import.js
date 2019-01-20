"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author linhuiw
 * @desc 导入翻译文件
 */
require('ts-node').register({
    compilerOptions: {
        module: 'commonjs'
    }
});
const fs_1 = require("fs");
const path = require("path");
const d3_dsv_1 = require("d3-dsv");
const _ = require("lodash");
const utils_1 = require("./utils");
const file = process.argv[2];
const lang = process.argv[3];
function getMessagesToImport(file) {
    const content = fs_1.readFileSync(file).toString();
    const messages = d3_dsv_1.tsvParseRows(content, ([key, value]) => {
        try {
            // value 的形式和 JSON 中的字符串值一致，其中的特殊字符是以转义形式存在的，
            // 如换行符 \n，在 value 中占两个字符，需要转成真正的换行符。
            value = JSON.parse(`"${value}"`);
        }
        catch (e) {
            throw new Error(`Illegal message: ${value}`);
        }
        return [key, value];
    });
    const rst = {};
    const duplicateKeys = new Set();
    messages.forEach(([key, value]) => {
        if (rst.hasOwnProperty(key)) {
            duplicateKeys.add(key);
        }
        rst[key] = value;
    });
    if (duplicateKeys.size > 0) {
        const errorMessage = 'Duplicate messages detected: \n' + [...duplicateKeys].join('\n');
        console.error(errorMessage);
        process.exit(1);
    }
    return rst;
}
function sortObject(obj) {
    const rst = {};
    Object.keys(obj)
        .sort()
        .forEach(key => {
        rst[key] = obj[key];
    });
    return rst;
}
function importMessages(file, lang) {
    const messagesToImport = getMessagesToImport(file);
    const allMessages = utils_1.getAllMessages();
    const translationFilePath = path.resolve(utils_1.getKiwiDir(), `text_${lang}.json`);
    const oldTranslations = require(translationFilePath);
    const newTranslations = Object.assign({}, oldTranslations);
    let count = 0;
    _.forEach(messagesToImport, (message, key) => {
        if (allMessages.hasOwnProperty(key)) {
            count++;
            newTranslations[key] = message;
        }
    });
    if (count === 0) {
        console.log('No messages need to be imported.');
        return;
    }
    const fileContent = JSON.stringify(sortObject(newTranslations), null, 2);
    fs_1.writeFileSync(translationFilePath, fileContent);
    console.log(`Imported ${count} message(s).`);
}
exports.importMessages = importMessages;
//# sourceMappingURL=import.js.map