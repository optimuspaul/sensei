import * as d3 from "d3";
import _ from 'lodash';
import moment from 'moment';


let defaultOpts = {
  zoom: 1,
  selector: '#ticks',
  offset: 205,
  staticWidth: 1260,
  chartHeight: 500,
  dualLabel: true
}


export default function timeTicks(startTime, endTime, opts) {
  opts = _.merge(defaultOpts, opts);


  /*
    Creates array of pairs that determine where the vertical timeline ticks
    are drawn and which hour label should be placed at the bottom of them to
    be fed into d3
   */

  let tmpTime = new Date(startTime.getTime());
  let ticks = []
  while (tmpTime < endTime) {
    let label = moment(tmpTime).format('LT');
    ticks.push([label, tmpTime.getTime()])
    if (opts.zoom > 2) {
      tmpTime.setMinutes(tmpTime.getMinutes() + 15);
    } else {
      tmpTime.setHours(tmpTime.getHours() + 1);
    }
  }

  /*
    Creates a scalar on the x axis that constrains all values to the
    fixed width of the visualization, specified by the STATIC_WIDTH
    constant defined above
   */
  var xScalar = d3.scaleLinear()
    .domain([startTime.getTime(), endTime.getTime()])
    .range([0, opts.staticWidth-opts.offset]);


  /*
    Adds the dashed time tick lines and their appropriate hour labels
    using the ticks data array created above and scaled using the linear
    scalar xScalar created above to ensure they stay within the SVG's width
   */
  let ticksContainer = d3.select(opts.selector);

  ticksContainer.selectAll("line")
       .data(ticks)
       .enter().append("line")
       .attr("x1", (tick, index) => { return xScalar(tick[1]) + opts.offset + 15 })
       .attr("x2", (tick, index) => { return xScalar(tick[1]) + opts.offset + 15 })
       .attr("y1", 20)
       .attr("y2", opts.chartHeight);


  let textPlacements =  opts.dualLabel ? [10, opts.chartHeight+15] : [10];


  textPlacements.forEach((y) => {
    ticksContainer.selectAll(`text.y-${y}`)
         .data(ticks)
         .enter().append(`text`)
         .attr('class', `y-${y}`)
         .attr("x", (tick, index) => { return xScalar(tick[1]) + opts.offset })
         .attr("y", y)
         .text((tick, index) => { return tick[0] })
  });

  return ticksContainer;

}
