import React from 'react';
import Avatar from 'material-ui/lib/avatar';
import Gauge from './react-gauge';
import Paper from 'material-ui/lib/paper';
import Table from 'material-ui/lib/table/table';
import TableBody from 'material-ui/lib/table/table-body';
import TableHeader from 'material-ui/lib/table/table-header';
import TableRow from 'material-ui/lib/table/table-row';
import TableRowColumn from 'material-ui/lib/table/table-row-column';

export default class DriverComponent extends React.Component {
  render() {
    const image = this.props.id === 0 ? 'hamilton' : 'rosberg';
    return <Paper zDepth={2} style={this.props.style}>
      <br/>
      <Avatar size={150} className="driver-avatar" src={`images/${image}.png`} /><br />
      <Gauge speed={this.props.driver.currentSpeed} max={20000} value={this.props.driver.currentRPM} className="driver-gauge" />
      <Table className="redis-average-table">
        <TableHeader style={{display: 'none'}}>
          <TableRow />
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
          <TableRow>
            <TableRowColumn className="redis-partition-column">Average Speed</TableRowColumn>
            <TableRowColumn className="redis-partition-column">{this.props.driver.averageSpeed.toFixed(2)}</TableRowColumn>
          </TableRow>
          <TableRow>
            <TableRowColumn className="redis-partition-column">Average RPM</TableRowColumn>
            <TableRowColumn className="redis-partition-column">{this.props.driver.averageRPM.toFixed(2)}</TableRowColumn>
          </TableRow>
        </TableBody>
      </Table>
    </Paper>;
  }
}
