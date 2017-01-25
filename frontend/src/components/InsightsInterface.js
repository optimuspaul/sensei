import React from 'react';
import _ from 'lodash';
import EntityEntry from './EntityEntry';
import EntityForm from './EntityForm';
import d3 from 'd3';


class ManageEntitiesInterface extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      showingForm: false
    }
  }
  componentWillReceiveProps(nextProps) {

  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {


    var data = [4, 8, 15, 16, 23, 42];

    var x = d3.scale.linear()
        .domain([0, d3.max(data)])
        .range([0, 420]);

    d3.select(".chart")
      .selectAll("div")
        .data(data)
      .enter().append("div")
        .style("width", function(d) { return x(d) + "px"; })
        .text(function(d) { return d; });

    return (
      <div className="row">
        <div className="col-md-8">
          <div className="row">
            {entityTypes}
          </div>
        </div>
      </div>
    )
  }
}

export default ManageEntitiesInterface;
