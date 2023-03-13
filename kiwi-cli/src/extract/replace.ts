/**
 * @author doubledream
 * @desc 更新文件
 */

import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as prettier from 'prettier';
import * as ts from 'typescript';
import { readFile, writeFile } from './file';
import { getLangData } from './getLangData';
import { getProjectConfig, getLangDir, successInfo, failInfo, highlightText } from '../utils';

const CONFIG = getProjectConfig();
const srcLangDir = getLangDir(CONFIG.srcLang);

function updateLangFiles(keyValue, text, validateDuplicate) {
  if (!_.startsWith(keyValue, 'I18N.')) {
    return;
  }

  const [, filename, ...restPath] = keyValue.split('.');
  const fullKey = restPath.join('.');
  const targetFilename = `${srcLangDir}/${filename}.${CONFIG.fileType}`;

  if (!fs.existsSync(targetFilename)) {
    fs.writeFileSync(targetFilename, generateNewLangFile(fullKey, text));
    addImportToMainLangFile(filename);
    successInfo(`成功新建语言文件 ${targetFilename}`);
  } else {
    // 清除 require 缓存，解决手动更新语言文件后再自动抽取，导致之前更新失效的问题
    const mainContent = getLangData(targetFilename);
    const obj = mainContent;

    if (Object.keys(obj).length === 0) {
      failInfo(`${filename} 解析失败，该文件包含的文案无法自动补全`);
    }

    if (validateDuplicate && _.get(obj, fullKey) !== undefined) {
      failInfo(`${targetFilename} 中已存在 key 为 \`${fullKey}\` 的翻译，请重新命名变量`);
      throw new Error('duplicate');
    }
    // \n 会被自动转义成 \\n，这里转回来
    text = text.replace(/\\n/gm, '\n');
    _.set(obj, fullKey, text);
    fs.writeFileSync(targetFilename, prettierFile(`export default ${JSON.stringify(obj, null, 2)}`));
  }
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
    failInfo(`代码格式化报错！${e.toString()}\n代码为：${fileContent}`);
    return fileContent;
  }
}

function generateNewLangFile(key, value) {
  const obj = _.set({}, key, value);

  return prettierFile(`export default ${JSON.stringify(obj, null, 2)}`);
}

function addImportToMainLangFile(newFilename) {
  let mainContent = '';
  if (fs.existsSync(`${srcLangDir}/index.${CONFIG.fileType}`)) {
    mainContent = fs.readFileSync(`${srcLangDir}/index.${CONFIG.fileType}`, 'utf8');
    mainContent = mainContent.replace(/^(\s*import.*?;)$/m, `$1\nimport ${newFilename} from './${newFilename}';`);
    if (/(}\);)/.test(mainContent)) {
      if (/\,\n(}\);)/.test(mainContent)) {
        /** 最后一行包含,号 */
        mainContent = mainContent.replace(/(}\);)/, `  ${newFilename},\n$1`);
      } else {
        /** 最后一行不包含,号 */
        mainContent = mainContent.replace(/\n(}\);)/, `,\n  ${newFilename},\n$1`);
      }
    }
    // 兼容 export default { common };的写法
    if (/(};)/.test(mainContent)) {
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

  fs.writeFileSync(`${srcLangDir}/index.${CONFIG.fileType}`, mainContent);
}

/**
 * 检查是否添加 import I18N 命令
 * @param filePath 文件路径
 */
function hasImportI18N(filePath) {
  const code = readFile(filePath);
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX);
  let hasImportI18N = false;

  function visit(node) {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      const importClause = node.importClause;

      // import I18N from 'src/utils/I18N';
      if (_.get(importClause, 'kind') === ts.SyntaxKind.ImportClause) {
        if (importClause.name) {
          if (importClause.name.escapedText === 'I18N') {
            hasImportI18N = true;
          }
        } else {
          const namedBindings = importClause.namedBindings;
          // import { I18N } from 'src/utils/I18N';
          if (namedBindings.kind === ts.SyntaxKind.NamedImports) {
            namedBindings.elements.forEach(element => {
              if (element.kind === ts.SyntaxKind.ImportSpecifier && _.get(element, 'name.escapedText') === 'I18N') {
                hasImportI18N = true;
              }
            });
          }
          // import * as I18N from 'src/utils/I18N';
          if (namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
            if (_.get(namedBindings, 'name.escapedText') === 'I18N') {
              hasImportI18N = true;
            }
          }
        }
      }
    }
  }

  ts.forEachChild(ast, visit);

  return hasImportI18N;
}

