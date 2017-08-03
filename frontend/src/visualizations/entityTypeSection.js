import * as d3 from "d3";
import _ from 'lodash';

defaultOpts = {
  rowheight: 30,
  className: 'sections'
}

export default function entityTypeSection(selection, segmentedData, opts = {}) {
  opts = _.merge(defaultOpts, opts);

  // selects group tag that corresponds to the current entity type
  selection.selectAll("g")
    .data(segmentedData)
    .enter()
    .append("g")
    .attr("class", opts.className)
    .attr("id", d => d.entityType)
    // sets the y displacement for the current entity type group
    .attr("transform", (d) => {
      return `translate(0,${d.entityData.y * opts.rowHeight})`
    })
   .append("text")
   .attr("x", 0)
   .attr("y", 0)
   .attr("style", "font-weight: bold")
   .text(d => d.entityType);
}

