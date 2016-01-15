import React from 'react';
import io from 'socket.io-client'
import AppBar from 'material-ui/lib/app-bar';
import Divider from 'material-ui/lib/divider';
import Paper from 'material-ui/lib/paper';

let bufferState;
let lastState;

class MainComponent extends React.Component {
  constructor(...props) {
    super(...props);
    this.state = bufferState = lastState = {
      produced: 0,
      perSecond: 0
    };
    setInterval(() => {
      if (bufferState && bufferState !== lastState) {
        this.setState(bufferState);
        lastState = bufferState;
      }
    }, 16);
  }

  componentWillMount() {
    const socket = io(`${window.location.host}:3000`);

    socket.on('produced', message => bufferState = message);
  }

  render() {
    return <div>
      <AppBar title={'Kafka Massproducing'} showMenuIconButton={false} />
      <Paper className="mass-paper" zDepth={2}>
        <span className="mass-number">{this.state.produced}</span>
        <br />
        <span className="mass-label">produced</span>
        <Divider className="mass-divider" />
        <span className="mass-number">{`~${this.state.perSecond}`}</span>
        <br />
        <span className="mass-label">per second</span>
      </Paper>
    </div>;
  }
}

export default MainComponent;
