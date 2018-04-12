import * as d3 from "d3";
import _ from 'lodash';

const defaultOpts = {
  rowHeight: 30,
  className: 'sections',
  labels: true
}

export default function entityTypeSection(selection, opts = {}) {
  opts = _.merge({}, defaultOpts, opts);

  selection.exit().remove();

  // selects group tag that corresponds to the current entity type
  selection
    .attr("id", (d) => {
      return d[0];
    })
    // sets the y displacement for the current entity type group
    .attr("transform", (d) => {
      return `translate(0,${d[1].y * opts.rowHeight})`
    })

  selection
    .enter()
    .append("g")
    .attr("class", opts.className)
    .merge(selection)

  if (!opts.labels) return;

  let text = selection.selectAll('text')
    .data((d, x, y) => {
      return [d[0]];
    })
  text.enter()
    .append("text")
     .attr("x", 0)
     .attr("y", 0)
     .attr("style", `font-weight: bold; opacity: ${opts.hideLabels ? 0 : 1}`)
     .text((d) => {
        return d;
      });

}

