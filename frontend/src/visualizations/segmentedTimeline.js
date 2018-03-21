import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {startAndEndTimes, generateXScalar, calcChartHeight, segmentData, timelineTicks} from './utils';
import {entityRow, entityRowLabel, entityTypeSection, timeTicks} from './components';
import _ from 'lodash';

const rowHeight = 30; // how tall each row of data in timeline is
const offset = 205; // how far to the right the interaction segments should start being drawn from

const TZO = (new Date()).getTimezoneOffset()*60*1000;

/*
  plots the interaction segments for each entity within the current entity type group. The
  segments are based on a running average of radio observations between the current entity
  and any other given entity. Each segment is scaled linearly on the x-axis using xScalar
  defined above, and its timestamp is added as a data attribute for debugging purposes.
 */
export default function segmentedTimeline() {

  document.querySelector("div#segmentedTimeline svg").innerHTML = "<g id='top-ticks' class='ticks'></g><g id='bottom-ticks' class='ticks'></g>";
  let vizElement = document.querySelector("#visualization #segmentedTimeline");
  let chartElement = document.querySelector("#visualization");
  let chart = d3.select("#visualization div#segmentedTimeline svg");
  let topTicks = chart.select("g#top-ticks");
  let bottomTicks = chart.select("g#bottom-ticks");
  let color = d3.scaleOrdinal(d3.schemeCategory10).domain([0,5]);
  let rawData;
  let zoom;

  let updateChart = (event, zoomKick) => {

    if (!zoomKick) {
      vizElement.style.display = 'none';
      setTimeout(() => {
        vizElement.style.display = 'inline';
      },1000)
    }

    let newZoom = zoomKick || _.get(store.getState(), "insights.ui.zoom", 1);

    if (!event.detail || (_.isEqual(event.detail, rawData) && parseInt(newZoom) === parseInt(zoom)) ) {
      return;
    } else {
      rawData = event.detail;
      zoom = newZoom;
    }

    zoom = _.isNaN(zoom) ? 1 : zoom;

    let data = transformIps(rawData);


    var t = d3.transition()
    .duration(400)
    .ease(d3.easeLinear);

    let chartWidth = 1260 * zoom; // how wide the width of the visualization is
    let segmentedData = segmentData(data);
    let {startTime} = startAndEndTimes(data.timestamps);
    let endTime = new Date(startTime.getTime());
    startTime.setHours(7);
    endTime.setHours(17);
    let xScalar = generateXScalar(startTime, endTime, chartWidth-offset);
    let chartHeight = calcChartHeight(segmentedData);
    let ticks = timelineTicks(startTime, endTime, xScalar, zoom);
    let firstDate = startTime.getDate();

    chart.attr("width", chartWidth)
      .attr("height", chartHeight + 20)
      .selectAll("g.segments")
      .data(segmentedData)
      .call(entityTypeSection, {className: 'segments'})

    let row = chart.selectAll("g.segments")
      .selectAll("g.row")
      .data((d) => {
        return d[1].entities || [];
      })

    row.call(entityRow, 'row')
    row.call(entityRowLabel)

    let rect = row.selectAll("rect")
      .data((d) => {
        return d ? d.obs : [];
      })

    rect.exit().remove();

    rect.enter().append("rect")
      .merge(rect)
      
      .attr("x", (d) => {
        let timestamp = new Date(d[0]);
        timestamp.setDate(firstDate);
        return xScalar(timestamp.getTime()) + offset
      })
      .attr("style", function(d, i) {
        let startTimestamp = new Date(d[0]);
        let endTimestamp = new Date(d[1]);
        let colorIndex = endTimestamp.getDate() - firstDate
        return `fill:${color(colorIndex)};opacity:0.5;`;
      })
      .attr("date", function(d, i) {
        return `${d[0]} to ${d[1]}`;
      })
      .attr('width', (d) => {
        let startTimestamp = new Date(d[0]);
        startTimestamp.setDate(firstDate);
        let endTimestamp = new Date(d[1]);
        endTimestamp.setDate(firstDate);
        return xScalar(endTimestamp.getTime()) - xScalar(startTimestamp.getTime());
      })
      .attr('height', rowHeight*0.6)
      .attr("y", rowHeight*0.2)

      topTicks.call(timeTicks, ticks, {offset, y: 10, zoom, chartHeight})
      bottomTicks.call(timeTicks, ticks, {offset, y: chartHeight+20, zoom, hideLines: true})
      if (zoomKick) return;
      setTimeout(() => {
        updateChart(event, 5)
        setTimeout(() => {
          updateChart(event, newZoom);
        },200)
      },200)

  }

  function transformIps(ips) {
    return _.reduce(_.orderBy(ips, ['targetEntityType'], ['desc']), (current, ip) => {
      let index = _.findIndex(current.entities, (entity) => {
        return entity[0] === ip.targetEntityType && entity[1] === ip.targetEntityId;
      })
      if (index === -1) {
        current.entities.push([ip.targetEntityType, ip.targetEntityId])
        index = _.size(current.entities)-1;
      }
      current.obs[index] = current.obs[index] || [];
      current.obs[index].push([ip.startTime.toISOString(), ip.endTime.toISOString()])
      if(current.timestamps[0]) {
        let earliestTimestamp = new Date(current.timestamps[0]);
        current.timestamps[0] = earliestTimestamp > ip.startTime ? ip.startTime.toISOString() : current.timestamps[0];
      } else {
        current.timestamps[0] = ip.startTime.toISOString();
      }
      if(current.timestamps[1]) {
        let latestTimestamp = new Date(current.timestamps[1]);
        current.timestamps[1] = latestTimestamp > ip.endTime ? ip.endTime.toISOString() : current.timestamps[1];
      } else {
        current.timestamps[1] = ip.endTime.toISOString();
      }
      return current;
    }, {entities: [], obs: [], timestamps: []})
  }


  vizElement.addEventListener('dataChanged',
    updateChart
  );


  return updateChart;


}

