/**
 * @author linhuiw
 * @desc 文件相关操作
 */
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as prettier from 'prettier';
import { getLangData } from './getLangData';
import { getLangPrefix } from './utils';
import { LANG_PREFIX, getDefaultDir } from './const';

export function updateLangFiles(
  keyValue: string,
  text: string,
  validateDuplicate: boolean,
  currentEditor?: vscode.TextEditor,
  translateResult?: Record<string, string>
) {
  if (!keyValue.startsWith('I18N.')) {
    return;
  }

  const activeEditor = currentEditor || vscode.window.activeTextEditor;

  const [, filename, ...restPath] = keyValue.split('.');
  const fullKey = restPath.join('.');

  const targetFilename = `${getLangPrefix(activeEditor) || LANG_PREFIX}${filename}.ts`;

  const targetFilenamesWithOtherLang = translateResult
    ? Object.keys(translateResult).map(
        lang => `${getLangPrefix(activeEditor, lang) || getDefaultDir(lang)}${filename}.ts`
      )
    : [];

  /** 需要写入文件的各个语言的文案 */
  const langMap = {
    zh_CN: text,
    ...(translateResult || {})
  };

  /** 各个语言所得的语言文件 */
  const targetFiles = [targetFilename, ...targetFilenamesWithOtherLang];

  Object.keys(langMap).forEach((lang, i) => {
    if (!fs.existsSync(targetFiles[i])) {
      fs.outputFileSync(targetFiles[i], generateNewLangFile(fullKey, langMap[lang]));
      addImportToMainLangFile(filename, activeEditor, lang);
      vscode.window.showInformationMessage(`成功新建语言文件 ${targetFiles[i]}`);
    } else {
      // 清除 require 缓存，解决手动更新语言文件后再自动抽取，导致之前更新失效的问题
      const mainContent = getLangData(targetFiles[i]);
      const obj = mainContent;

      if (Object.keys(obj).length === 0) {
        vscode.window.showWarningMessage(`${filename} 解析失败，该文件包含的文案无法自动补全`);
      }

      if (validateDuplicate && _.get(obj, fullKey) !== undefined) {
        vscode.window.showErrorMessage(`${targetFiles[i]} 中已存在 key 为 \`${fullKey}\` 的翻译，请重新命名变量`);
        throw new Error('duplicate');
      }
      // \n 会被自动转义成 \\n，这里转回来
      langMap[lang] = langMap[lang].replace(/\\n/gm, '\n');
      _.set(obj, fullKey, langMap[lang]);
      fs.writeFileSync(targetFiles[i], prettierFile(`export default ${JSON.stringify(obj, null, 2)}`));
    }
  });
}
/**
 * 使用 Prettier 格式化文件
 * @param fileContent
 */
function prettierFile(fileContent) {
  try {
    return prettier.format(fileContent, {
      parser: 'typescript',
      trailingComma: 'all',
      singleQuote: true
    });
  } catch (e) {
    console.error(`代码格式化报错！${e.toString()}\n代码为：${fileContent}`);
    return fileContent;
  }
}

export function generateNewLangFile(key: string, value: string) {
  const obj = _.set({}, key, value);

  return prettierFile(`export default ${JSON.stringify(obj, null, 2)}`);
}

export function addImportToMainLangFile(newFilename: string, activeEditor?: vscode.TextEditor, lang?: string) {
  let mainContent = '';
  const langPrefix = getLangPrefix(activeEditor, lang) || getDefaultDir(lang);

  if (fs.existsSync(`${langPrefix}index.ts`)) {
    mainContent = fs.readFileSync(`${langPrefix}index.ts`, 'utf8');
    mainContent = mainContent.replace(/^(\s*import.*?;)$/m, `$1\nimport ${newFilename} from './${newFilename}';`);

    if (/\n(}\);)/.test(mainContent)) {
      if (/\,\n(}\);)/.test(mainContent)) {
        /** 最后一行包含,号 */
        mainContent = mainContent.replace(/(}\);)/, `  ${newFilename},\n$1`);
      } else {
        /** 最后一行不包含,号 */
        mainContent = mainContent.replace(/\n(}\);)/, `,\n  ${newFilename},\n$1`);
      }
    }

    if (/\n(};)/.test(mainContent)) {
      if (/\,\n(};)/.test(mainContent)) {
        /** 最后一行包含,号 */
        mainContent = mainContent.replace(/(};)/, `  ${newFilename},\n$1`);
      } else {
        /** 最后一行不包含,号 */
        mainContent = mainContent.replace(/\n(};)/, `,\n  ${newFilename},\n$1`);
      }
    }
  } else {
    mainContent = `import ${newFilename} from './${newFilename}';\n\nexport default Object.assign({}, {\n  ${newFilename},\n});`;
  }

  fs.outputFileSync(`${langPrefix}index.ts`, mainContent);
}
