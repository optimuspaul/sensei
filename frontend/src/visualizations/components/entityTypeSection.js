import * as d3 from "d3";
import _ from 'lodash';

const defaultOpts = {
  rowHeight: 30,
  className: 'sections'
}

export default function entityTypeSection(selection, opts = {}) {
  opts = _.merge({}, defaultOpts, opts);

  // selects group tag that corresponds to the current entity type
  selection
    .enter()
    .append("g")
    .attr("class", opts.className)
    .attr("id", (d) => { 
      return d[0];
    })
    // sets the y displacement for the current entity type group
    .attr("transform", (d) => {
      return `translate(0,${d[1].y * opts.rowHeight})`
    })
   .append("text")
   .attr("x", 0)
   .attr("y", 0)
   .attr("style", "font-weight: bold")
   .text(d => d[0]);
}

