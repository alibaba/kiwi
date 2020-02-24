/**
 * @author linhuiw
 * @desc 初始化 kiwi 项目的文件以及配置
 */

import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import { lookForFiles } from './utils';
import { PROJECT_CONFIG, KIWI_CONFIG_FILE } from './const';

function creteConfigFile(existDir?: string) {
  if (!lookForFiles(path.resolve(process.cwd(), `./`), KIWI_CONFIG_FILE)) {
    const existConfigFile = _.endsWith(existDir, '/')
      ? `${existDir}${KIWI_CONFIG_FILE}`
      : `${existDir}/${KIWI_CONFIG_FILE}`;
    if (existDir && fs.existsSync(existDir) && !fs.existsSync(existConfigFile)) {
      const config = JSON.stringify(
        {
          ...PROJECT_CONFIG.defaultConfig,
          kiwiDir: existDir,
          configFile: existConfigFile
        },
        null,
        2
      );
      fs.writeFile(existConfigFile, config, err => {
        if (err) {
          console.log(err);
        }
      });
    } else if (!fs.existsSync(PROJECT_CONFIG.configFile)) {
      const config = JSON.stringify(PROJECT_CONFIG.defaultConfig, null, 2);
      fs.writeFile(PROJECT_CONFIG.configFile, config, err => {
        if (err) {
          console.log(err);
        }
      });
    }
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

function initProject(existDir?: string) {
  /** 初始化配置文件夹 */
  if (existDir) {
    if (!fs.existsSync(existDir)) {
      console.log('输入的目录不存在，已为你生成默认文件夹');
      fs.mkdirSync(PROJECT_CONFIG.dir);
    }
  } else if (!fs.existsSync(PROJECT_CONFIG.dir)) {
    fs.mkdirSync(PROJECT_CONFIG.dir);
  }
  creteConfigFile(existDir);
  if (!(existDir && fs.existsSync(existDir))) {
    createCnFile();
  }
}

export { initProject };
