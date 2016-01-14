import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import TweetComponent from './tweet';

class TwitterComponent extends React.Component {
  render () {
    const tweets = this.props.tweets.filter(tweet => tweet.id).map(tweet => <TweetComponent key={tweet.id} tweet={tweet}/>);
    return <div style={this.props.style} className="kafka-tweets">
      {tweets}
    </div>;
  }
}

export default TwitterComponent;
