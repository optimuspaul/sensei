import * as d3 from "d3";
import {entityInflections} from './../constants';
import {selectEntity} from './../actions/insightsActions';
import store from './../store/configureStore';
import timeTicks from './timeTicks';
import chart from './chart';
import {startAndEndTimes, generateXScalar, calcChartHeight} from './utils';
import entityTypeSection from './entityTypeSection';
import _ from 'lodash';

const ROW_HEIGHT = 30; // how tall each row of data in timeline is
const OFFSET = 205; // how far to the right the interaction segments should start being drawn from

const ENTITIES_TO_SHOW = {
  child: ['children', 'areas', 'materials', 'teachers'],
  teacher: ['children', 'areas'],
  area: ['children', 'teachers'],
  material:  ['children']
}

export default function segmentedTimeline(data) {

  if (!data) {
    return
  }

  let zoom = _.get(store.getState(), "insights.ui.zoom") || 1;

  const STATIC_WIDTH = 1260 * zoom; // how wide the width of the visualization is

  let currentEntityType = _.get(store.getState(), "insights.ui.currentEntityType");

  let segmentedData = segmentData(data.entities, store.getState().entities, ENTITIES_TO_SHOW);

  let {startTime, endTime} = startAndEndTimes(data.timestamps);

  let xScalar = generateXScalar(startTime, endTime, STATIC_WIDTH-OFFSET);

  let chartHeight = calcChartHeight(segmentedData);


  timeTicks(startTime, endTime, {
    offset: OFFSET,
    chartHeight,
    staticWidth: STATIC_WIDTH,
    selector: '#visualization svg #ticks'
  });


  let chart = chart(STATIC_WIDTH, chartHeight + 20);


  // builds each entity type section using the segmentedData generated above
  _.each(segmentedData, (entityData, entityType) => {
    let section = entityTypeSection(chart, entityData, entityType);
    let row = entityRows(section, entityData, entityType);
    entityRowLabels(row);
  });

  let sections = entityTypeSections(chart, segmentedData);

  let rows = entityRows(sections, segmentedData);

  /*
    Builds each entity row in the timeline visualization by taking the entity data
    and entity type provided and creating a label and plotting the interaction segments using
    d3 and scaled linearly to fit the SVG's fixed width
   */
  function buildSection(entityData, entityType) {


    // adds the entity display names as labels for each entity row within the current group
    row.append("text")
        .attr("x", 5)
        .attr("y", ROW_HEIGHT / 1.5)
        .attr("dy", ".35em")
        .text(function(entity) { return entity })
        .on('click', (entity) => {
          store.dispatch(selectEntity(entity.entityId, _.invert(entityInflections)[entity.entityType]))
        });



    /*
      plots the interaction segments for each entity within the current entity type group. The
      segments are based on a running average of radio observations between the current entity
      and any other given entity. Each segment is scaled linearly on the x-axis using xScalar
      defined above, and its timestamp is added as a data attribute for debugging purposes.
     */
    row.selectAll("rect")
       .data((observation, index) => { return entityData.obs[index]})
       .enter().append("rect")
       .attr("x", (observation, index) => {
          let timestamp = new Date(observation[0]);
          return xScalar(timestamp.getTime()) + OFFSET
        })
       .attr('width', (observation, index) => {
          let startTimestamp = new Date(observation[0]);
          let endTimestamp = new Date(observation[1]);
          return xScalar(endTimestamp.getTime()) - xScalar(startTimestamp.getTime());
        })
       .attr('height', ROW_HEIGHT*0.6)
       .attr("y", ROW_HEIGHT*0.2)
       .attr("data-timestamp", (observation, index) => { return data.timestamps[index] })
  }

}
