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

let bufferState;
let lastState;

class MainComponent extends React.Component {
  constructor(...props) {
    super(...props);
    this.state = bufferState = lastState = {
      menuOpen: false,
      statusVisible: false,
      kafka: { },
      tweets: [],
      published: 0
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

    socket.on('connect', () => {
      socket.emit('subscribe', this.props.topic);
    });

    socket.on('tweet', msg => {
      let newTweets = [];
      newTweets = cleanTweets(this.state.tweets, JSON.parse(msg.tweet.value), 25);
      bufferState = {
        kafka: msg.kafka,
        tweets: newTweets,
        published: bufferState.published
      };
    });

    socket.on(`published:${this.props.topic}`, msg => bufferState = {
      kafka: bufferState.kafka,
      tweets: bufferState.tweets,
      published: msg
    });
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
