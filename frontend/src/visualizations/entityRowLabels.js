
import * as d3 from "d3";
import _ from 'lodash';
import {entityInflections} from './../constants';

defaultOpts = {
  rowheight: 30
}

export default function entityRowLabels(row, opts) {
  opts = _.merge(defaultOpts, opts);

  // adds the entity display names as labels for each entity row within the current group
  return row.append("text")
      .attr("x", 5)
      .attr("y", opts.rowHeight / 1.5)
      .attr("dy", ".35em")
      .text(function(entity) { return entity })
      .on('click', (entity) => {
        store.dispatch(selectEntity(entity.entityId, _.invert(entityInflections)[entity.entityType]))
      });
}

