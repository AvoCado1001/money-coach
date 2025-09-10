import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css'; /* 이 부분을 추가합니다. */

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);