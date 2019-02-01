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
const init_1 = require("./init");
const sync_1 = require("./sync");
const export_1 = require("./export");
const unused_1 = require("./unused");
const mock_1 = require("./mock");
const ora = require("ora");
/**
 * 进度条加载
 * @param text
 * @param callback
 */
function spining(text, callback) {
    const spinner = ora(`${text}中...`).start();
    if (callback) {
        callback();
    }
    spinner.succeed(`${text}成功`);
}
commander
    .version('0.1.0')
    .option('--init', '初始化项目', { isDefault: true })
    .option('--import [file] [lang]', '导入翻译文案')
    .option('--export [lang]', '导出未翻译的文案')
    .option('--sync', '同步各种语言的文案')
    .option('--mock', '使用 Google 翻译')
    .option('--unused', '导出未使用的文案')
    .parse(process.argv);
if (commander.init) {
    spining('初始化项目', () => {
        init_1.initProject();
    });
}
if (commander.import) {
    // importMessages();
}
if (commander.export) {
    spining('导出未翻译的文案', () => {
        if (commander.export === true) {
            export_1.exportMessages();
        }
        else {
            export_1.exportMessages(commander.export);
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
    const spinner = ora('使用 Google 翻译中...').start();
    sync_1.sync(() => __awaiter(this, void 0, void 0, function* () {
        yield mock_1.mockLangs();
        spinner.succeed('使用 Google 翻译成功');
    }));
}
//# sourceMappingURL=index.js.map