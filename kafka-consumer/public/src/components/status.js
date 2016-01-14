import React from 'react';
import Paper from 'material-ui/lib/paper';
import KafkaServerComponent from './kafka-server';

class StatusComponent extends React.Component {
  render() {
    if (!this.props.kafka.brokers) {
      return <div style={{margin: '20px'}}>Waiting for first tweet</div>;
    }
    const brokers = [0, 1, 2]
      .map(broker =>
        <td key={broker} className="kafka-column">
          <KafkaServerComponent id={broker} kafka={this.props.kafka} />
        </td>)
    const totalConsumed = Object.keys(this.props.kafka.consumed)
      .reduce((previous, partition) => previous + this.props.kafka.consumed[partition], 0)
    return <div style={this.props.style} className="kafka-status">
      <Paper className="kafka-status-paper" zDepth={2}>
        <table className="kafka-table">
          <tbody>
            <tr>
              <td className="kafka-count-column">
                <Paper className="kafka-count">
                  <br/>{this.props.published}<br/>
                  <span style={{fontSize: '0.8em'}}>Produced</span>
                </Paper>
              </td>
              <td className="kafka-count-column">
                <Paper className="kafka-count">
                  <br/>{totalConsumed}<br/>
                  <span style={{fontSize: '0.8em'}}>Consumed</span>
                </Paper>
              </td>
            </tr>
          </tbody>
        </table>
      </Paper>
      <Paper className="kafka-status-paper" zDepth={2}>
        <table className="kafka-table">
          <tbody>
            <tr>
              {brokers}
            </tr>
          </tbody>
        </table>
      </Paper>
    </div>;
  }
}

export default StatusComponent;