/**
 * 在合适的位置添加 import I18N 语句
 * @param filePath 文件路径
 */
function createImportI18N(filePath) {
  const code = readFile(filePath);
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX);
  const isTsFile = _.endsWith(filePath, '.ts');
  const isTsxFile = _.endsWith(filePath, '.tsx');
  const isJsFile = _.endsWith(filePath, '.js');
  const isJsxFile = _.endsWith(filePath, '.jsx');
  const isVueFile = _.endsWith(filePath, '.vue');
  if (isTsFile || isTsxFile || isJsFile || isJsxFile) {
    const importStatement = `${CONFIG.importI18N}\n`;
    const pos = ast.getStart(ast, false);
    const updateCode = code.slice(0, pos) + importStatement + code.slice(pos);

    return updateCode;
  } else if (isVueFile) {
    const importStatement = `${CONFIG.importI18N}\n`;
    const updateCode = code.replace(/<script>/g, `<script>\n${importStatement}`);
    return updateCode;
  }
}

/**
 * 更新文件
 * @param filePath 当前文件路径
 * @param arg  目标字符串对象
 * @param val  目标 key
 * @param validateDuplicate 是否校验文件中已经存在要写入的 key
 * @param needWrite 是否只需要替换不需要更新 langs 文件
 */
function replaceAndUpdate(filePath, arg, val, validateDuplicate, needWrite = true) {
  const code = readFile(filePath);
  const isHtmlFile = _.endsWith(filePath, '.html');
  const isVueFile = _.endsWith(filePath, '.vue');
  let newCode = code;
  let finalReplaceText = arg.text;
  const { start, end } = arg.range;
  // 若是字符串，删掉两侧的引号
  if (arg.isString) {
    // 如果引号左侧是 等号，则可能是 jsx 的 props，此时要替换成 {
    const preTextStart = start - 1;
    const [last2Char, last1Char] = code.slice(preTextStart, start + 1).split('');
    let finalReplaceVal = val;
    if (last2Char === '=') {
      if (isHtmlFile) {
        finalReplaceVal = '{{' + val + '}}';
      } else if (isVueFile) {
        finalReplaceVal = '{{' + val + '}}';
      } else {
        finalReplaceVal = '{' + val + '}';
      }
    }
    // 若是模板字符串，看看其中是否包含变量
    if (last1Char === '`') {
      const varInStr = arg.text.match(/(\$\{[^\}]+?\})/g);
      if (varInStr) {
        const kvPair = varInStr.map((str, index) => {
          return `val${index + 1}: ${str.replace(/^\${([^\}]+)\}$/, '$1')}`;
        });
        finalReplaceVal = `I18N.template(${val}, { ${kvPair.join(',\n')} })`;

        varInStr.forEach((str, index) => {
          finalReplaceText = finalReplaceText.replace(str, `{val${index + 1}}`);
        });
      }
    }

    newCode = `${code.slice(0, start)}${finalReplaceVal}${code.slice(end)}`;
  } else {
    if (isHtmlFile || isVueFile) {
      newCode = `${code.slice(0, start)}{{${val}}}${code.slice(end)}`;
    } else {
      newCode = `${code.slice(0, start)}{${val}}${code.slice(end)}`;
    }
  }

  try {
    if (needWrite) {
      // 更新语言文件
      updateLangFiles(val, finalReplaceText, validateDuplicate);
    }
    // 若更新成功再替换代码
    return writeFile(filePath, newCode);
  } catch (e) {
    return Promise.reject(e.message);
  }
}

export { replaceAndUpdate, hasImportI18N, createImportI18N };
