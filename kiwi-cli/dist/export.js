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
exports.exportMessages = exportMessages;
/**
 * @author linhuiw
 * @desc 导出未翻译文件
 */
require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
        module: 'commonjs'
    }
});
const fs = __importStar(require("fs"));
const d3_dsv_1 = require("d3-dsv");
const utils_1 = require("./utils");
function exportMessages(file, lang) {
    const CONFIG = (0, utils_1.getProjectConfig)();
    const langs = lang ? [lang] : CONFIG.distLangs;
    langs.map(lang => {
        const allMessages = (0, utils_1.getAllMessages)(CONFIG.srcLang);
        const existingTranslations = (0, utils_1.getAllMessages)(lang, (message, key) => !/[\u4E00-\u9FA5]/.test(allMessages[key]) || allMessages[key] !== message);
        const messagesToTranslate = Object.keys(allMessages)
            .filter(key => !existingTranslations.hasOwnProperty(key))
            .map(key => {
            let message = allMessages[key];
            message = JSON.stringify(message).slice(1, -1);
            return [key, message];
        });
        if (messagesToTranslate.length === 0) {
            console.log('All the messages have been translated.');
            return;
        }
        const content = (0, d3_dsv_1.tsvFormatRows)(messagesToTranslate);
        const sourceFile = file || `./export-${lang}`;
        fs.writeFileSync(sourceFile, content);
        console.log(`Exported ${messagesToTranslate.length} message(s).`);
    });
}
//# sourceMappingURL=export.js.map