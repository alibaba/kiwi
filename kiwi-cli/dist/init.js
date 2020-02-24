"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author linhuiw
 * @desc 初始化 kiwi 项目的文件以及配置
 */
const fs = require("fs");
const const_1 = require("./const");
function creteConfigFile() {
    if (!(fs.existsSync(`${const_1.PROJECT_CONFIG.existDir}/config.json`) || fs.existsSync(const_1.PROJECT_CONFIG.configFile))) {
        const config = JSON.stringify(const_1.PROJECT_CONFIG.defaultConfig, null, 2);
        const writePath = fs.existsSync(const_1.PROJECT_CONFIG.existDir) ? const_1.PROJECT_CONFIG.existDir : const_1.PROJECT_CONFIG.dir;
        fs.writeFile(`${writePath}/config.json`, config, err => {
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
function initProject() {
    /** 初始化配置文件夹 */
    if (!(fs.existsSync(const_1.PROJECT_CONFIG.dir) || fs.existsSync(const_1.PROJECT_CONFIG.existDir))) {
        fs.mkdirSync(const_1.PROJECT_CONFIG.dir);
    }
    creteConfigFile();
    if (!fs.existsSync(const_1.PROJECT_CONFIG.existDir)) {
        createCnFile();
    }
}
exports.initProject = initProject;
//# sourceMappingURL=init.js.map