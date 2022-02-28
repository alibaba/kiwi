# 🐤 Change Log
Kiwi Linter

## 1.4.5（2022-02-28）

### Bug Fixes
- 优化中文提取不完整错位的问题 [#88](https://github.com/alibaba/kiwi/issues/88)
- 优化vue提取中文显示的数量不匹配问题
## 1.4.4（2021-12-08）

### Bug Fixes
- 更新vscode插件无法使用 [#77](https://github.com/alibaba/kiwi/issues/77)
- 抽取文案时默认key值不准确

### Features
- 支持中文文案的全局搜索，新增显式入口（vscode右下角工具栏）
- 支持文件粒度的批量提取，翻译源支持pinyin和百度，配合[kiwi-config.json](https://github.com/alibaba/kiwi/tree/master/kiwi-cli)使用