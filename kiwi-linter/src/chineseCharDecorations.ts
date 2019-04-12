/**
 * @author linhuiw
 * @desc 查找代码中的中文, 并标记
 */
import * as vscode from 'vscode';
import { setLineDecorations } from './lineAnnotation';
import { findChineseText } from './findChineseText';
import * as minimatch from 'minimatch';

/**
 * 中文的标记，红框样式
 */
function getChineseCharDecoration() {
  // 配置提示框样式
  const hasOverviewRuler = vscode.workspace.getConfiguration('vscode-i18n-linter').get('showOverviewRuler');
  const shouldMark = vscode.workspace.getConfiguration('vscode-i18n-linter').get('markStringLiterals');
  const color = vscode.workspace.getConfiguration('vscode-i18n-linter').get('markColor');
  return vscode.window.createTextEditorDecorationType({
    borderWidth: shouldMark ? '1px' : undefined,
    borderStyle: shouldMark ? 'dotted' : undefined,
    overviewRulerColor: hasOverviewRuler ? color : undefined,
    overviewRulerLane: hasOverviewRuler ? vscode.OverviewRulerLane.Right : undefined,
    light: {
      borderColor: shouldMark ? color : undefined
    },
    dark: {
      borderColor: shouldMark ? color : undefined
    }
  });
}

let timeout = null;
let prevChineseCharDecoration = null;
export function triggerUpdateDecorations(callback?) {
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(() => {
    const activeEditor = vscode.window.activeTextEditor;
    if (prevChineseCharDecoration) {
      /** 清除原有的提示 */
      activeEditor.setDecorations(prevChineseCharDecoration, []);
    }
    if (!matchPattern()) {
      return;
    }
    const { targetStrs, chineseCharDecoration } = updateDecorations();
    prevChineseCharDecoration = chineseCharDecoration;
    callback(targetStrs);
  }, 500);
}

/**
 * 查看文件名是否匹配
 */
function matchPattern() {
  const activeEditor = vscode.window.activeTextEditor;
  const pattern = vscode.workspace.getConfiguration('vscode-i18n-linter').get('i18nFilesPattern');
  if (
    activeEditor &&
    pattern !== '' &&
    !minimatch(activeEditor.document.uri.fsPath.replace(vscode.workspace.rootPath + '/', ''), pattern)
  ) {
    console.log(activeEditor.document.uri.fsPath.replace(vscode.workspace.rootPath + '/', '') + ' 不匹配 ' + pattern);
    return false;
  } else {
    return true;
  }
}
/**
 * 更新标记
 */
export function updateDecorations() {
  const activeEditor = vscode.window.activeTextEditor;
  const currentFilename = activeEditor.document.fileName;
  const chineseCharDecoration = getChineseCharDecoration();
  if (!activeEditor) {
    return;
  }

  const text = activeEditor.document.getText();
  // 清空上一次的保存结果
  let targetStrs = [];
  let chineseChars: vscode.DecorationOptions[] = [];

  targetStrs = findChineseText(text, currentFilename);
  targetStrs.map(match => {
    const decoration = {
      range: match.range,
      hoverMessage: `🐤 检测到中文文案🇨🇳 ： ${match.text}`
    };
    chineseChars.push(decoration);
  });

  const shouldMark = vscode.workspace.getConfiguration('vscode-i18n-linter').get('markStringLiterals');
  if (shouldMark !== true) {
    return;
  }

  /** 设置 I18N 的提示 */
  setLineDecorations(activeEditor);
  /** 设置中文的提示 */
  activeEditor.setDecorations(chineseCharDecoration, chineseChars);

  return {
    targetStrs,
    chineseCharDecoration
  };
}
