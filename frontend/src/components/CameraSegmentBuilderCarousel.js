import React from 'react';
import _ from 'lodash';
import { Carousel } from 'react-bootstrap';
import {getSenseiToken,  baseUrl, vantagePoints} from './../constants';
import { Preload } from 'react-preload';
import { parsePhotoSegmentTimestamp } from './../utils';
import moment from 'moment';
import momentTimezoneSetup from 'moment-timezone';
import KeyHandler, {KEYDOWN} from 'react-key-handler';

momentTimezoneSetup(moment);

class CameraSegmentBuilderCarousel extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      index: props.page > 0 ? 15 : (props.index || 0),
      direction: null
    }
  }

  handleSelect = (selectedIndex, e) => {
    let delta = selectedIndex - this.state.index;
    this.props.onCarouselChange(delta, selectedIndex);
    this.setState({
      index: selectedIndex,
      direction: e.direction
    });
  }

  shouldComponentUpdate(nextProps, nextState) {

    if (!_.isEqual(nextProps.page, this.props.page)) {
      this.setState({index: (nextProps.page > this.props.page ? 15 : 34)})
    } else if (!_.isEqual(nextProps.index, this.props.index)) {
      this.setState({index: nextProps.index })
    }    

    return true;
  }

  moveCarousel = (event) => {
    event.preventDefault();
    let index = this.state.index;
    let delta = (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1);
    index += delta;
    if (index < (_.size(this.props.photos[this.props.camera])-1) && index >= 0 ) {
      let result = this.props.onCarouselChange(delta, index, this.props.photos[this.props.camera][index]);
      if (result) {
        result === 'forward' ? index = 15 : index = 34;
      }
      this.setState({index})
    }
  }

  render() {

    let loadingIndicator = (<div>Loading...</div>)


    if (_.isEmpty(this.props.photos) || !this.props.camera)  return null
    let carouselItems = _.map(this.props.photos[this.props.camera], (key, index) => {
      let delta = this.state.index - index;
      let content = _.reduce(_.keys(this.props.photos), (current, camera) => {
        _.each(this.props.vantagePoints, (vantagePoint, i) => {
          let url = this.props.photos[camera][index];
          let maxDelta = camera === 'video' ? 1 : 5;
          if (url && delta === 0 || ((Math.abs(delta) < maxDelta && this.props.vantagePoint === vantagePoint && this.props.camera === camera))) {
            url = url.replace('camera01', vantagePoint).replace('/camera/', `/${camera === 'overlays' ? 'overlays' : 'camera'}/`).replace('still', camera === 'video' ? 'video' : 'still').replace('.jpg', camera === 'camera' ? '.jpg' : (camera === 'video' ? '.mp4' : '_rendered.png') );
            let subItemClass = `sub-item camera-${camera} vantage-point-${vantagePoint}`;
            
            if (camera === 'video') {
              current.images.push(<video key={`image-${camera}-${vantagePoint}`} className={subItemClass} controls autoPlay>
                                    <source src={`${baseUrl()}/api/v1/camera_data/signed_url/${url}`} type="video/mp4"/>
                                  </video>
                                  )
            } else {
              current.images.push(<img key={`image-${camera}-${vantagePoint}`}
                                   className={subItemClass}
                                   src={`${baseUrl()}/api/v1/camera_data/signed_url/${url}`}/>)
              
            }
            current.captions.push(<Carousel.Caption key={`image-${camera}-${vantagePoint}`} className={subItemClass}>
                                    <h3>{moment(parsePhotoSegmentTimestamp(url)).tz(this.props.timezone).format("h:mm:ss A z")}</h3>
                                  </Carousel.Caption>)

          } else {
            return '';
          }
        })
        return current;
      }, {images: [], captions: []});

      let order = delta < 0 ? 'future' : 'past';
      let siblingClass = delta !== 0 && Math.abs(delta) < 5 ? `${order} ${order}-${Math.abs(delta)}` : '';

      return (
        <Carousel.Item key={index} className={`camera-${this.props.camera} vantage-point-${this.props.vantagePoint} ${ siblingClass }`}>
          { content.images }
          { content.captions }
        </Carousel.Item>
      );
    })


    return (
      <div>
        <KeyHandler keyEventName={KEYDOWN} keyValue="ArrowRight" onKeyHandle={this.moveCarousel} />
        <KeyHandler keyEventName={KEYDOWN} keyValue="ArrowLeft" onKeyHandle={this.moveCarousel} />

        <Carousel
          className={this.props.camera === 'video' ? 'video' : ''}
          slide={false}
          wrap={false}
          activeIndex={this.state.index}
          indicators={false}
          direction={this.state.direction}
          onSelect={this.handleSelect}>
          {carouselItems}
        </Carousel>
      </div>
    )
  }
}

export default CameraSegmentBuilderCarousel;
