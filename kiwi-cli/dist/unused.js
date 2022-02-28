"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author linhuiw
 * @desc 查找未使用的 key
 */
const fs = require("fs");
const path = require("path");
const utils_1 = require("./utils");
const lookingForString = '';
function findUnUsed() {
    const srcLangDir = path.resolve(utils_1.getKiwiDir(), 'zh-CN');
    let files = fs.readdirSync(srcLangDir);
    files = files.filter(file => file.endsWith('.ts') && file !== 'index.ts');
    const unUnsedKeys = [];
    files.map(file => {
        const srcFile = path.resolve(srcLangDir, file);
        const { default: messages } = require(srcFile);
        const filename = path.basename(file, '.ts');
        utils_1.traverse(messages, (text, path) => {
            const key = `I18N.${filename}.${path}`;
            const hasKey = recursiveReadFile('./src', key);
            if (!hasKey) {
                unUnsedKeys.push(key);
            }
        });
    });
    console.log(unUnsedKeys, 'unUnsedKeys');
}
exports.findUnUsed = findUnUsed;
/**
 * 递归查找文件
 * @param fileName
 */
function recursiveReadFile(fileName, text) {
    let hasText = false;
    if (!fs.existsSync(fileName))
        return;
    if (isFile(fileName) && !hasText) {
        check(fileName, text, () => {
            hasText = true;
        });
    }
    if (isDirectory(fileName)) {
        var files = fs.readdirSync(fileName).filter(file => {
            return !file.startsWith('.') && !['node_modules', 'build', 'dist'].includes(file);
        });
        files.forEach(function (val, key) {
            var temp = path.join(fileName, val);
            if (isDirectory(temp) && !hasText) {
                hasText = recursiveReadFile(temp, text);
            }
            if (isFile(temp) && !hasText) {
                check(temp, text, () => {
                    hasText = true;
                });
            }
        });
    }
    return hasText;
}
/**
 * 检查文件
 * @param fileName
 */
function check(fileName, text, callback) {
    var data = readFile(fileName);
    var exc = new RegExp(text);
    if (exc.test(data)) {
        callback();
    }
}
/**
 * 判断是文件夹
 * @param fileName
 */
function isDirectory(fileName) {
    if (fs.existsSync(fileName)) {
        return fs.statSync(fileName).isDirectory();
    }
}
/**
 * 判断是否是文件
 * @param fileName
 */
function isFile(fileName) {
    if (fs.existsSync(fileName)) {
        return fs.statSync(fileName).isFile();
    }
}
/**
 * 读取文件
 * @param fileName
 */
function readFile(fileName) {
    if (fs.existsSync(fileName)) {
        return fs.readFileSync(fileName, 'utf-8');
    }
}
//# sourceMappingURL=unused.js.map