"use strict";
/**
 * @author linhuiw
 * @desc 初始化 kiwi 项目的文件以及配置
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const const_1 = require("./const");
function creteConfigFile(existDir, type) {
    const configDir = path.resolve(process.cwd(), `./${const_1.KIWI_CONFIG_FILE}`);
    const config = JSON.stringify(Object.assign({}, const_1.PROJECT_CONFIG.defaultConfig, { kiwiDir: existDir, fileType: type }), null, 2);
    if (existDir && fs.existsSync(existDir) && !fs.existsSync(configDir)) {
        fs.writeFile(configDir, config, err => {
            if (err) {
                console.log(err);
            }
        });
    }
    else if (!fs.existsSync(configDir)) {
        fs.writeFile(configDir, config, err => {
            if (err) {
                console.log(err);
            }
        });
    }
}
function createCnFile(type) {
    const cnDir = `${const_1.PROJECT_CONFIG.dir}/zh-CN`;
    if (!fs.existsSync(cnDir)) {
        fs.mkdirSync(cnDir);
        fs.writeFile(`${cnDir}/index.${type}`, const_1.PROJECT_CONFIG.zhIndexFile, err => {
            if (err) {
                console.log(err);
            }
        });
        fs.writeFile(`${cnDir}/common.${type}`, const_1.PROJECT_CONFIG.zhTestFile, err => {
            if (err) {
                console.log(err);
            }
        });
    }
}
function initProject(existDir, type) {
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
    const defaultFileType = type || const_1.PROJECT_CONFIG.defaultConfig.fileType;
    creteConfigFile(existDir, defaultFileType);
    if (!(existDir && fs.existsSync(existDir))) {
        createCnFile(defaultFileType);
    }
}
exports.initProject = initProject;
//# sourceMappingURL=init.js.map