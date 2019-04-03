/**
 * @file 多语言工具
 * @author 五灵
 */

import kiwiIntl from 'kiwi-intl';
import enUsLangs from '../.kiwi/en_US/';
import zhCNLangs from '../.kiwi/zh_CN/';
import zhTWLangs from '../.kiwi/zh_TW/';

export enum LangEnum {
  zh_CN = 'zh_CN',
  en_US = 'en_US',
  zh_TW = 'zh_TW'
}

/**
 * 获取当前语言的Cookie
 */
export function getCurrentLang(): LangEnum {
  const urlLang = new URL(window.location.href).searchParams.get('lang');
  const cookieLang = (document.cookie.match(/kiwi-locale=([^;$]+)/) || [null, 'zh_CN'])[1];
  const lang = (cookieLang as string).split(' ')[0];
  if (Object.keys(LangEnum).includes(urlLang as string)) {
    return urlLang as LangEnum;
  }
  return lang as LangEnum;
}

const langs = {
  en_US: enUsLangs,
  zh_CN: zhCNLangs,
  zh_TW: zhTWLangs
};
// 从 Cookie 中取语言值, 默认为 zh_CN
const defaultLang = getCurrentLang();

let curLang;
if (Object.keys(langs).indexOf(defaultLang) > -1) {
  curLang = defaultLang;
} else {
  // 如果没有对应的语言文件, 置为中文
  curLang = 'zh_CN';
}

const I18N = kiwiIntl.init(curLang, langs);

export default I18N;
