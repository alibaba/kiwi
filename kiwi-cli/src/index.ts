#!/usr/bin/env node

import * as commander from 'commander';
import * as inquirer from 'inquirer';
import { isString } from 'lodash';
import { initProject } from './init';
import { sync } from './sync';
import { exportMessages } from './export';
import { importMessages } from './import';
import { findUnUsed } from './unused';
import { mockLangs } from './mock';
import { extractAll } from './extract/extract';
import { translate } from './translate';
import { getTranslateOriginType } from './utils';
import * as ora from 'ora';

/**
 * 进度条加载
 * @param text
 * @param callback
 */
function spining(text, callback) {
  const spinner = ora(`${text}中...`).start();
  if (callback) {
    if (callback() !== false) {
      spinner.succeed(`${text}成功`);
    } else {
      spinner.fail(`${text}失败`);
    }
  }
}

commander
  .version('0.2.0')
  .option('--init [type]', '初始化项目')
  .option('--import [file] [lang]', '导入翻译文案')
  .option('--export [file] [lang]', '导出未翻译的文案')
  .option('--sync', '同步各种语言的文案')
  .option('--mock', '使用 Google 或者 Baidu 翻译 输出mock文件')
  .option('--translate', '使用 Google 或者 Baidu 翻译 翻译结果自动替换目标语种文案')
  .option('--unused', '导出未使用的文案')
  .option('--extract [dirPath]', '一键替换指定文件夹下的所有中文文案')
  .option('--prefix [prefix]', '指定替换中文文案前缀')
  .parse(process.argv);

if (commander.init) {
  (async () => {
    const result = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      default: true,
      message: '项目中是否已存在kiwi相关目录？'
    });

    if (!result.confirm) {
      spining('初始化项目', async () => {
        if (['js', 'ts'].includes(commander.init)) {
          initProject(void 0, commander.init);
        } else if (commander.init === true) {
          initProject();
        } else {
          console.log('指定初始化类型 [type] 只支持js、ts');
          return false;
        }
      });
    } else {
      const value = await inquirer.prompt({
        type: 'input',
        name: 'dir',
        message: '请输入相关目录：'
      });
      spining('初始化项目', async () => {
        if (['js', 'ts'].includes(commander.init)) {
          initProject(value.dir, commander.init);
        } else if (commander.init === true) {
          initProject(value.dir);
        } else {
          console.log('指定初始化类型 [type] 只支持js、ts');
          return false;
        }
      });
    }
  })();
}

if (commander.import) {
  spining('导入翻译文案', () => {
    if (commander.import === true || commander.args.length === 0) {
      console.log('请按格式输入：--import [file] [lang]');
      return false;
    } else if (commander.args) {
      importMessages(commander.import, commander.args[0]);
    }
  });
}

if (commander.export) {
  spining('导出未翻译的文案', () => {
    if (commander.export === true && commander.args.length === 0) {
      exportMessages();
    } else if (commander.args) {
      exportMessages(commander.export, commander.args[0]);
    }
  });
}

if (commander.sync) {
  spining('文案同步', () => {
    sync();
  });
}

if (commander.unused) {
  spining('导出未使用的文案', () => {
    findUnUsed();
  });
}

if (commander.mock) {
  sync(async () => {
    const { pass, origin } = await getTranslateOriginType();
    if (pass) {
      const spinner = ora(`使用 ${origin} 翻译中...`).start();
      await mockLangs(origin);
      spinner.succeed(`使用 ${origin} 翻译成功`);
    }
  });
}

if (commander.translate) {
  sync(async () => {
    const { pass, origin } = await getTranslateOriginType();
    if (pass) {
      const spinner = ora(`使用 ${origin} 翻译中...`).start();
      await translate(origin);
      spinner.succeed(`使用 ${origin} 翻译成功`);
    }
  });
}

if (commander.extract) {
  console.log(isString(commander.prefix));
  if (commander.prefix === true) {
    console.log('请指定翻译后文案 key 值的前缀 --prefix xxxx');
  } else if (isString(commander.prefix) && !new RegExp(/^I18N(\.[-_a-zA-Z1-9$]+)+$/).test(commander.prefix)) {
    console.log('前缀必须以I18N开头,后续跟上字母、下滑线、破折号、$ 字符组成的变量名');
  } else {
    const extractAllParams = {
      prefix: isString(commander.prefix) && commander.prefix,
      dirPath: isString(commander.extract) && commander.extract
    };

    extractAll(extractAllParams);
  }
}
