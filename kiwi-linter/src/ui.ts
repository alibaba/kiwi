/**
 * @desc UI 状态栏按钮
 * @author zongwenjian
 */

import * as vscode from 'vscode';

export class UI {
  /** 文案搜索入口 */
  searchBar: vscode.StatusBarItem;
  /** 批量提取当前文件中的所有文案 */
  kiwiGoBar: vscode.StatusBarItem;
  /** 切换翻译源 */
  switchTranslateOriginBar: vscode.StatusBarItem;

  constructor() {
    // 创建状态栏按钮
    this.switchTranslateOriginBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    this.kiwiGoBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    this.searchBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    // 为按钮绑定注册的command名称
    this.searchBar.command = 'vscode-i18n-linter.searchI18N';
    this.kiwiGoBar.command = 'vscode-i18n-linter.kiwigo';
    this.switchTranslateOriginBar.command = 'vscode-i18n-linter.switchTranslateApi';
  }

  init = translateApi => {
    // 全局搜索文案
    this.searchBar.text = `$(search) KiwiSearch`;
    this.searchBar.color = '#fff';
    this.searchBar.tooltip = 'Kiwi - 搜索中文文案';
    this.searchBar.show();

    // 批量提取当前文件中的所有文案
    this.kiwiGoBar.text = 'KiwiGo';
    this.kiwiGoBar.color = 'yellow';
    this.kiwiGoBar.tooltip = 'Kiwi - 批量提取当前文件中的中文';
    this.kiwiGoBar.show();

    // 切换翻译源
    this.switchTranslateOriginBar.text = `by(${translateApi})`;
    this.switchTranslateOriginBar.color = '#fff';
    this.switchTranslateOriginBar.tooltip = 'Kiwi - KiwiGo翻译源，仅显示配置过的翻译源，默认翻译为拼音';
    if (translateApi) {
      this.switchTranslateOriginBar.show();
    }
  };
}
