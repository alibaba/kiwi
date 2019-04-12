/**
 * @author linhuiw
 * @desc TS 定义
 */
import * as vscode from 'vscode';

export interface Item {
  keys: string[];
  value: string;
}

// 扫描文档，通过正则匹配找出所有中文文案
export interface TargetStr {
  text: string;
  range: vscode.Range;
  isString: boolean;
}
