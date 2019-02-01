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

interface IAPI {
  /**
   * 初始化对应语言
   * @param lang: 对应语言
   * @param metas: 所有语言的语言文件
   */
  init?(lang: string, metas: object): IAPI;
  /**
   * 设置对应语言
   * @param lang: 切换的对应语言
   */
  setLang?(lang: string): void;
  /**
   * 模板填充, 获取对应语言的模板值
   * @param template: 对应语言的模板
   * @param args: 模板的参数
   */
  template?(str: string, args: object): string;
  /**
   * 获取对应语言的值
   * @param name: 对应语言的模板的 Key
   * @param options: 模板的参数
   */
  get(name: string, args?: object): string;
}

type Langs = typeof zhCNLangs & IAPI;

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

const I18N = (kiwiIntl.init(curLang, langs) as any) as Langs;

export default I18N;
