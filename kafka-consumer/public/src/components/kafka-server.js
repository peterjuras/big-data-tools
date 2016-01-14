import React from 'react';
import Paper from 'material-ui/lib/paper';
import Table from 'material-ui/lib/table/table';
import TableBody from 'material-ui/lib/table/table-body';
import TableFooter from 'material-ui/lib/table/table-footer';
import TableHeader from 'material-ui/lib/table/table-header';
import TableHeaderColumn from 'material-ui/lib/table/table-header-column';
import TableRow from 'material-ui/lib/table/table-row';
import TableRowColumn from 'material-ui/lib/table/table-row-column';

class KafkaServerComponent extends React.Component {
  render() {
    const partitions = Object.keys(this.props.kafka.topicMetadata)
      .filter(partition => this.props.kafka.topicMetadata[partition].leader === this.props.id)
      .map(partition => <TableRow key={partition}><TableRowColumn>Partition {partition}</TableRowColumn><TableRowColumn>{this.props.kafka.consumed[partition]}</TableRowColumn></TableRow>);

    const brokerOnline = this.props.kafka.brokers
      .filter(broker => broker.id === this.props.id).length > 0;
    let status;
    if (brokerOnline) {
      status = 'images/kafka-online.png';
    } else {
      status = 'images/kafka-offline.png';
    }
    return <div>
      <Paper className="kafka-image-paper">
        <img className="kafka-status-image" src={status}/>
      </Paper>
      <Table>

        <TableBody>
          {partitions}
        </TableBody>
      </Table>
    </div>;
  }
}

export default KafkaServerComponent;
