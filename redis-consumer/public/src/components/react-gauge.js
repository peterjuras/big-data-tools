// DISCLAIMER
// Code is from Michigan.com, modified from https://github.com/michigan-com/react-gauge
// to fit into the Formula 1 example.

import React from 'react';

// http://stackoverflow.com/a/11832950/1337683
function roundTwoDecimals(number) {
  return Math.round(number * 100) / 100;
}

export default class ReactGauge extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      width: this.props.width,
      height: this.props.height
    }

    this.colors = {
      blue: '#255C69',
      green: '#2A7F40',
      orange: '#AA7139',
      red: '#AA4639'
    }

    window.onresize = this.resizeGauge.bind(this);
  }

  componentWillMount() {
    this.resizeGauge();
  }

  resizeGauge() {
    if (window.innerWidth > ReactGauge.defaultProps.width) {
      if (this.state.width < ReactGauge.defaultProps.width) {
        this.setState({
          width: ReactGauge.defaultProps.width,
          height: ReactGauge.defaultProps.width * .5
        });
      }

    } else {
      this.setState({
        width: window.innerWidth,
        height: window.innerWidth * .5
      });
    }
  }

  getStyles() {
    let xLeft = 0;
    let xMiddle = Math.round(this.state.width / 2);
    let xRight = this.state.width;

    let yTop = 0;
    let yMiddle = Math.round(this.state.height / 2);
    let yBottom = this.state.height;

    let percent = this.props.value / this.props.max;
    let degrees = percent * 180;

    // Outer circle
    let outerCircle = {
      r: xMiddle,
      cx: xMiddle,
      cy: yBottom
    }

    // Inner circle
    let innerCircle = {
      r: xMiddle * .8,
      cx: xMiddle,
      cy: yBottom
    }

    // Needle
    let needleCircle = {
      r: Math.round(this.state.width / 10),
      cx: Math.round(this.state.width / 2),
      cy: this.state.height
    }

    let needleWidth = 10;
    let needlePath = {
      d: `M ${xMiddle} ${yBottom - needleWidth} L 0 ${yBottom - needleWidth}`,
      strokeWidth: needleWidth
    }

    let needleStyle = {
      transformOrigin: '100% 50% 0',
      transform: `rotate(${degrees}deg)`,
      OTransition: 'transform 50ms ease-in',
      MozTransition: 'transform 50ms ease-in',
      WebkitTransition: 'transform 50ms ease-in'
    }

    // Text
    let textStyle = {
      // text: `${ roundTwoDecimals(percent * 100) }%`,
      text: `${ this.props.speed } km/h`,
      x: xMiddle,
      y: yBottom * .6,
      fontSize: this.state.width * .1
    }

    return { outerCircle, innerCircle, needleCircle, needlePath, needleStyle, textStyle }
  }

  render() {
    let styles = this.getStyles();

    return(
      <svg className={this.props.className} width={ this.state.width } height={ this.state.height }>
        <circle r={ styles.outerCircle.r }
            cx={ styles.outerCircle.cx  }
            cy={ styles.outerCircle.cy }
            fill={ this.colors.blue }>
        </circle>
        <circle r={ styles.innerCircle.r }
            cx={ styles.innerCircle.cx }
            cy={ styles.innerCircle.cy }
            fill="white">
        </circle>
        <text x={ styles.textStyle.x } y={ styles.textStyle.y }
          fontSize={ styles.textStyle.fontSize }
          fontFamily='Arimo'
          textAnchor='middle'
          fill={ this.colors.blue }>
            { styles.textStyle.text }
        </text>
        <g className="needle">
          <circle r={ styles.needleCircle.r }
              cx={ styles.needleCircle.cx  }
              cy={ styles.needleCircle.cy }
              fill={ this.colors.red }>
          </circle>
          <path style={ styles.needleStyle }
              d={ styles.needlePath.d }
              stroke={ this.colors.red }
              strokeWidth={ styles.needlePath.strokeWidth }>
          </path>
        </g>
      </svg>
    )
  }
}
ReactGauge.defaultProps = { width: 300, height: 150, min: 0, max: 100, value: 0};
