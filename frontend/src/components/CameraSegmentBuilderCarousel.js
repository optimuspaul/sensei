import React from 'react';
import _ from 'lodash';
import { Carousel } from 'react-bootstrap';
import {getSenseiToken,  baseUrl, vantagePoints} from './../constants';
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

  toggleSubItems(camera, vantagePoint) {
    let elements = document.querySelectorAll(`.item .sub-item`);
    if (!_.isEmpty(elements)) {
      elements.forEach((el) => { el.style.display = 'none'; });
    }
    elements = document.querySelectorAll(`.item.active .camera-${camera}.vantage-point-${vantagePoint}`)
    if (!_.isEmpty(elements)) {
      elements.forEach((el) => { el.style.display = 'inline'; });
    }
  }

  handleKeyPress = (...args) => {
    console.log(...args);
  }


  shouldComponentUpdate(nextProps, nextState) {
    if ((this.props.vantagePoint !== nextProps.vantagePoint || this.props.camera !== nextProps.camera) && _.isEqual(nextProps.photos, this.props.photos)) {
      this.toggleSubItems(nextProps.camera, nextProps.vantagePoint);
      return false
    }
    if (!_.isEqual(nextProps.page, this.props.page)) {
      this.setState({index: (nextProps.page > this.props.page ? 15 : 34)})
    }
    return true;
  }

  moveCarousel = (event) => {
    event.preventDefault();
    let index = this.state.index;
    let delta = (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1);
    console.log('moveCarousel::delta::' + delta + '::index::' + index + '::index+delta::' + (index+delta) + '::page::' + this.props.page);
    index += delta;
    if (index < (_.size(this.props.photos[this.props.camera])-1) && index >= 0 ) {
      let result = this.props.onCarouselChange(delta, index);
      if (result) {
        result === 'forward' ? index = 16 : index = 34;
      }
      this.setState({index})
    }
  }

  render() {

    let loadingIndicator = (<div>Loading...</div>)


    if (_.isEmpty(this.props.photos) || !this.props.camera)  return null
    let carouselItems = _.map(this.props.photos[this.props.camera], (key, index) => {
      let content = _.reduce(_.keys(this.props.photos), (current, camera) => {
        _.each(vantagePoints, (vantagePoint) => {
          if (this.props.photos[camera][index]) {
            let url = this.props.photos[camera][index].replace('camera01', vantagePoint);
            current.images.push(<img key={`camera-${camera}-${vantagePoint}-image`}
                                 className={`sub-item camera-${camera} vantage-point-${vantagePoint}`}
                                 style={{display: (camera === this.props.camera && vantagePoint === this.props.vantagePoint) ? 'inline' : 'none'}}
                                 src={((this.state.index > (index-3)) || this.state.index === (index-10)) ? `${baseUrl()}/api/v1/camera_data/signed_url/${url}` : ''}/>)
            current.captions.push(<Carousel.Caption key={`camera-${camera}-${vantagePoint}-caption`}
                                    className={`sub-item camera-${camera} vantage-point-${vantagePoint}`}
                                    style={{display: (camera === this.props.camera && vantagePoint === this.props.vantagePoint) ? 'inline' : 'none'}}>
                                    <h3>camera {camera}</h3>
                                    <p>{url}</p>
                                  </Carousel.Caption>)
          }
        })
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
