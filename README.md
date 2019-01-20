<div align="center">
  <img src="https://img.alicdn.com/tfs/TB1wHaqyYGYBuNjy0FoXXciBFXa-512-512.svg" height="64">
  <h2>Kiwi-国际化全流程解决方案</h2>
</div>

## 如何使用
> yarn add kiwi-intl kiwi-cli

> vscode 插件搜索 kiwi linter 安装

## Kiwi 解决了哪些问题
kiwi 不仅仅一个软件国际化的代码库，而是国际化从设计到发布的整个流程的一整套解决方案。

![kiwi](https://img.alicdn.com/tfs/TB1DU7uC4TpK1RjSZFMXXbG_VXa-994-744.png)

kiwi 整体基于 kiwi-intl 国际化框架，实现与框架无关的语言切换功能。

在开发过程中，使用 kiwi linter 实现中文文案的批量自动提取，同时针对替换后的文案变量，在 vscode 中显示对应的中文文案。当然你也可以全局搜索中文文案，跳转到对应的代码，很好的解决了国际化过程中由于中文文案缺失造成的开发体验问题。

在翻译过程中，可以使用 kiwi 命令行自动提取未送翻词汇，整理成 Excel 方便与翻译同学协作。针对翻译同学还没有返回翻译文案的期间，可以使用 kiwi 内置的支持 google 以及 多种翻译平台的自动翻译脚本，先临时翻译成对应语言，节省文案调整时间。

国际化文案翻译完成后，可以使用 kiwi 的命令行工具，一键导入到项目文件内。

kiwi 还提供了对应 tslint 的插件，使用 tslint在开发过程中实时提醒未抽离文案，以及在代码提交的时候，拦截未国际化的代码提交。

## License

MIT
