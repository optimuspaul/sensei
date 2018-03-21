import React, { Component } from 'react';


class Spinner extends Component {

  render() {
    let spinnerFile = 'spinner.svg';
    if (this.props.invert) {
      spinnerFile = 'spinner-inverse.svg';
    }
    let spinnerImg = <img className="spinner" src={`${process.env.PUBLIC_URL}/assets/${spinnerFile}`} alt="loading..."/>;

    let text = (
      <div className='row mb-4 mx-0'>
        <div className="col-md-12">
          <h5 className="text-center" style={{color: this.props.invert==='true' ? 'white' : 'black'}}>{this.props.text}</h5>
        </div>
      </div>
    )

    if (this.props.useLayout==='true') {
      return (
        <div className={this.props.className}>
          { this.props.text && text }
          <div className='row mb-4 mx-0 text-center justify-content-md-center'>
            <div className="col-md-12">
              {spinnerImg}
            </div>
          </div>
        </div>
      );
    } else {
      return <div className={this.props.className}>{spinnerImg}</div>;
    }
  }
}

export default Spinner;
