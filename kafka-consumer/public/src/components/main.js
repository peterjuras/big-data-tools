import React from 'react';
import io from 'socket.io-client'
import AppBar from 'material-ui/lib/app-bar';
import LeftNav from 'material-ui/lib/left-nav';
import MenuItem from 'material-ui/lib/menus/menu-item';
import TwitterComponent from './twitter';
import StatusComponent from './status';

function cleanTweets(oldTweets, newTweet, count) {
  const cleaned = [newTweet].concat(oldTweets);
  return cleaned.slice(0, count);
}

class MainComponent extends React.Component {
  constructor(...props) {
    super(...props);
    this.state = {
      menuOpen: false,
      statusVisible: false,
      kafka: { },
      tweets: [],
      published: 0
    };
    // TODO: Remove
    this.state = {
      menuOpen: false,
      statusVisible: true,
      kafka: {
        consumed: {
          0: 123,
          1: 123,
          2: 123,
          3: 123,
          4: 123,
          5: 123,
          6: 123,
          7: 123,
          8: 123,
          9: 123,
          10: 123,
          11: 123,
          12: 123,
          13: 123,
          14: 123,
          15: 123,
          16: 123,
          17: 123,
          18: 123,
          19: 123,
          20: 123,
          21: 123,
          22: 123,
          23: 123,
          24: 123,
          25: 123,
          26: 123,
          27: 123,
          28: 123,
          29: 123,
        },
        topicMetadata: {
          0: { leader: 0 },
          1: { leader: 1 },
          2: { leader: 2 },
          3: { leader: 0 },
          4: { leader: 1 },
          5: { leader: 2 },
          6: { leader: 0 },
          7: { leader: 1 },
          8: { leader: 2 },
          9: { leader: 0 },
          10: { leader: 1 },
          11: { leader: 2 },
          12: { leader: 0 },
          13: { leader: 1 },
          14: { leader: 2 },
          15: { leader: 0 },
          16: { leader: 1 },
          17: { leader: 2 },
          18: { leader: 0 },
          19: { leader: 1 },
          20: { leader: 2 },
          21: { leader: 0 },
          22: { leader: 1 },
          23: { leader: 2 },
          24: { leader: 0 },
          25: { leader: 1 },
          26: { leader: 2 },
          27: { leader: 0 },
          28: { leader: 1 },
          29: { leader: 2 },
        },
        brokers: [
          { id: 0 }, { id: 1 }
        ],
        status: {
          0: 'true',
          1: 'true',
          2: 'false'
        }
      },
      published: 1234
    }
  }

  componentWillMount() {
    const socket = io(`${window.location.host}:3000`);

    socket.on('connect', () => {
      socket.emit('subscribe', this.props.topic);
    });

    socket.on('tweet', msg => {
      const newTweets = cleanTweets(this.state.tweets, JSON.parse(msg.tweet.value), 25);
      this.setState({
        kafka: msg.kafka,
        tweets: newTweets
      });
    });

    socket.on(`published:${this.props.topic}`, msg => this.setState({ published: msg }));
  }

  displayTweets = () => this.setState({
    menuOpen: false,
    statusVisible: false
  });

  displayStatus = () => this.setState({
    menuOpen: false,
    statusVisible: true
  });

  openMenu = () => this.setState({
    menuOpen: true,
    statusVisible: this.state.statusVisible
  });

  render() {
    const visibleComponent = this.state.statusVisible ?
      <StatusComponent published={this.state.published} kafka={this.state.kafka} /> :
      <TwitterComponent tweets={this.state.tweets} />;
    return <div>
      <AppBar title={`Kafka Consuming: #${this.props.topic}`} onLeftIconButtonTouchTap={this.openMenu} />
      <LeftNav docked={false} open={this.state.menuOpen}>
        <AppBar title="Kafka Consuming" showMenuIconButton={false} />
        <MenuItem onTouchTap={this.displayTweets}>Tweets</MenuItem>
        <MenuItem onTouchTap={this.displayStatus}>Status</MenuItem>
      </LeftNav>
      {visibleComponent}
    </div>;
  }
}

export default MainComponent;
