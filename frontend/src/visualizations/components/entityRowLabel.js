import * as d3 from "d3";
import _ from 'lodash';
import {entityInflections} from './../../constants';
import store from './../../store/configureStore';
import {selectEntity} from './../../actions/insightsActions';


const defaultOpts = {
  rowHeight: 30
}

export default function entityRowLabels(selection, opts = { }) {
  opts = _.merge({}, defaultOpts, opts);

  // adds the entity display names as labels for each entity row within the current group
  return selection.append("text")
      .attr("x", 5)
      .attr("y", opts.rowHeight / 1.5)
      .attr("dy", ".35em")
      .text(d => d.entityName)
      .on('click', (entity) => {
        store.dispatch(selectEntity(entity.entityId, _.invert(entityInflections)[entity.entityType]))
      });
}

