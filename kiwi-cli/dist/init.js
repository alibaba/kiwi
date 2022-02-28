"use strict";
/**
 * @author linhuiw
 * @desc 初始化 kiwi 项目的文件以及配置
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const const_1 = require("./const");
function creteConfigFile(existDir) {
    const configDir = path.resolve(process.cwd(), `./${const_1.KIWI_CONFIG_FILE}`);
    if (existDir && fs.existsSync(existDir) && !fs.existsSync(configDir)) {
        const config = JSON.stringify(Object.assign({}, const_1.PROJECT_CONFIG.defaultConfig, { kiwiDir: existDir }), null, 2);
        fs.writeFile(configDir, config, err => {
            if (err) {
                console.log(err);
            }
        });
    }
    else if (!fs.existsSync(configDir)) {
        const config = JSON.stringify(const_1.PROJECT_CONFIG.defaultConfig, null, 2);
        fs.writeFile(configDir, config, err => {
            if (err) {
                console.log(err);
            }
        });
    }
}
function createCnFile() {
    const cnDir = `${const_1.PROJECT_CONFIG.dir}/zh-CN`;
    if (!fs.existsSync(cnDir)) {
        fs.mkdirSync(cnDir);
        fs.writeFile(`${cnDir}/index.ts`, const_1.PROJECT_CONFIG.zhIndexFile, err => {
            if (err) {
                console.log(err);
            }
        });
        fs.writeFile(`${cnDir}/common.ts`, const_1.PROJECT_CONFIG.zhTestFile, err => {
            if (err) {
                console.log(err);
            }
        });
    }
}
function initProject(existDir) {
    /** 初始化配置文件夹 */
    if (existDir) {
        if (!fs.existsSync(existDir)) {
            console.log('输入的目录不存在，已为你生成默认文件夹');
            fs.mkdirSync(const_1.PROJECT_CONFIG.dir);
        }
    }
    else if (!fs.existsSync(const_1.PROJECT_CONFIG.dir)) {
        fs.mkdirSync(const_1.PROJECT_CONFIG.dir);
    }
    creteConfigFile(existDir);
    if (!(existDir && fs.existsSync(existDir))) {
        createCnFile();
    }
}
exports.initProject = initProject;
//# sourceMappingURL=init.js.map