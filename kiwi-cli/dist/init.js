"use strict";
/**
 * @author linhuiw
 * @desc 初始化 kiwi 项目的文件以及配置
 */
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
exports.initProject = initProject;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const const_1 = require("./const");
function creteConfigFile(existDir, type) {
    const configDir = path.resolve(process.cwd(), `./${const_1.KIWI_CONFIG_FILE}`);
    const config = JSON.stringify(Object.assign(Object.assign({}, const_1.PROJECT_CONFIG.defaultConfig), { kiwiDir: existDir, fileType: type }), null, 2);
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
//# sourceMappingURL=init.js.map