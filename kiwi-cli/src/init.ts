/**
 * @author linhuiw
 * @desc 初始化 kiwi 项目的文件以及配置
 */
import * as fs from 'fs';
import { PROJECT_CONFIG } from './const';

function creteConfigFile(dir: string) {
  if (!fs.existsSync(`${dir}/config.json`)) {
    const config = JSON.stringify(PROJECT_CONFIG.defaultConfig, null, 2);
    fs.writeFile(`${dir || PROJECT_CONFIG.dir}/config.json`, config, err => {
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
  const existDir = PROJECT_CONFIG.dir || PROJECT_CONFIG.existDir;
  /** 初始化配置文件夹 */
  if (!fs.existsSync(existDir)) {
    fs.mkdirSync(PROJECT_CONFIG.dir);
  }
  creteConfigFile(existDir);
  if (!fs.existsSync(PROJECT_CONFIG.existDir)) {
    createCnFile();
  }
}

export { initProject };
