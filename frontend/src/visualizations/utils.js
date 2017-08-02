import * as d3 from "d3";



export const startAndEndTimes = (timestamps) => {
  let startTime = new Date(d3.min(timestamps));
  startTime.setMinutes(0);
  startTime.setSeconds(0);
  let endTime = new Date(d3.max(timestamps));
  endTime.setHours(endTime.getHours() + 2);
  endTime.setMinutes(0);
  endTime.setSeconds(0);
  return { startTime, endTime }
}



/*
  Creates a scalar on the x axis that constrains all values to the
  fixed width of the visualization, specified by the STATIC_WIDTH
  constant defined above
 */
export const generateXScalar = (startTime, endTime, upperRange) => {

  var xScalar = d3.scaleLinear()
    .domain([startTime.getTime(), endTime.getTime()])
    .range([0, STATIC_WIDTH-OFFSET]);
}


/*
  Determines the height of the chart based on the number of entities included
  with the observational data and the predetermined ROW_HEIGHT constant defined
  above, with an extra ROW_HEIGHT's worth of space added to the bottom to make
  space for the time tick labels
 */
export const calcChartHeight = (segmentedData) => {
  let totalRows = _.sumBy(_.toArray(segmentedData), (entityType) => {
    return _.size(entityType.entities) + 1
  });
  let chartHeight = (ROW_HEIGHT * totalRows);
}
