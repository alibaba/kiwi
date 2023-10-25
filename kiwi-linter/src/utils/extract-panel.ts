/**
 * @author 华强
 * @description
 */

import * as vscode from 'vscode';
import { getConfigByKey } from '../utils';

interface HtmlOptions {
  /** 抽取的中文词条 */
  word: string;

  /** 建议值 */
  suggestion?: {
    key: string;
    en: string;
    tw: string;
  };
}

export const showExtractForm = (options: { word: string; key: string }) => {
  return new Promise(async resolve => {
    const panel = vscode.window.createWebviewPanel('formPanel', 'kiwi文案抽取', vscode.ViewColumn.One, {
      // 在webview中启用脚本
      enableScripts: true
    });

    let en = '';
    let tw = '';

    try {
      en = await translate(options.word, 'en');
      tw = await translate(options.word, 'cht');
    } catch (e) {}

    // 加载表单页面
    panel.webview.html = getFormHtml({
      word: options.word,
      suggestion: {
        key: options.key,
        en,
        tw
      }
    });

    // 监听表单提交事件
    panel.webview.onDidReceiveMessage(async message => {
      if (message.type === 'submit') {
        const formData = message.data;
        try {
          const res = await checkFrom(formData);

          if (!res) {
            throw new Error('表单校验出错');
          }
          // 关闭面板
          panel.dispose();
          resolve(formData);
        } catch (e) {
          vscode.window.showErrorMessage(e.message);
        }
      }
    });
  });
};

function translate(word: string, target = 'en'): Promise<string> {
  return new Promise(resolve => {
    /** 获取百度翻译 */
    const { appId, appKey } = getConfigByKey('baiduApiKey');
    const baiduTranslate = require('baidu-translate');

    baiduTranslate(appId, appKey, target, 'zh')(word).then((data: any) => {
      if (data && data.trans_result) {
        resolve(data.trans_result[0].dst);
        return;
      }
      throw new Error(`\n百度翻译api调用异常 error_code: ${data.error_code}, error_msg: ${data.error_msg}`);
    });
  });
}

function getFormHtml(options: HtmlOptions) {
  // 构建表单页面的 HTML
  return `
    <html>
      <head>
        <style>
          .form-input {
            width: 400px;
          }
        </style>
      </head>
      <body>
        <h1>kiwi 中文文案抽取和翻译</h1>
        <form id="myForm">
          <span>中文文案:${options.word}</span><br><br>
          <label for="key">文案 key:</label>
          <input class="form-input" type="text" id="name" name="key" value=${options.suggestion.key || ''}><br><br>
          <label for="en">英文翻译:</label>
          <input class="form-input" type="text" id="email" name="en" value=${options.suggestion.en || ''}><br><br>
          <label for="tw">繁体翻译:</label>
          <input class="form-input" type="text" id="email" name="tw" value=${options.suggestion.tw || ''}><br><br>
          <input type="submit" value="提交">
        </form>
        <script>
          const vscode = acquireVsCodeApi();
          const form = document.getElementById('myForm');
          form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            vscode.postMessage({
              type: 'submit',
              data: Object.fromEntries(formData),
            });
          });
        </script>
      </body>
    </html>
  `;
}

async function checkFrom(formData: { key: string; en: string; tw: string }) {
  const { key, en, tw } = formData;
  if (!key || !en || !tw) {
    throw new Error('缺少必填项');
  }
  if (!/^I18N(\.[a-zA-Z0-9_]+)+$/.test(key)) {
    throw new Error('key的格式错误');
  }
  return true;
}
