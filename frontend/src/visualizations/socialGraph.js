import d3Force from "d3-force";
import _ from 'lodash';
import * as d3 from "d3";
import store from './../store/configureStore';
import {entityInflections} from './../constants';

export default function socialGraph() {


  let state = store.getState();
  let storeEntities = state.entities;
  
  let canvasWidth = 1000;
  let canvasHeight = 800;
  let currentEntityId = _.get(state, 'insights.ui.currentEntityId');
  let currentEntityType = _.get(state, 'insights.ui.currentEntityType');
  document.querySelector("#visualization div#socialGraph").innerHTML = `<svg id="social-graph" height=${canvasHeight} width=${canvasWidth}><g id="container"><g class="links"></g></g></svg>`;
  let vizElement = document.querySelector("#visualization #socialGraph");


  let updateChart = (event) => {

    let data = event.detail
    if (!data) return;

    // let zoom = parseInt(_.get(store.getState(), "insights.ui.zoom")) || 1;
    let zoom = 2;

    let scalar = d3.scaleLinear()
      .domain([d3.min(data.obs)-d3.deviation(data.obs), d3.max(data.obs)+d3.deviation(data.obs)])
      .range([0, 20]).clamp(true);
    let scaleTwenty = d3.scaleLinear().domain([0, 20])
    let scaleZoom = d3.scaleLinear().domain([1,5])
    let zoomLevel = scaleZoom.range([2,5])(zoom);

    let graphData = _.reduce(data.entities, (current, val, index) => {
      let force = parseInt(scalar(data.obs[index]), 10);
      let entity = storeEntities.children[val[1]];
      let entityName = entity ? entity.displayName : `${val[0]}-${val[1]}`;
      let node = {id: `${val[0]}-${val[1]}`, group: 1, label: entityName};
      if (!_.find(current.nodes, node)) {
        current.nodes.push(node);
      }
      if (force > 0 && !_.find(current.links, {source: `${val[2]}-${val[3]}` , target: `${val[0]}-${val[1]}`, value: force})) {
        current.links.push({source: `${val[0]}-${val[1]}`, target: `${val[2]}-${val[3]}`, value: force});
      }
      return current;
     }, {nodes:[], links: []})


    let refresh = () => {



      var svg = d3.select("#visualization div#socialGraph svg g#container")
      svg.attr("transform", `scale(${zoomLevel})`);

      var color = d3.scaleOrdinal(d3.schemeCategory20);

      var mb = d3.forceManyBody();

      mb.strength((d) => {
        return d3.scaleLinear().domain([0, 20]).range([-300,0])(d.value)
      });

      var simulation = d3.forceSimulation()
          .force("link", d3.forceLink().distance(calcDistance).strength(calcStrength).id(d => d.id ))
          .force("charge", mb)
          .force("center", d3.forceCenter(canvasWidth / (2*zoomLevel), canvasHeight / (2*zoomLevel)));

      var link = svg.select('g.links')
        .selectAll("line")
        .data(graphData.links)
        .enter().append("line")
        // .merge(link)
        .attr("style", function(d) {
          return `stroke-width: ${scaleTwenty.range([scaleZoom.range([1,0.01])(zoom), scaleZoom.range([3,2])(zoom)])(d.value)};
                  stroke: rgba(${d3.scaleQuantize().domain([0, 20]).range([130,255])(d.value)},0,${d3.scaleQuantize().domain([0, 20]).range([130,0])(d.value)},${scaleTwenty.range([-0.1,1])(d.value)})`;
        });

      var node = svg.selectAll(".node")
        .data(graphData.nodes.filter(function(d) { return d.id; }))
        .enter().append("circle")
          // .merge(node)
          .attr("class", "node")
          .attr("r", scaleZoom.range([2,1])(zoom))
          .attr("fill", function(d) { return color(d.group); })
          .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));


      var label = svg.selectAll("text")
          .data(graphData.nodes)
          .enter().append("text")
          // .merge(label)
          .attr("class", "label")
          .text(node => node.label)
          .attr('style', `font-size: 5px`)
          .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));

      simulation
          .nodes(graphData.nodes)
          .on("tick", ticked);

      simulation.force("link")
          .links(graphData.links);

      function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        label
            .attr("x", function(d) { return d.x + 3; })
            .attr("y", function(d) { return d.y + 3; });
      }

      function calcStrength(d) {
        return d3.scaleLinear().domain([0, 20]).range([0.5,1])(d.value);
      }

      function calcDistance(d) {
        return d3.scaleLinear().domain([0, 20]).range([scaleZoom.range([200,50])(zoom), 0])(d.value);
      }

      function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }

      function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    }

    setTimeout(refresh, 1000);

  }

  vizElement.addEventListener('dataChanged',
    updateChart
  );

  return updateChart;


}
