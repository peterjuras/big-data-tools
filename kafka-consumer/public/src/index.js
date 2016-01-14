import React from 'react';
import ReactDOM from 'react-dom';
import MainComponent from './components/main';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getParameterByName from './lib/parameter';

injectTapEventPlugin();

const topic = getParameterByName('topic');
ReactDOM.render(<MainComponent topic={topic} />, document.getElementById('container'));
