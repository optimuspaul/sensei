

import * as d3 from "d3";
import _ from 'lodash';

defaultOpts = {
  rowheight: 30
}

export default function entityTypeSection(chart, entityType, entityData, opts) {
  opts = _.merge(defaultOpts, opts);

  // selects group tag that corresponds to the current entity type
  let section = chart.select(`#${entityType}`);

  // sets the y displacement for the current entity type group
  section.attr("transform", "translate(0," + ((entityData.y * ROW_HEIGHT)) + ")");

  // adds the entity type label for the current entity group
  section.append("text")
         .attr("x", 0)
         .attr("y", 0)
         .attr("style", "font-weight: bold")
         .text(entityType);

   return section;
}

