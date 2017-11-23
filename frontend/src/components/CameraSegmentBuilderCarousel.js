import React from 'react';
import _ from 'lodash';
import { Carousel } from 'react-bootstrap';
import {getSenseiToken,  baseUrl} from './../constants';
import { Preload } from 'react-preload';
import KeyHandler, {KEYDOWN} from 'react-key-handler';

class CameraSegmentBuilderCarousel extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      index: 0,
      direction: null
    }
  }

  handleSelect = (selectedIndex, e) => {
    this.props.onCarouselChange(selectedIndex);
    this.setState({
      index: selectedIndex,
      direction: e.direction
    });
  }

  toggleImage(camera, show) {
    let elements = document.querySelectorAll(`.item.active .camera-${camera}`)
    if (!_.isEmpty(elements)) {
      elements.forEach((el) => { el.style.display = show ? 'inline' : 'none'; });
    }
  }

  handleKeyPress = (...args) => {
    console.log(...args);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.camera !== nextProps.camera && _.isEqual(nextProps.photos, this.props.photos)) {
      this.toggleImage(nextProps.camera, true);
      this.toggleImage(this.props.camera, false);
      return false;
    } else {
      if (!_.isEqual(nextProps.page, this.props.page)) {
        this.setState({index:0})
      }
      return true;
    }
  }

  moveCarousel = (event) => {
    event.preventDefault();
    let index = this.state.index;
    index += (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1);
    if (index < (_.size(this.props.photos[this.props.camera])-1) && index >= 0 ) {
      this.setState({index: this.props.onCarouselChange(index) ? 0 : index})
    }
  }

  render() {

    let loadingIndicator = (<div>Loading...</div>)
    

    if (_.isEmpty(this.props.photos) || !this.props.camera)  return null
    let carouselItems = _.map(this.props.photos[this.props.camera], (key, index) => {
      let content = _.reduce(_.keys(this.props.photos), (current, camera) => { 
        current.images.push(<img key={`camera-${camera}-image`} 
                             className={`camera-${camera}`} 
                             style={{display: camera === this.props.camera ? 'inline' : 'none'}} 
                             src={((this.state.index > (index-3)) || this.state.index === (index-10)) ? `${baseUrl()}/api/v1/camera_data/signed_url/${this.props.photos[camera][index]}` : ''}/>)
        current.captions.push(<Carousel.Caption key={`camera-${camera}-caption`} 
                                className={`camera-${camera}`}
                                style={{display: camera === this.props.camera ? 'inline' : 'none'}}>
                                <h3>camera {camera}</h3>
                                <p>{this.props.photos[camera][index]}</p>
                              </Carousel.Caption>)
        return current;
      }, {images: [], captions: []});

      return (
        <Carousel.Item key={index}>
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
