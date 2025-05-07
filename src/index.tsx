import React from 'react';
import ReactDOM from 'react-dom';
import './styles/base.css';
import './styles/components.css';
import './styles/utilities.css';
import './styles/buttons.css';
import './styles/responsive.css';
import App from './components/App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);