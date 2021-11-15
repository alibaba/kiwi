/**
 * @desc UI 状态栏按钮
 * @author zongwenjian
 */

import * as vscode from 'vscode';

export class UI {
  /** 全局搜索文案 */
  searchAllBar: vscode.StatusBarItem;

  constructor() {
    // 创建状态栏按钮 全局搜索
    this.searchAllBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    // 为按钮绑定注册的command名称
    this.searchAllBar.command = 'vscode-i18n-linter.findAllI18N';
  }

  init = () => {
    this.searchAllBar.text = `$(search) Kiwi Search`;
    this.searchAllBar.color = '#fff';
    this.searchAllBar.tooltip = '全局搜索中文文案';
    this.searchAllBar.show();
  };
}
