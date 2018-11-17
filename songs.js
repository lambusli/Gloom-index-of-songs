const URL = "http://www.cs.middlebury.edu/~candrews/classes/cs465-f18/data/gloom_index.csv";
const SVG = d3.select('#vis');

const WIDTH = 200;
const HEIGHT = 200;
const WIDTH2 = 400;
const HEIGHT2 = 400;

const margin = {
  top: 10,
  right: 30,
  left: 40,
  bottom: 20
}

SVG.attr("width", 1000)
  .attr("height", 1000);

// gloom_index, valence, and pct_sad
const cht_gloom  = SVG.append("g").attr("id", "gloom_index").attr("transform", `translate(${margin.left}, ${margin.top})`);
const cht_val = SVG.append("g").attr("id", "valence").attr("transform", `translate(${WIDTH + 2 * margin.left}, ${margin.top})`);
const cht_pctsad = SVG.append("g").attr("id", "pct_sad").attr("transform", `translate(${2 * WIDTH + 3 * margin.left}, ${margin.top})`);
const barChart = SVG.append("g").attr("id", "avg_gloom").attr("transform", `translate(${margin.left}, ${5 * margin.top + HEIGHT})`)

const CHARTS = {
    "gloom_index": cht_gloom,
    "valence": cht_val,
    "pct_sad": cht_pctsad
}

const getCol = function(array, title){ // array = [{}, {}, {},...]
    let ans = [];
    array.forEach(function(d, i){
        ans.push(d[title])
    });
    return ans;
}

d3.csv(URL).then(function(data){


    console.log(data);



    function appendChart(colName) {

        const x_scale = d3.scaleLinear()
          .domain([d3.min(data, (d) => d[colName]), d3.max(data, (d) => d[colName])])
          .range([0, WIDTH]);

        const y_scale = d3.scaleLinear()
          .range([HEIGHT, 0]);

        const color_scale = d3.scaleLinear()
          .range(['#91C4F2', '#020303'])
          .domain([d3.min(data, (d) => d[colName]), d3.max(data, (d) => d[colName])]);

        var histogram = d3.histogram()
          .value((d) => d[colName])
          .domain(x_scale.domain())
          .thresholds(x_scale.ticks(10));

        var bins = histogram(data);
        console.log(bins);

        y_scale.domain([0, d3.max(bins, (d)=> d.length)]);

        var col = CHARTS[colName].selectAll(".col_" + colName) // column of circles
          .data(bins)
          .enter()
          .append("g")
          .classed("col", true)
          .classed(".col_" + colName, true)
          .attr("transform", (d) => `translate(${x_scale(d.x0)}, 0)`);

        var circles = col.selectAll("circle")
          .data((d) => d)
          .enter()
          .append("circle")
          .attr("cx", WIDTH / bins.length / 2)
          .attr("cy", (d, i) => y_scale(i + 1) + WIDTH / bins.length / 5)
          .attr("r", 5) // WIDTH / bins.length / 6
          .attr("fill", (d, i) => color_scale(d[colName]));

        CHARTS[colName].append("g")
              .attr("transform", `translate(0, ${HEIGHT})`)
              .call(d3.axisBottom(x_scale));


        CHARTS[colName].append("g")
            .call(d3.axisLeft(y_scale));

        CHARTS[colName].append("text")
              .attr("text-anchor", "middle")
              .attr("transform", `translate(${WIDTH/2}, ${HEIGHT+margin.bottom + (WIDTH / bins.length / 5)})`)
              .style("font-size", "10px")
              .attr("font-family", "sans-serif")
              .text(colName);

        CHARTS[colName].append("text")
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .attr("font-family", "sans-serif")
            .attr("transform", `translate(${-(3*margin.left/4)}, ${HEIGHT/2})rotate(-90)`)
            .text("Count");

        /*
        * brushes
        */
        let brush = d3.brushX().extent([[0,0], [WIDTH, HEIGHT]]);


        brush.on("brush", function(d){
            let extent = d3.event.selection;
            if (extent != null){
                let x_extent = [extent[0], extent[1]].map(x_scale.invert);

                // "grey" the deselected columns
                col.classed("deselected", function(d) {
                    return (d.x0 < d3.min(x_extent) || d.x1 > d3.max(x_extent))
                });
            }
        });

        // end brush
        brush.on("end", function(){
            if (d3.event.selection == null){
                col.classed("deselected", false);
            }
        });


        // take away previous brushes
        brush.on("start", function(){
            if (d3.event.sourceEvent.type === "mousedown") {
                d3.selectAll('.col').classed('deselected', false); 
                d3.selectAll('.brush').call(brush.move, null);
                console.log("restart");
            }
        });

        // call brush
        CHARTS[colName].append("g").classed('brush', true).call(brush);
    }

    function appendBarChart() {
        res = [];

        let nested = d3.nest()
            .key((d) => d["album_name"])
            .map(data);

        nested.each(function(val, key) {
            let avg = 0;

            for (let i = 0; i < val.length; i++){
                avg += +val[i]["gloom_index"];
            }
            avg /= val.length;
            res.push({"album": key, "avg": avg})
        });

        const x_scale = d3.scaleLinear()
            .rangeRound([0, WIDTH2])
            .domain([0, d3.max(res, (d)=>+d['avg'])]);

        const y_scale = d3.scaleBand()
            .range([0, HEIGHT2])
            .domain(getCol(res, 'album'))
            .padding(0.1);

        barChart.selectAll("rect")
          .data(res)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y",(d)=> y_scale(d['album']))
          .attr("width", (d)=> +x_scale(d['avg']))
          .attr("height", y_scale.bandwidth());
    }

    appendChart("gloom_index");
    appendChart("valence");
    appendChart("pct_sad");
    appendBarChart();






});
