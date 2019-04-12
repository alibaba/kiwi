export interface I18NAPI {
  init?(lang: string, metas: object): I18NAPI;
  setLang?(lang: string): void;
  template?(str: string, args: object): string;
  get(name: string, args?: object): string;
}
declare const IntlFormat: {
  init: <T>(
    lang: string,
    metas: {
      [key: string]: Object;
      'zh-CN': T;
    }
  ) => I18NAPI & T;
};
export { IntlFormat };
export default IntlFormat;
