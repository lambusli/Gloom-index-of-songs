const URL = "http://www.cs.middlebury.edu/~candrews/classes/cs465-f18/data/gloom_index.csv";
const SVG = d3.select('#vis');

const WIDTH = 500;
const HEIGHT = 500;

const margin = {
  top: 10,
  right: 30,
  left: 20,
  bottom: 20
}

SVG.attr("width", WIDTH + margin.left + margin.right)
  .attr("height", HEIGHT + margin.top + margin.bottom);

// gloom_index, valence, and pct_sad
const cht_gloom  = SVG.append("g").attr("id", "gloom_index");
const cht_val = SVG.append("g").attr("id", "valence");
const cht_pctsad = SVG.append("g").attr("id", "pct_sad");

cht_gloom.attr("transfrom", `translate(${margin.left}, ${margin.top})`);

d3.csv(URL).then(function(data){
    console.log(data);
    const x_scale = d3.scaleLinear()
      .domain([d3.min(data, (d) => d["gloom_index"]), d3.max(data, (d) => d["gloom_index"])])
      .range([0, WIDTH]);

    const y_scale = d3.scaleLinear()
      .range([HEIGHT, 0]);

    var histogram = d3.histogram()
      .value((d) => d["gloom_index"])
      .domain(x_scale.domain())
      //.thresholds(x_scale.ticks(20));

    var bins = histogram(data);
    console.log(bins);

    y_scale.domain([0, d3.max(bins, (d)=> d.length)]);

    col_gloom = cht_gloom.selectAll(".col_gloom") // column of circles
      .data(bins)
      .enter()
      .append("g")
      .classed("col_gloom", true)
      .attr("transform", (d) => `translate(${x_scale(d.x0)}, 0)`);

    col_gloom.selectAll("circle")
      .data((d) => d)
      .enter()
      .append("circle")
      .attr("cx", WIDTH / bins.length / 2)
      .attr("cy", (d, i) => y_scale(i + 1) + WIDTH / bins.length / 5)
      .attr("r", WIDTH / bins.length / 5)




    /*
    cht_gloom.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x_scale(d.x0))
      .attr("y", (d) => y_scale(d.length))
      .attr("height", (d) => HEIGHT - y_scale(d.length))
      .attr("width", WIDTH / bins.length)
      .style("fill", "black")
      .style("padding", 0);

    cht_gloom.selectAll("text")
      .data(bins)
      .enter()
      .append("text")
      .attr("x", (d, i) => i * 10)
      .attr("y", 550)
      .text((d) => d.length)*/
});
