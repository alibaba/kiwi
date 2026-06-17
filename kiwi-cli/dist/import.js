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
exports.importMessages = importMessages;
/**
 * @author linhuiw
 * @desc 导入翻译文件
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
const d3_dsv_1 = require("d3-dsv");
const utils_1 = require("./utils");
const CONFIG = (0, utils_1.getProjectConfig)();
function getMessagesToImport(file) {
    const content = fs.readFileSync(file).toString();
    const messages = (0, d3_dsv_1.tsvParseRows)(content, ([key, value]) => {
        try {
            // value 的形式和 JSON 中的字符串值一致，其中的特殊字符是以转义形式存在的，
            // 如换行符 \n，在 value 中占两个字符，需要转成真正的换行符。
            // 把文案中自带的"转换成\", 防止JSON解析报错
            value = JSON.parse(`"${value.replace(/"/g, '\\"')}"`);
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
function writeMessagesToFile(messages, file, lang) {
    const kiwiDir = CONFIG.kiwiDir;
    const srcMessages = require(path.resolve(kiwiDir, CONFIG.srcLang, file)).default;
    const dstFile = path.resolve(kiwiDir, lang, file);
    const oldDstMessages = require(dstFile).default;
    const rst = {};
    (0, utils_1.traverse)(srcMessages, (message, key) => {
        _.setWith(rst, key, _.get(messages, key) || _.get(oldDstMessages, key), Object);
    });
    fs.writeFileSync(dstFile + '.ts', 'export default ' + JSON.stringify(rst, null, 2));
}
function importMessages(file, lang) {
    let messagesToImport = getMessagesToImport(file);
    const allMessages = (0, utils_1.getAllMessages)(CONFIG.srcLang);
    messagesToImport = _.pickBy(messagesToImport, (message, key) => allMessages.hasOwnProperty(key));
    const keysByFiles = _.groupBy(Object.keys(messagesToImport), key => key.split('.')[0]);
    const messagesByFiles = _.mapValues(keysByFiles, (keys, file) => {
        const rst = {};
        _.forEach(keys, key => {
            _.setWith(rst, key.substr(file.length + 1), messagesToImport[key], Object);
        });
        return rst;
    });
    _.forEach(messagesByFiles, (messages, file) => {
        writeMessagesToFile(messages, file, lang);
    });
}
//# sourceMappingURL=import.js.map