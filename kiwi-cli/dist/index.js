#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander = require("commander");
const init_1 = require("./init");
const translate_1 = require("./translate");
const export_1 = require("./export");
const unused_1 = require("./unused");
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
    init_1.initProject();
}
if (commander.import) {
    // importMessages();
}
if (commander.export) {
    if (commander.export === true) {
        export_1.exportMessages();
    }
    else {
        export_1.exportMessages(commander.export);
    }
}
if (commander.sync) {
    translate_1.translate();
}
if (commander.unused) {
    unused_1.findUnUsed();
}
if (commander.mock) {
    console.log('  - mock');
}
//# sourceMappingURL=index.js.map