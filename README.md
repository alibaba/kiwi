<div align="center">
  <img src="https://img.alicdn.com/tfs/TB1wHaqyYGYBuNjy0FoXXciBFXa-512-512.svg" height="64">
  <h2>🐤 Kiwi-国际化全流程解决方案</h2>
</div>

## 如何使用

> yarn global add kiwi-clis && yarn add kiwi-intl

> VS Code 插件搜索 kiwi linter 安装

## 功能演示

- 一键提取中文文案
![提取文案](https://camo.githubusercontent.com/826598e27116fd0fb0b0931fc60ffbebecaa0075/68747470733a2f2f696d672e616c6963646e2e636f6d2f7466732f5442314559454e66546e49384b4a6a79304666585863646f5658612d313030362d3336382e676966)

- 检测代码中含有中文文案
![中文文案检测](https://camo.githubusercontent.com/8a537d1c20e689087ef6a0035761e3048f820852/68747470733a2f2f696d672e616c6963646e2e636f6d2f7466732f54423143485a527278475942754e6a7930466e585858356c7058612d313038382d3536382e706e67)

- 搜索对应文案
![文案搜索](https://camo.githubusercontent.com/c7385ffa640bcdd8c7e8037abd0e920f4b22e8dd/68747470733a2f2f696d672e616c6963646e2e636f6d2f7466732f544231647a663872704f5742754e6a7930466958585846785658612d313235362d3730302e706e67)

## 使用文档及 API
可以到对应子目录中查看：

`kiwi-intl`: [📝 文档链接](https://github.com/alibaba/kiwi/tree/master/kiwi-intl)

`kiwi-cli`: [📝 文档链接](https://github.com/alibaba/kiwi/tree/master/kiwi-cli)

`kiwi-linter`: [📝 文档链接](https://github.com/alibaba/kiwi/tree/master/kiwi-linter)

## 为什么使用 kiwi？

目前有很多成熟的库可以帮助前端去做对应的国际化方案，比较知名的有 `react-intl` 以及 `I18N-loader`。这些库都可以很好的解决代码中多种语言切换的问题，但是也存在如下没有解决的问题：

- 文案使用国际化 Key 代替后，难以搜索，文案不直观
- 代码中的中文提取困难
- 无法知道项目中是不是还有未提取的中文文案

而且这些国际化库并没有解决下列问题：

- 国际化涉及到多个相关人员，与各个业务方有交流众多。比如导出翻译文案给翻译团队

而在国际化过程中，在还没有拿到对应语言文案的时候，相关文案的长度也给 UI 上的调整也给前端增加了很多难度

- 不认识对应语言，或者不知道对应语言的显示长度，UI 上不知道如何处理
而 kiwi 就是为了解决上述的问题而创造的。

## Kiwi 解决了哪些问题
kiwi 不仅仅一个软件国际化的代码库，而是国际化从设计到发布的整个流程的一整套解决方案。

![kiwi](https://img.alicdn.com/tfs/TB1r_AzCW6qK1RjSZFmXXX0PFXa-1006-722.png)

kiwi 整体基于 kiwi-intl 国际化框架，实现与框架无关的语言切换功能。

在开发过程中，使用 kiwi linter 实现中文文案的批量自动提取，同时针对替换后的文案变量，在 VS Code 中显示对应的中文文案。当然你也可以全局搜索中文文案，跳转到对应的代码，很好的解决了国际化过程中由于中文文案缺失造成的开发体验问题。

在翻译过程中，可以使用 kiwi 命令行自动提取未送翻词汇，整理成 Excel 方便与翻译同学协作。针对翻译同学还没有返回翻译文案的期间，可以使用 kiwi 内置的支持 google 以及 多种翻译平台的自动翻译脚本，先临时翻译成对应语言，节省文案调整时间。

国际化文案翻译完成后，可以使用 kiwi 的命令行工具，一键导入到项目文件内。

kiwi 还提供了对应 TsLint 的插件，使用 TsLint 在开发过程中实时提醒未抽离文案，以及在代码提交的时候，拦截未国际化的代码提交。

## 谁在使用
- 阿里巴巴

## 为什么叫 kiwi？
kiwi 是一种不会飞翔的鸟类🐤，但它善于奔跑，时速可达10英里，它的鼻孔长在喙部的最尖端，具有奇特的嗅觉功能，可以找到距地面7英寸土层下的小虫。kiwi 这个项目也能帮你找到项目国际化过程中的小虫。

## 钉钉用户群

<img src="https://img.alicdn.com/tfs/TB1SKKfNjTpK1RjSZKPXXa3UpXa-1242-1602.jpg" height="300">

## License
MIT
