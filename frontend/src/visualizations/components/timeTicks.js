import * as d3 from "d3";
import _ from 'lodash';
import moment from 'moment';


const defaultOpts = {
  zoom: 1,
  id: 'bottom',
  offset: 205,
  chartHeight: 500,
  hideLines: false,
  y: 10,
  ticks: []
}

/*
  Adds the dashed time tick lines and their appropriate hour labels
  using the ticks data array created above and scaled using the linear
  scalar xScalar created above to ensure they stay within the SVG's width
 */
export default function timeTicks(selection, ticks, opts = {}) {
  opts = _.merge({}, defaultOpts, opts);

  let ticksContainer = selection.append("g")
    .attr("id", opts.id)
    .attr("class", "ticks")

  ticksContainer
    .selectAll(`text.y-${opts.y}`)
    .data(ticks)
    .enter().append(`text`)
    .attr('class', `y-${opts.y}`)
    .attr("x", (tick, index) => { debugger; return tick[1] + opts.offset })
    .attr("y", opts.y)
    .text((tick, index) => { return tick[0] })

  if (!opts.hideLines) return;

  ticksContainer
    .selectAll("line")
    .data(ticks)
    .enter().append("line")
    .attr("x1", (tick, index) => { return tick[1] + opts.offset + 15 })
    .attr("x2", (tick, index) => { return tick[1] + opts.offset + 15 })
    .attr("y1", 20)
    .attr("y2", opts.chartHeight-40)


}
