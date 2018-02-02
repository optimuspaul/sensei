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
  let text = selection
    .selectAll("text")
    .data(d => {
      return [d];
    })

  text.exit().remove();

  text.enter().append("text")
    .merge(text)
    .attr("y", opts.rowHeight / 1.5)
    .attr("dy", ".35em")
    .attr("x", 5)
    .text((d) => {
      return d.entityName.length > 14 ? `${d.entityName.substring(0,13)}..` : d.entityName;
    })
    .on('click', (entity) => {
        store.dispatch(selectEntity(entity.entityId, _.invert(entityInflections)[entity.entityType]))
      })
      
}

