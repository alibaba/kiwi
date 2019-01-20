/**
 * @author linhuiw
 * @desc 项目配置文件配置信息
 */

export const PROJECT_CONFIG = {
  dir: './.kiwi',
  configFile: './.kiwi/config.json',
  defaultConfig: {
    srcLang: 'zh_CN',
    distLangs: ['en_US', 'zh_TW'],
    googleApiKey: ''
  },
  langMap: {
    ['en_US']: 'en',
    ['zh_TW']: 'zh-TW'
  },
  zhIndexFile: `import common from './common';

export default Object.assign({}, {
  common
});`,
  zhTestFile: `export default {
    test: '测试'
  }`
}