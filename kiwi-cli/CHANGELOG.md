# 🐤 Change Log

Kiwi Cli

## 1.1.1 (2026-06-17)
### Bug Fixes
- 修复 --translate 增量翻译执行问题（原来会因缓存问题导致全量翻译）
- 修复 --extract 抽取文案时一级path大小写与lang文件名大小写不一致的问题
- 修复 --extract 新增文件某些场景下未添加到默认导入的问题
- 修复 --extract ts文件中某些场景下错误识别中文注释的问题
- 优化 --extract 对字符串模板嵌套的处理，现在支持处理最多3层变量嵌套

### Features
- 升级typescript及其相关依赖，ts -> v5
- --extract 添加文件/行级中文抽取忽略 kiwi-disable-file、kiwi-disable-next-line
- 各命令相关文档完善


## 1.0.23 (2022-06-10)
-  kiwi --extract 兼容文件夹中带 - 的情况

## 1.0.22 (2022-03-04)
-  kiwi --extract 修复多文件提取时的并发问题
-  kiwi --extract 修复文案key出现undefined的情况
## 1.0.21 (2022-03-01)
-  kiwi --extract 添加 --prefix 参数，自定义配置 118N 提取文案路径
## 1.0.20（2022-02-28）
- kiwi 优化在vue环境下中文检测与linter保持同步
## 1.0.19（2022-01-26）

### Breaking changes

- kiwi --extract 添加百度和拼音翻译源，且支持批量文件以,分隔符输入（原本仅支持指定文件夹）
- 配置文件 kiwi-config.json 添加 defaultTranslateKeyApi

## 1.0.18（2021-12-07）

### Breaking changes

- 配置文件 kiwi-config.json 移动至根目录下
