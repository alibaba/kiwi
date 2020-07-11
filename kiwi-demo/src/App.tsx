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
        <p className="App-intro">{I18N.src.App.Click}</p>
        <div className="btns">
          <span className="btn" onClick={this.changeLang.bind(this, 'zh-CN')}>
            {I18N.src.App.chineseSimplified}</span>
          <span className="btn" onClick={this.changeLang.bind(this, 'en-US')}>
            English
          </span>
          <span className="btn" onClick={this.changeLang.bind(this, 'zh-TW')}>
            {I18N.src.App.traditionalChinese}</span>
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
