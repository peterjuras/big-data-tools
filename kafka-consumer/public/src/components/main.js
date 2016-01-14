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

let buffer;
let publishedBuffer;
let lastState;
let lastPublished;

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
    setInterval(() => {
      if (buffer && (buffer !== lastState || publishedBuffer !== lastPublished)) {
        buffer.published = publishedBuffer;
        this.setState(buffer);
        lastState = buffer;
        lastPublished = publishedBuffer;
      }
    }, 100);
  }

  componentWillMount() {
    const socket = io(`${window.location.host}:3000`);

    socket.on('connect', () => {
      socket.emit('subscribe', this.props.topic);
    });

    socket.on('tweet', msg => {
      let newTweets = [];
      if (!this.state.statusVisible) {
        newTweets = cleanTweets(this.state.tweets, JSON.parse(msg.tweet.value), 25);
      }
      buffer = {
      // this.setState({
        kafka: msg.kafka,
        tweets: newTweets
      // });
      };
    });

    socket.on(`published:${this.props.topic}`, msg => publishedBuffer = msg);
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
