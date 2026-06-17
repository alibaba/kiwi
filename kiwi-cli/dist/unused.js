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
exports.findUnUsed = findUnUsed;
/**
 * @author linhuiw
 * @desc 查找未使用的 key
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./utils");
const lookingForString = '';
function findUnUsed() {
    const srcLangDir = path.resolve((0, utils_1.getKiwiDir)(), 'zh-CN');
    let files = fs.readdirSync(srcLangDir);
    files = files.filter(file => file.endsWith('.ts') && file !== 'index.ts');
    const unUnsedKeys = [];
    files.map(file => {
        const srcFile = path.resolve(srcLangDir, file);
        const { default: messages } = require(srcFile);
        const filename = path.basename(file, '.ts');
        (0, utils_1.traverse)(messages, (text, path) => {
            const key = `I18N.${filename}.${path}`;
            const hasKey = recursiveReadFile('./src', key);
            if (!hasKey) {
                unUnsedKeys.push(key);
            }
        });
    });
    console.log(unUnsedKeys, 'unUnsedKeys');
}
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