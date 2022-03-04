#!/usr/bin/env node
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
const commander = require("commander");
const inquirer = require("inquirer");
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
const ora = require("ora");
/**
 * 进度条加载
 * @param text
 * @param callback
 */
function spining(text, callback) {
    const spinner = ora(`${text}中...`).start();
    if (callback) {
        if (callback() !== false) {
            spinner.succeed(`${text}成功`);
        }
        else {
            spinner.fail(`${text}失败`);
        }
    }
}
commander
    .version('0.2.0')
    .option('--init', '初始化项目', { isDefault: true })
    .option('--import [file] [lang]', '导入翻译文案')
    .option('--export [file] [lang]', '导出未翻译的文案')
    .option('--sync', '同步各种语言的文案')
    .option('--mock', '使用 Google 或者 Baidu 翻译 输出mock文件')
    .option('--translate', '使用 Google 或者 Baidu 翻译 翻译结果自动替换目标语种文案')
    .option('--unused', '导出未使用的文案')
    .option('--extract [dirPath]', '一键替换指定文件夹下的所有中文文案')
    .option('--prefix [prefix]', '指定替换中文文案前缀')
    .parse(process.argv);
if (commander.init) {
    (() => __awaiter(this, void 0, void 0, function* () {
        const result = yield inquirer.prompt({
            type: 'confirm',
            name: 'confirm',
            default: true,
            message: '项目中是否已存在kiwi相关目录？'
        });
        if (!result.confirm) {
            spining('初始化项目', () => __awaiter(this, void 0, void 0, function* () {
                init_1.initProject();
            }));
        }
        else {
            const value = yield inquirer.prompt({
                type: 'input',
                name: 'dir',
                message: '请输入相关目录：'
            });
            spining('初始化项目', () => __awaiter(this, void 0, void 0, function* () {
                init_1.initProject(value.dir);
            }));
        }
    }))();
}
if (commander.import) {
    spining('导入翻译文案', () => {
        if (commander.import === true || commander.args.length === 0) {
            console.log('请按格式输入：--import [file] [lang]');
            return false;
        }
        else if (commander.args) {
            import_1.importMessages(commander.import, commander.args[0]);
        }
    });
}
if (commander.export) {
    spining('导出未翻译的文案', () => {
        if (commander.export === true && commander.args.length === 0) {
            export_1.exportMessages();
        }
        else if (commander.args) {
            export_1.exportMessages(commander.export, commander.args[0]);
        }
    });
}
if (commander.sync) {
    spining('文案同步', () => {
        sync_1.sync();
    });
}
if (commander.unused) {
    spining('导出未使用的文案', () => {
        unused_1.findUnUsed();
    });
}
if (commander.mock) {
    sync_1.sync(() => __awaiter(this, void 0, void 0, function* () {
        const { pass, origin } = yield utils_1.getTranslateOriginType();
        if (pass) {
            const spinner = ora(`使用 ${origin} 翻译中...`).start();
            yield mock_1.mockLangs(origin);
            spinner.succeed(`使用 ${origin} 翻译成功`);
        }
    }));
}
if (commander.translate) {
    sync_1.sync(() => __awaiter(this, void 0, void 0, function* () {
        const { pass, origin } = yield utils_1.getTranslateOriginType();
        if (pass) {
            const spinner = ora(`使用 ${origin} 翻译中...`).start();
            yield translate_1.translate(origin);
            spinner.succeed(`使用 ${origin} 翻译成功`);
        }
    }));
}
if (commander.extract) {
    console.log(lodash_1.isString(commander.prefix));
    if (commander.prefix === true) {
        console.log('请指定翻译后文案 key 值的前缀 --prefix xxxx');
    }
    else if (lodash_1.isString(commander.prefix) && !new RegExp(/^I18N(\.[-_a-zA-Z1-9$]+)+$/).test(commander.prefix)) {
        console.log('前缀必须以I18N开头,后续跟上字母、下滑线、破折号、$ 字符组成的变量名');
    }
    else {
        const extractAllParams = {
            prefix: lodash_1.isString(commander.prefix) && commander.prefix,
            dirPath: lodash_1.isString(commander.extract) && commander.extract
        };
        extract_1.extractAll(extractAllParams);
    }
}
//# sourceMappingURL=index.js.map