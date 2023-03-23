/**
 * @author linhuiw
 * @desc 初始化 kiwi 项目的文件以及配置
 */

import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import { PROJECT_CONFIG, KIWI_CONFIG_FILE } from './const';

function creteConfigFile(existDir?: string, type?: string) {
  const configDir = path.resolve(process.cwd(), `./${KIWI_CONFIG_FILE}`);
  const config = JSON.stringify(
    {
      ...PROJECT_CONFIG.defaultConfig,
      kiwiDir: existDir,
      fileType: type
    },
    null,
    2
  );
  if (existDir && fs.existsSync(existDir) && !fs.existsSync(configDir)) {
    fs.writeFile(configDir, config, err => {
      if (err) {
        console.log(err);
      }
    });
  } else if (!fs.existsSync(configDir)) {
    fs.writeFile(configDir, config, err => {
      if (err) {
        console.log(err);
      }
    });
  }
}

function createCnFile(type?: string) {
  const cnDir = `${PROJECT_CONFIG.dir}/zh-CN`;
  if (!fs.existsSync(cnDir)) {
    fs.mkdirSync(cnDir);
    fs.writeFile(`${cnDir}/index.${type}`, PROJECT_CONFIG.zhIndexFile, err => {
      if (err) {
        console.log(err);
      }
    });
    fs.writeFile(`${cnDir}/common.${type}`, PROJECT_CONFIG.zhTestFile, err => {
      if (err) {
        console.log(err);
      }
    });
  }
}

function initProject(existDir?: string, type?: string) {
  /** 初始化配置文件夹 */
  if (existDir) {
    if (!fs.existsSync(existDir)) {
      console.log('输入的目录不存在，已为你生成默认文件夹');
      fs.mkdirSync(PROJECT_CONFIG.dir);
    }
  } else if (!fs.existsSync(PROJECT_CONFIG.dir)) {
    fs.mkdirSync(PROJECT_CONFIG.dir);
  }
  const defaultFileType = type || PROJECT_CONFIG.defaultConfig.fileType;
  creteConfigFile(existDir, defaultFileType);
  if (!(existDir && fs.existsSync(existDir))) {
    createCnFile(defaultFileType);
  }
}

export { initProject };
