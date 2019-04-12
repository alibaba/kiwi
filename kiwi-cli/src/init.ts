/**
 * @author linhuiw
 * @desc 初始化 kiwi 项目的文件以及配置
 */
import * as fs from 'fs';
import { PROJECT_CONFIG } from './const';

function creteConfigFile() {
  if (!fs.existsSync(PROJECT_CONFIG.configFile)) {
    const config = JSON.stringify(PROJECT_CONFIG.defaultConfig, null, 2);
    fs.writeFile(PROJECT_CONFIG.configFile, config, err => {
      if (err) {
        console.log(err);
      }
    });
  }
}

function createCnFile() {
  const cnDir = `${PROJECT_CONFIG.dir}/zh-CN`;
  if (!fs.existsSync(cnDir)) {
    fs.mkdirSync(cnDir);
    fs.writeFile(`${cnDir}/index.ts`, PROJECT_CONFIG.zhIndexFile, err => {
      if (err) {
        console.log(err);
      }
    });
    fs.writeFile(`${cnDir}/common.ts`, PROJECT_CONFIG.zhTestFile, err => {
      if (err) {
        console.log(err);
      }
    });
  }
}

function initProject() {
  /** 初始化配置文件夹 */
  if (!fs.existsSync(PROJECT_CONFIG.dir)) {
    fs.mkdirSync(PROJECT_CONFIG.dir);
  }
  creteConfigFile();
  createCnFile();
}

export { initProject };
