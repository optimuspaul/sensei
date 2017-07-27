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
