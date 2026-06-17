/**
 * @author linhuiw
 * @desc 更新文件
 */

import { TargetStr } from './define';
import * as vscode from 'vscode';
import { updateLangFiles } from './file';

/**
 * 使用平衡括号计数提取模板字符串中的 ${...} 变量
 * 支持任意深度的嵌套，解决正则无法处理嵌套 {} 的问题
 */
function findTemplateVariables(text: string): string[] {
  const vars: string[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '$' && text[i + 1] === '{') {
      let depth = 1;
      const start = i;
      i += 2;
      while (i < text.length && depth > 0) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') depth--;
        i++;
      }
      vars.push(text.slice(start, i));
    } else {
      i++;
    }
  }
  return vars;
}
/**
 * 更新文件
 * @param arg  目标字符串对象
 * @param val  目标 key
 * @param validateDuplicate 是否校验文件中已经存在要写入的 key
 */
export function replaceAndUpdate(arg: TargetStr, val: string, validateDuplicate: boolean): Thenable<any> {
  let activeEditor = vscode.window.activeTextEditor;
  const currentFilename = activeEditor.document.fileName;
  const isHtmlFile = currentFilename.endsWith('.html');
  const isVueFile = currentFilename.endsWith('.vue');
  const edit = new vscode.WorkspaceEdit();
  const { document } = vscode.window.activeTextEditor;
  let finalReplaceText = arg.text;
  // 若是字符串，删掉两侧的引号
  if (arg.isString) {
    // 如果引号左侧是 等号，则可能是 jsx 的 props，此时要替换成 {
    let startColPostion;
    try {
      startColPostion = arg.range.start.translate(0, -2);
    } catch (e) {
      startColPostion = arg.range.start.translate(0, 0);
    }
    const prevTextRange = new vscode.Range(startColPostion, arg.range.start);
    const [last2Char, last1Char] = document.getText(prevTextRange).split('');
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
      const varInStr = findTemplateVariables(arg.text);
      if (varInStr.length > 0) {
        const kvPair = varInStr.map((str, index) => {
          return `val${index + 1}: ${str.slice(2, -1)}`;
        });
        finalReplaceVal = `I18N.template(${val}, { ${kvPair.join(',\n')} })`;

        varInStr.forEach((str, index) => {
          finalReplaceText = finalReplaceText.replace(str, `{val${index + 1}}`);
        });
      }
    }

    edit.replace(
      document.uri,
      arg.range.with({
        start: arg.range.start.translate(0, -1),
        end: arg.range.end.translate(0, 1)
      }),
      finalReplaceVal
    );
  } else {
    if (isHtmlFile) {
      edit.replace(document.uri, arg.range, '{{' + val + '}}');
    } else if (isVueFile) {
      edit.replace(document.uri, arg.range, '{{' + val + '}}');
    } else {
      edit.replace(document.uri, arg.range, '{' + val + '}');
    }
  }

  try {
    // 更新语言文件
    updateLangFiles(val, finalReplaceText, validateDuplicate);
    // 若更新成功再替换代码
    return vscode.workspace.applyEdit(edit);
  } catch (e) {
    return Promise.reject(e.message);
  }
}
