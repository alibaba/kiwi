import * as React from 'react';
import './App.css';
import I18N from './I18N';

import logo from './logo.svg';

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          Hello kiwi 🐤
          <br/>
          This is a kiwi demo
          <br/>
          <span>{I18N.common.test}</span>
        </p>
      </div>
    );
  }
}

export default App;
