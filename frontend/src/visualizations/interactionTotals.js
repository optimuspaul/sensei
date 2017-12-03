import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {selectEntity} from './../actions/insightsActions';
import {startAndEndTimes, generateXScalar, calcChartHeight, segmentData, totalTimeTicks} from './utils';
import {entityRow, entityRowLabel, entityTypeSection, timeTicks} from './components';
import _ from 'lodash';

const rowHeight = 30; // how tall each row of data in timeline is
const chartWidth = 700; // how wide the width of the visualization is
const offset = 100; // how far to the right the totals should start being drawn from

export default function interactionTotals(data) {



  document.querySelector("div#interactionTotals svg").innerHTML = "<g id='top-ticks'></g><g id='bottom-ticks'></g>";
  let vizElement = document.querySelector("#visualization #interactionTotals");
  let chartElement = document.querySelector("#visualization");
  let chart = d3.select("#visualization div#interactionTotals svg")
  let topTicks = chart.select("g#top-ticks");
  let bottomTicks = chart.select("g#bottom-ticks");

  let updateChart = (event) => {
    data = event.detail
    if (!data) return;
    let zoom = _.get(store.getState(), "insights.ui.zoom") || 1;
    let chartWidth = 1260 * zoom; // how wide the width of the visualization is
    let segmentedData = segmentData(data);
    let maxTotal = d3.max(data.obs);
    let {startTime, endTime} = startAndEndTimes(data.timestamps);
    var xScalar = d3.scaleLinear().domain([0, maxTotal]).range([0, chartWidth-offset-100]);
    let ticks = totalTimeTicks(maxTotal, xScalar);
    let chartHeight = calcChartHeight(segmentedData);

    console.log("segmentedData", segmentedData)

    chart.attr("width", chartWidth)
      .attr("height", chartHeight + 20)
      .selectAll("g.segments")
      .data(segmentedData)
      .call(entityTypeSection, {className: 'segments'})

    let row = chart.selectAll("g.segments")
      .selectAll("g.row")
      .data((d) => {
        return d[1].entities;
      })
    row.call(entityRow, 'row')
    row.call(entityRowLabel)
    let rect = row.selectAll("rect")
      .data((d) => {
        console.log("rect d: ", d)
        return d ? [d] : [];
      })

    rect.transition()
      .attr('width', (d) => {
        return xScalar(d.obs);
      })
      .attr("x", offset + 15)
      .attr('height', rowHeight*0.6)
      .attr("y", rowHeight*0.3)

    rect.exit().remove()
    rect.enter().append("rect")
      .attr('width', (d) => {
        return xScalar(d.obs);
      })
      .attr("x", offset + 15)
      .attr('height', rowHeight*0.6)
      .attr("y", rowHeight*0.3)

    topTicks.call(timeTicks, ticks, {offset, y: 10, zoom})
    bottomTicks.call(timeTicks, ticks, {offset, y: chartHeight+20, zoom, hideLines: true})


  }

  vizElement.addEventListener('dataChanged',
    updateChart
  );
  updateChart({detail: data})

  return updateChart;

}
