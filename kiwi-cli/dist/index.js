#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = require("lodash");
const init_1 = require("./init");
const sync_1 = require("./sync");
const export_1 = require("./export");
const import_1 = require("./import");
const unused_1 = require("./unused");
const mock_1 = require("./mock");
const extract_1 = require("./extract/extract");
const translate_1 = require("./translate");
const utils_1 = require("./utils");
const ora_1 = __importDefault(require("ora"));
/**
 * 进度条加载
 * @param text
 * @param callback
 */
function spining(text, callback) {
    const spinner = (0, ora_1.default)(`${text}中...`).start();
    if (callback) {
        if (callback() !== false) {
            spinner.succeed(`${text}成功`);
        }
        else {
            spinner.fail(`${text}失败`);
        }
    }
}
commander_1.default
    .version('1.1.1')
    .option('--init [type]', '初始化项目')
    .option('--import [file] [lang]', '导入翻译文案')
    .option('--export [file] [lang]', '导出未翻译的文案')
    .option('--sync', '同步各种语言的文案')
    .option('--mock', '使用 Google 或者 Baidu 翻译 输出mock文件')
    .option('--translate', '使用 Google 或者 Baidu 翻译 翻译结果自动替换目标语种文案')
    .option('--unused', '导出未使用的文案')
    .option('--extract [dirPath]', '一键替换指定文件夹下的所有中文文案')
    .option('--prefix [prefix]', '指定替换中文文案前缀')
    .parse(process.argv);
if (commander_1.default.init) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield inquirer_1.default.prompt({
            type: 'confirm',
            name: 'confirm',
            default: true,
            message: '项目中是否已存在kiwi相关目录？'
        });
        if (!result.confirm) {
            spining('初始化项目', () => __awaiter(void 0, void 0, void 0, function* () {
                if (['js', 'ts'].includes(commander_1.default.init)) {
                    (0, init_1.initProject)(void 0, commander_1.default.init);
                }
                else if (commander_1.default.init === true) {
                    (0, init_1.initProject)();
                }
                else {
                    console.log('指定初始化类型 [type] 只支持js、ts');
                    return false;
                }
            }));
        }
        else {
            const value = yield inquirer_1.default.prompt({
                type: 'input',
                name: 'dir',
                message: '请输入相关目录：'
            });
            spining('初始化项目', () => __awaiter(void 0, void 0, void 0, function* () {
                if (['js', 'ts'].includes(commander_1.default.init)) {
                    (0, init_1.initProject)(value.dir, commander_1.default.init);
                }
                else if (commander_1.default.init === true) {
                    (0, init_1.initProject)(value.dir);
                }
                else {
                    console.log('指定初始化类型 [type] 只支持js、ts');
                    return false;
                }
            }));
        }
    }))();
}
if (commander_1.default.import) {
    spining('导入翻译文案', () => {
        if (commander_1.default.import === true || commander_1.default.args.length === 0) {
            console.log('请按格式输入：--import [file] [lang]');
            return false;
        }
        else if (commander_1.default.args) {
            (0, import_1.importMessages)(commander_1.default.import, commander_1.default.args[0]);
        }
    });
}
if (commander_1.default.export) {
    spining('导出未翻译的文案', () => {
        if (commander_1.default.export === true && commander_1.default.args.length === 0) {
            (0, export_1.exportMessages)();
        }
        else if (commander_1.default.args) {
            (0, export_1.exportMessages)(commander_1.default.export, commander_1.default.args[0]);
        }
    });
}
if (commander_1.default.sync) {
    spining('文案同步', () => {
        (0, sync_1.sync)();
    });
}
if (commander_1.default.unused) {
    spining('导出未使用的文案', () => {
        (0, unused_1.findUnUsed)();
    });
}
if (commander_1.default.mock) {
    (0, sync_1.sync)(() => __awaiter(void 0, void 0, void 0, function* () {
        const { pass, origin } = yield (0, utils_1.getTranslateOriginType)();
        if (pass) {
            const spinner = (0, ora_1.default)(`使用 ${origin} 翻译中...`).start();
            yield (0, mock_1.mockLangs)(origin);
            spinner.succeed(`使用 ${origin} 翻译成功`);
        }
    }));
}
if (commander_1.default.translate) {
    (0, sync_1.sync)(() => __awaiter(void 0, void 0, void 0, function* () {
        const { pass, origin } = yield (0, utils_1.getTranslateOriginType)();
        if (pass) {
            const spinner = (0, ora_1.default)(`使用 ${origin} 翻译中...`).start();
            yield (0, translate_1.translate)(origin);
            spinner.succeed(`使用 ${origin} 翻译成功`);
        }
    }));
}
if (commander_1.default.extract) {
    if (commander_1.default.prefix === true) {
        console.log('请指定翻译后文案 key 值的前缀 --prefix xxxx');
    }
    else if ((0, lodash_1.isString)(commander_1.default.prefix) && !new RegExp(/^I18N(\.[-_a-zA-Z1-9$]+)+$/).test(commander_1.default.prefix)) {
        console.log('前缀必须以I18N开头,后续跟上字母、下滑线、破折号、$ 字符组成的变量名');
    }
    else {
        const extractAllParams = {
            prefix: (0, lodash_1.isString)(commander_1.default.prefix) && commander_1.default.prefix,
            dirPath: (0, lodash_1.isString)(commander_1.default.extract) && commander_1.default.extract
        };
        (0, extract_1.extractAll)(extractAllParams);
    }
}
//# sourceMappingURL=index.js.map