

import * as d3 from "d3";
import _ from 'lodash';

defaultOpts = {
  rowheight: 30
}

export default function entityRows(section, entityData, entityType, opts) {
  opts = _.merge(defaultOpts, opts);

    /*
      adds a row for each entity included in the current entity type group and sets
      its correct y displacement
     */
   return section.selectAll("g")
            .data(entityData.entities)
            .enter()
            .append("g")
            .attr("transform", function(entity, index) {
              return "translate(0," + index * ROW_HEIGHT + ")";
            });
}


