/**
 * @author linhuiw
 * @desc 利用 Ast 查找对应文件中的中文文案
 */
import * as ts from 'typescript';
import * as vscode from 'vscode';
import * as compiler from '@angular/compiler';
import { DOUBLE_BYTE_REGEX } from './const';
import { trimWhiteSpace } from './parserUtils';
import { removeFileComment } from './astUtils';
import {transerI18n} from './babelUtil';
import * as compilerVue from 'vue-template-compiler';
/**
 * 查找 Ts 文件中的中文
 * @param code
 */

function findTextInTs(code: string, fileName: string) {
  const matches = [];
  const activeEditor = vscode.window.activeTextEditor;

  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX);

  function visit(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral: {
        /** 判断 Ts 中的字符串含有中文 */
        const { text } = node as ts.StringLiteral;
        if (text.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart();
          const end = node.getEnd();
          /** 加一，减一的原因是，去除引号 */
          const startPos = activeEditor.document.positionAt(start + 1);
          const endPos = activeEditor.document.positionAt(end - 1);
          const range = new vscode.Range(startPos, endPos);
          matches.push({
            range,
            text,
            isString: true
          });
        }
        break;
      }
      case ts.SyntaxKind.JsxElement: {
        const { children } = node as ts.JsxElement;

        children.forEach(child => {
          if (child.kind === ts.SyntaxKind.JsxText) {
            const text = child.getText();
            /** 修复注释含有中文的情况，Angular 文件错误的 Ast 情况 */
            const noCommentText = removeFileComment(text, fileName);

            if (noCommentText.match(DOUBLE_BYTE_REGEX)) {
              const start = child.getStart();
              const end = child.getEnd();
              const startPos = activeEditor.document.positionAt(start);
              const endPos = activeEditor.document.positionAt(end);
              const { trimStart, trimEnd } = trimWhiteSpace(code, startPos, endPos);
              const range = new vscode.Range(trimStart, trimEnd);

              matches.push({
                range,
                text: text.trim(),
                isString: false
              });
            }
          }
        });
        break;
      }
      case ts.SyntaxKind.TemplateExpression: {
        const { pos, end } = node;
        const templateContent = code.slice(pos, end);

        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart();
          const end = node.getEnd();
          /** 加一，减一的原因是，去除`号 */
          const startPos = activeEditor.document.positionAt(start + 1);
          const endPos = activeEditor.document.positionAt(end - 1);
          const range = new vscode.Range(startPos, endPos);
          matches.push({
            range,
            text: code.slice(start + 1, end - 1),
            isString: true
          });
        }
      }
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        const { pos, end } = node;
        const templateContent = code.slice(pos, end);

        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart();
          const end = node.getEnd();
          /** 加一，减一的原因是，去除`号 */
          const startPos = activeEditor.document.positionAt(start + 1);
          const endPos = activeEditor.document.positionAt(end - 1);
          const range = new vscode.Range(startPos, endPos);
          matches.push({
            range,
            text: code.slice(start + 1, end - 1),
            isString: true
          });
        }
    }

    ts.forEachChild(node, visit);
  }
  ts.forEachChild(ast, visit);

  return matches;
}

/**
 * 查找 HTML 文件中的中文
 * @param code
 */
function findTextInHtml(code) {
  const matches = [];
  const activeEditor = vscode.window.activeTextEditor;
  const ast = compiler.parseTemplate(code, 'ast.html', {
    preserveWhitespaces: false
  });
  function visit(node) {
    const value = node.value;
    if (value && typeof value === 'string' && value.match(DOUBLE_BYTE_REGEX)) {
      const valueSpan = node.valueSpan || node.sourceSpan;
      let {
        start: { offset: startOffset },
        end: { offset: endOffset }
      } = valueSpan;
      const nodeValue = code.slice(startOffset, endOffset);
      let startPos, endPos;
      let isString = false;
      /** 处理带引号的情况 */
      if (nodeValue.charAt(0) === '"' || nodeValue.charAt(0) === "'") {
        startPos = activeEditor.document.positionAt(startOffset + 1);
        endPos = activeEditor.document.positionAt(endOffset - 1);
        isString = true;
      } else {
        startPos = activeEditor.document.positionAt(startOffset);
        endPos = activeEditor.document.positionAt(endOffset);
      }
      const { trimStart, trimEnd } = trimWhiteSpace(code, startPos, endPos);
      const range = new vscode.Range(trimStart, trimEnd);
      matches.push({
        range,
        text: value,
        isString
      });
    } else if (value && typeof value === 'object' && value.source && value.source.match(DOUBLE_BYTE_REGEX)) {
      /**
       * <span>{{expression}}中文</span> 这种情况的兼容
       */
      const chineseMatches = value.source.match(DOUBLE_BYTE_REGEX);
      chineseMatches.map(match => {
        const valueSpan = node.valueSpan || node.sourceSpan;
        let {
          start: { offset: startOffset },
          end: { offset: endOffset }
        } = valueSpan;
        const nodeValue = code.slice(startOffset, endOffset);
        const start = nodeValue.indexOf(match);
        const end = start + match.length;
        let startPos = activeEditor.document.positionAt(startOffset + start);
        let endPos = activeEditor.document.positionAt(startOffset + end);
        const { trimStart, trimEnd } = trimWhiteSpace(code, startPos, endPos);
        const range = new vscode.Range(trimStart, trimEnd);
        matches.push({
          range,
          text: match[0],
          isString: false
        });
      });
    }

    if (node.children && node.children.length) {
      node.children.forEach(visit);
    }
    if (node.attributes && node.attributes.length) {
      node.attributes.forEach(visit);
    }
  }

  if (ast.nodes && ast.nodes.length) {
    ast.nodes.forEach(visit);
  }
  return matches;
}

/**
 * vue文件查找
 * @param code 
 * @param fileName 
 */
function findTextInVue (code) {
  const activeTextEditor = vscode.window.activeTextEditor;
  const matches = [];
  var result;
  const { document } = activeTextEditor;
  // console.log(compilerVue.compile(code))
  const vueObejct = compilerVue.compile(code.toString());
  let outcode = vueObejct.render
  .toString()
  .replace("with(this)", "function a()");
  // console.log(outcode)
  let vueTemp = transerI18n(outcode, 'as.vue');
  const sfc = compilerVue.parseComponent(code.toString());
  let scriptarr = transerI18n(sfc.script.content, 'filename.vue');

  vueTemp = vueTemp.concat(scriptarr)
  vueTemp = [...new Set(vueTemp)]
  vueTemp.forEach(item => {
      let rex = new RegExp(item,'g')
      while ((result = rex.exec(code)))  {     
          let res = result
          let last = rex.lastIndex
          last = last - (res[0].length - res[0].trimRight().length) 
          const range = new vscode.Range(document.positionAt(res.index), document.positionAt(last));
          matches.push({
              range,
              text: res[0].trimRight(),
              isString: ((code.substr(res.index-1,1) === '"' && code.substr(last,1) === '"') || (code.substr(res.index-1,1) === "'" && code.substr(last,1) === "'")) ? true : false
          });
          
      }
  })
  // console.log(matches)
  return matches
}
/**
 * 递归匹配代码的中文
 * @param code
 */
export function findChineseText(code: string, fileName: string) {
  if (fileName.endsWith('.html')) {
    return findTextInHtml(code);
  }
  if (fileName.endsWith('.vue')) {     
    return findTextInVue(code);
  }
  return findTextInTs(code, fileName);
}
