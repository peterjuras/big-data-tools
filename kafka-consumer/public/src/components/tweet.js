import React from 'react';
import Card from 'material-ui/lib/card/card';
import CardHeader from 'material-ui/lib/card/card-header';
import CardTitle from 'material-ui/lib/card/card-title';
import CardText from 'material-ui/lib/card/card-text';

import moment from 'moment';

class TweetComponent extends React.Component {
  render() {
    return <Card zDepth={2} className="kafka-card">
      <CardHeader title={this.props.tweet.user.name} subtitle={moment(this.props.tweet['timestamp_ms'], 'x').fromNow()} avatar={this.props.tweet.user['profile_image_url']}/>
      <CardText>
        {this.props.tweet.text}
      </CardText>
    </Card>;
  }
}

export default TweetComponent;
