import * as d3 from "d3";
import {entityInflections} from './../constants';
import {selectEntity} from './../actions/insightsActions';
import store from './../store/configureStore';
import timeTicks from './timeTicks';
import chart from './chart';
import {startAndEndTimes, generateXScalar, calcChartHeight} from './utils';
import entityTypeSection from './entityTypeSection';
import entityRow from './entityRow';
import entityRowLabel from './entityRowLabel';
import segmentData from './segmentData';
import _ from 'lodash';

const rowHeight = 30; // how tall each row of data in timeline is
const offset = 205; // how far to the right the interaction segments should start being drawn from

const entitiesToShow = {
  child: ['children', 'areas', 'materials', 'teachers'],
  teacher: ['children', 'areas'],
  area: ['children', 'teachers'],
  material:  ['children']
}

/*
  plots the interaction segments for each entity within the current entity type group. The
  segments are based on a running average of radio observations between the current entity
  and any other given entity. Each segment is scaled linearly on the x-axis using xScalar
  defined above, and its timestamp is added as a data attribute for debugging purposes.
 */
export default function segmentedTimeline(data) {

  if (!data) {
    return
  }

  let zoom = _.get(store.getState(), "insights.ui.zoom") || 1;
  const chartWidth = 1260 * zoom; // how wide the width of the visualization is
  let currentEntityType = _.get(store.getState(), "insights.ui.currentEntityType");
  let segmentedData = segmentData(data.entities, store.getState().entitiesentitiesToShow);
  let {startTime, endTime} = startAndEndTimes(data.timestamps);
  let xScalar = generateXScalar(startTime, endTime, chartWidth-offset);
  let chartHeight = calcChartHeight(segmentedData);


  chart(chartWidth, chartHeight + 20)
    .call(timeTicks, startTime, endTime, xScalar, {offset, y: 10, zoom})
    .call(timeTicks, startTime, endTime, xScalar, {offset, y: chartHeight+15, zoom})
    .selectAll("g")
    .data(segmentedData)
    .call(entityTypeSection, {className: 'segments'})
    .selectAll("g.segments")
    .data(d => d.entities)
    .call(entityRow, 'row')
    .selectAll("g.row")
    .call(entityRowLabel)
    .selectAll("rect")
    .data((observation, index) => {
      return entityData.obs[index]
    })
    .enter().append("rect")
    .attr("x", (observation, index) => {
      let timestamp = new Date(observation[0]);
      return xScalar(timestamp.getTime()) + offset
    })
    .attr('width', (observation, index) => {
      let startTimestamp = new Date(observation[0]);
      let endTimestamp = new Date(observation[1]);
      return xScalar(endTimestamp.getTime()) - xScalar(startTimestamp.getTime());
    })
    .attr('height', rowHeight*0.6)
    .attr("y", rowHeight*0.2)
    .attr("data-timestamp", (observation, index) => {
      return data.timestamps[index]
    })


}
