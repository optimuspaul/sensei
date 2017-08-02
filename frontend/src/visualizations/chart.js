import * as d3 from "d3";
import _ from 'lodash';

const VISUALIZATION_TEMPLATE = `
  <svg>
    <g id='ticks'></g>
    <g id='children' class='segments'></g>
    <g id='areas' class='segments'></g>
    <g id='materials' class='segments'></g>
    <g id='teachers' class='segments'></g>
  </svg>
`


/*
  Initializes the chart with d3 using the STATIC_WIDTH constant defined above
  and the calculated chartHeight from above
 */

export default function chart(width, height, opts) {

 /*
    Initializes the template into the DOM
   */
  document.querySelector("#visualization").innerHTML = VISUALIZATION_TEMPLATE;

  /*
    Initializes the chart with d3 using provided width and height
   */
  let chart = d3.select("#visualization svg")
                  .attr("width", width)
                  .attr("height", height);

  return chart

}
