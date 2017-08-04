

import * as d3 from "d3";
import _ from 'lodash';

const defaultOpts = {
  rowHeight: 30,
  className: 'row'
}

export default function entityRows(selection, opts = {}) {
  opts = _.merge({}, defaultOpts, opts);

  /*
    adds a row for each entity included in the current entity type group and sets
    its correct y displacement
   */
  selection.enter()
      .append("g")
      .attr("class", opts.className)
      .attr("transform", (entity, index) => {
        return "translate(0," + index * opts.rowHeight + ")";
      });
}


