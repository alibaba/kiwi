import * as React from 'react';
import './App.css';
import I18N, { LangEnum } from './I18N';
import logo from './logo.svg';

class App extends React.Component {
  public changeLang(lang: LangEnum) {
    document.cookie = `kiwi-locale=${lang}; path=/`;
    window.location.reload();
  }
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">Hello kiwi 🐤 点击切换语言</p>
        <p className="App-intro">Hello kiwi 🐤 点击切换语言</p>
        <p className="App-intro">Hello kiwi 🐤 点击切换语言</p>
        <p className="App-intro">Hello kiwi 🐤 点击切换语言</p>
        <div className="btns">
          <span className="btn" onClick={this.changeLang.bind(this, 'zh-CN')}>
            中文简体
          </span>
          <span className="btn" onClick={this.changeLang.bind(this, 'en-US')}>
            English
          </span>
          <span className="btn" onClick={this.changeLang.bind(this, 'zh-TW')}>
            中文繁体
          </span>
        </div>
        <br />
        <p>
          <span>{I18N.common.test}</span>
        </p>
      </div>
    );
  }
}

export default App;
