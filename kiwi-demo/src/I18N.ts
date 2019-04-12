/**
 * @file 多语言工具
 * @author 五灵
 */

import kiwiIntl from 'kiwi-intl';
import enUsLangs from '../.kiwi/en-US/';
import zhCNLangs from '../.kiwi/zh-CN/';
import zhTWLangs from '../.kiwi/zh-TW/';

export enum LangEnum {
  'zh-CN' = 'zh-CN',
  'en-US' = 'en-US',
  'zh-TW' = 'zh-TW'
}

/**
 * 获取当前语言的Cookie
 */
export function getCurrentLang(): LangEnum {
  const urlLang = new URL(window.location.href).searchParams.get('lang');
  const cookieLang = (document.cookie.match(/kiwi-locale=([^;$]+)/) || [null, 'zh-CN'])[1];
  const lang = (cookieLang as string).split(' ')[0];
  if (Object.keys(LangEnum).includes(urlLang as string)) {
    return urlLang as LangEnum;
  }
  return lang as LangEnum;
}

const langs = {
  'en-US': enUsLangs,
  'zh-CN': zhCNLangs,
  'zh-TW': zhTWLangs
};
// 从 Cookie 中取语言值, 默认为 zh-CN
const defaultLang = getCurrentLang();

let curLang;
if (Object.keys(langs).indexOf(defaultLang) > -1) {
  curLang = defaultLang;
} else {
  // 如果没有对应的语言文件, 置为中文
  curLang = 'zh-CN';
}

const I18N = kiwiIntl.init(curLang, langs);

export default I18N;
