import React from 'react';
import io from 'socket.io-client'
import AppBar from 'material-ui/lib/app-bar';
import Divider from 'material-ui/lib/divider';
import Paper from 'material-ui/lib/paper';
import Colors from 'material-ui/lib/styles/colors';
import Driver from './driver';

let bufferState;
let lastState;

class MainComponent extends React.Component {
  constructor(...props) {
    super(...props);
    this.state = bufferState = lastState = {
      totalMessages: 0,
      perSecond: 0,
      drivers: [],
      averageCalculationTime: 0
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

    socket.on('update', message => bufferState = message);
  }

  render() {
    const drivers = this.state.drivers
      .map((driver, index) => {
        const style = index === 0 ? { marginRight: '10px'} : { marginLeft: '10px' };
        return <td key={index}><Driver driver={driver} id={index} style={style} /></td>
      });
    return <div>
      <AppBar title={'Redis Example: Formula 1'} style={{backgroundColor: Colors.grey800}} showMenuIconButton={false} />
      <div className="redis-status">
        <Paper className="redis-status-paper" zDepth={2}>
          <table className="redis-table">
            <tbody>
              <tr>
                <td className="redis-count-column">
                  <Paper className="redis-count">
                    <br/>{this.state.totalMessages}<br/>
                    <span style={{fontSize: '0.8em'}}>Total messages</span>
                  </Paper>
                </td>
                <td className="redis-count-column">
                  <Paper className="redis-count">
                    <br/>{this.state.perSecond}<br/>
                    <span style={{fontSize: '0.8em'}}>~ Messages / s</span>
                  </Paper>
                </td>
                <td className="redis-count-column">
                  <Paper className="redis-count">
                    <br/>{this.state.averageCalculationTime} ms<br/>
                    <span style={{fontSize: '0.8em'}}>AVG calc. time</span>
                  </Paper>
                </td>
              </tr>
            </tbody>
          </table>
        </Paper>
        <table className="redis-table">
          <tbody>
            <tr>
              {drivers}
            </tr>
          </tbody>
        </table>
      </div>
    </div>;
  }
}

export default MainComponent;
