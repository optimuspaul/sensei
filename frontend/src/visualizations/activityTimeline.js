
import * as d3 from "d3";


export default function activityTimeline(data) {



  let rowHeight = 40;
  let width = data.timestamps.length +  100;

  let chart = d3.select("#foundation #visualization")
                .attr("width", width)
                .attr("height", rowHeight * data.entities.length + 40);

  let row = chart.selectAll("g")
            .data(data.entities)
            .enter().append("g")
            .attr("transform", function(d, i) { return "translate(0," + i * rowHeight + ")"; });


  row.append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", rowHeight)
    .attr("y2", rowHeight);

  row.append("text")
      .attr("x", 0)
      .attr("y", rowHeight / 2)
      .attr("dy", ".35em")
      .text(function(entity) { return `${entity[0]}${entity[1]}`; });

  let observation = row.selectAll("circle")
                       .data((d, i) => { return data.obs[i]})
                       .enter().append("circle")

  observation.attr("cx", (d,i) => { return i + 100})
             .attr("cy", rowHeight / 2)
             .attr("r", (d,i) => { return (d[0] ? 1 : 0) + (d[1] ? 1 : 0) });



            // .text(function(entity) { return `${entity[0]}${entity[1]}`; });

}
