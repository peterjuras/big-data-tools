import React from 'react';
import ReactDOM from 'react-dom';
import MainComponent from './components/main';
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

ReactDOM.render(<MainComponent />, document.getElementById('container'));
