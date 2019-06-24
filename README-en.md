<div align="center">
  <img src="https://img.alicdn.com/tfs/TB1wHaqyYGYBuNjy0FoXXciBFXa-512-512.svg" height="64">
  <h2>🐤 Kiwi - Well-established internationalization solution</h2>
</div>

[中文](https://github.com/alibaba/kiwi) | English

## Installation

```bash
yarn global add kiwi-clis && yarn add kiwi-intl
```

Then search "kiwi linter" in visual studio marketplace



## Usage

- Generate key by just one click
![提取文案](https://camo.githubusercontent.com/826598e27116fd0fb0b0931fc60ffbebecaa0075/68747470733a2f2f696d672e616c6963646e2e636f6d2f7466732f5442314559454e66546e49384b4a6a79304666585863646f5658612d313030362d3336382e676966)

- Detect Chinese within the code
![中文文案检测](https://camo.githubusercontent.com/8a537d1c20e689087ef6a0035761e3048f820852/68747470733a2f2f696d672e616c6963646e2e636f6d2f7466732f54423143485a527278475942754e6a7930466e585858356c7058612d313038382d3536382e706e67)

- Search the occupation
![文案搜索](https://camo.githubusercontent.com/c7385ffa640bcdd8c7e8037abd0e920f4b22e8dd/68747470733a2f2f696d672e616c6963646e2e636f6d2f7466732f544231647a663872704f5742754e6a7930466958585846785658612d313235362d3730302e706e67)



## Documentation

`kiwi-intl`: [📝 Link](https://github.com/alibaba/kiwi/tree/master/kiwi-intl)

`kiwi-cli`: [📝 Link](https://github.com/alibaba/kiwi/tree/master/kiwi-cli)

`kiwi-linter`: [📝 Link](https://github.com/alibaba/kiwi/tree/master/kiwi-linter)



## Why use Kiwi?

We can find out many excellent library that help the front-end developer to handle the internationalization, like `react-intl` and `I18N-loader`. Those libraries are good at multilingual-switching, but there still has some problems that need to be resolved.

- Not intuitive enough and hard to search after the text has replaced by internationalization keys
- So annoy to create the key for translation
- Hard to find out the all the text which is needed to be taken place by key
- Communication with the whole internationalization team.
- Front-end developers are hard to write layout code when they haven't got the translation, because the text length in different languages is not the same.

That's why we create Kiwi.


## What Kiwi solved?

Kiwi is not just an library for front-end internationalization, it's a full life cycle internationalization solution of a software, from design to release.

![kiwi](https://img.alicdn.com/tfs/TB1r_AzCW6qK1RjSZFmXXX0PFXa-1006-722.png)

Kiwi is based on kiwi-intl. you can use kiwi in any front-end library you like.

Developers can use kiwi linter for automatic batch Chinese text converting. We have provided [a plugin for vscode](https://marketplace.visualstudio.com/items?itemName=undefinedvs.vscode-i18n-linter) to prompt the original text next to the translation key. Of course you can search the Chinese translation in project, and jump to the relevant code. Kiwi has improved the bad feeling be brougth by the missing text.

Kiwi also helps developers to collect all the text without translation. They will be packed to an Excel, and you can mail it to your translation partners. We also built in google translation in our kiwi linter plugin, which allows developers to translate quickly before the translation team finish their jobs. That is really time saving.

After translation, we provide a command tool to help developers import it into the project by just one click.

We also developed a tslint package, that will help developers detect the untranslated text, and it's easy to integrate it in the git flow of your project.



## Who is using  Kiwi?

- Alibaba

It's happy to let us know that you and your company are using kiwi right now,  please leave us a message in [issue](https://github.com/alibaba/kiwi/issues) .



## Why is it called Kiwi?

Kiwi or kiwis are flightless birds🐤，but they are good at runn
ing which can reach the speed of 10 miles per hour. Kiwi is the only bird in the world with external nostrils at the tip of its long beak. These allows them to locate worms beneath the 7 inches soil. Our kiwi tools will help you find bugs for your international project.



## Community

Join our group chat by [DingTalk](https://www.dingtalk.com/en) and share your ideas and questions for Kiwi

<img src="https://img.alicdn.com/tfs/TB1SKKfNjTpK1RjSZKPXXa3UpXa-1242-1602.jpg" height="300">