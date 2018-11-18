// choose the initial radio button: Duration
document.chosenColor.a[0].checked = true;

colorDict = {
    "duration_ms": {
        "dotchart": "#2794E8",
        "barchart": "rgb(255, 151, 125)"
    },
    "word_count":{
        "dotchart": "#3A7D44",
        "barchart": "#e36b66"
    },
    "lyrical_density":{
        "dotchart": "#bab020",
        "barchart": "#d62237"
    }
}

const URL = "http://www.cs.middlebury.edu/~candrews/classes/cs465-f18/data/gloom_index.csv";
const SVG = d3.select('#vis');

// size of the histograms (dot chart)
const WIDTH = 400;
const HEIGHT = 400;

// size of the bar chart
const WIDTH2 = 400;
const HEIGHT2 = 400;

const margin = {
  top: 10,
  right: 30,
  left: 40,
  bottom: 20
}

SVG.attr("width", 1500)
  .attr("height", 1500);

// All charts on the page: gloom_index, valence, pct_sad, and bar chart for avg gloom index
const cht_gloom  = SVG.append("g").attr("id", "gloom_index").attr("transform", `translate(${margin.left}, ${margin.top})`);
const cht_val = SVG.append("g").attr("id", "valence").attr("transform", `translate(${WIDTH + 2 * margin.left}, ${margin.top})`);
const cht_pctsad = SVG.append("g").attr("id", "pct_sad").attr("transform", `translate(${2 * WIDTH + 3 * margin.left}, ${margin.top})`);
const barChart = SVG.append("g").attr("id", "avg_gloom").attr("transform", `translate(${margin.left}, ${5 * margin.top + HEIGHT})`);

// enables to dynamically call a chart (see function updateChart())
const CHARTS = {
    "gloom_index": cht_gloom,
    "valence": cht_val,
    "pct_sad": cht_pctsad
}

// Equivalent to dataframe$colName in R
const getCol = function(array, title){ // array = [{}, {}, {},...]
    let ans = [];
    array.forEach(function(d, i){
        ans.push(d[title])
    });
    return ans;
}

d3.csv(URL).then(function(data){

    // nesting by album name later used for arrays albumList and chosenAlbums
    const nested = d3.nest()
        .key((d) => d["album_name"])
        .map(data);

    var albumList = [];  // contains all the album names (already sorted)
    var chosenAlbums = []; // user-selected albums registered by clicks

    // from the nested list by album, get each album name and caluclate its average gloom index (avg)
    nested.each(function(val, key) {
        // The color options should be duration, album, word count, and lyrical density.
        let avg = 0, avgDur = 0, avgWC = 0, avgDen = 0;

        for (let i = 0; i < val.length; i++){
            avg += +val[i]["gloom_index"];
            avgDur += +val[i]["duration_ms"];
            avgWC += +val[i]["word_count"];
            avgDen += +val[i]["lyrical_density"];
        }
        avg /= val.length;
        avgDur /= val.length;
        console.log(avgDur);
        avgWC /= val.length;
        avgDen /= val.length;
        albumList.push({
            "album": key,
            "avg": avg,
            "avg_duration_ms": avgDur,
            "avg_word_count": avgWC,
            "avg_lyrical_density": avgDen,
            "rlsDate": val[0]["album_release_year"]
        });
    });

    const album_color_scale = d3.scaleOrdinal(d3.schemeCategory10)
        // cheat method to make the bar and circle colors align
        .domain(getCol(albumList, "album").concat(['LOL']));

    var cce = "duration_ms"; // cce = "chosen color encoding" (see radio button on web page)

    /*-----------------
    * update the desired histogram chosen through CHARTS
    * visualize filtered data (dataset)
    -----------------*/
    function updateChart(colName, dataset) {
        CHARTS[colName].html("");

        // draw x and y scales according to fixed global data
        let x_scale = d3.scaleLinear()
          .domain([d3.min(data, (d) => +d[colName]), d3.max(data, (d) => +d[colName])])
          .range([0, WIDTH]);

        let y_scale = d3.scaleLinear()
          .range([HEIGHT, 0]);

        // colors the circles in histogram dynamically depending on the user's choice of color encoding (see radio button)
        let color_scale = null;

        // if the varNAme is quantitative
        if (cce != "album_name"){
            color_scale = d3.scaleLinear()
                      .range(['lightgray', colorDict[cce]["dotchart"]])
                      .domain([0, d3.max(data, (d) => +d[cce])]);
        }
        // else if nominal (album)
        else {
            color_scale = album_color_scale;
        }



        // Configure histogram parameters.
        let histogram = d3.histogram()
          .value((d) => +d[colName])
          .domain(x_scale.domain())
          .thresholds(x_scale.ticks(30));

        // Create the data structure needed for histogram
        // [[], [], [], ..., [], x0:, x1:]
        let bins = histogram(dataset);

        // sorting each bin by CCE (chosen color encoding)
        bins.forEach(function(bin, i){
            bin.sort(function(a, b){
                let keyA = +a[cce];
                let keyB = +b[cce];
                if (keyA < keyB) return -1;
                if (keyA > keyB) return 1;
                return 0;
            });
        });

        // d.length is the height of each bar in the histogram
        y_scale.domain([0, d3.max(bins, (d)=> d.length)]);

        // Each bin / column in histogram is a separate <g>
        // Each column <g> is binded to each element in bins
        // col --> bins: [[{}, {}], [{}, {}], ...]
        // <g> --> [{}, {}, {}, ...]
        let col = CHARTS[colName].selectAll(".col_" + colName) // column of circles
            .data(bins)

        col.exit().remove();

        // append each g to the right position within the histogram
        let newCol = col.enter()
            .append("g")
            .classed("col", true)
            .classed(".col_" + colName, true)
            .attr("transform", (d) => `translate(${x_scale(d.x0)}, 0)`);

        col = col.merge(newCol);

        // we append circles in each of the columns <g>
        let circles = col.selectAll("circle")
            .data((d) => d)

        circles.exit().remove();

        let newCircles = circles.enter()
            .append("circle")
            .attr("cx", WIDTH / bins.length / 2)
            .attr("cy", (d, i) => y_scale(i + 1) + WIDTH / bins.length / 5)
            .attr("r", 5) // WIDTH / bins.length / 6
            .attr("fill", function(d, i){
                // console.log(d[cce] + color_scale(d[cce]));
                return color_scale(d[cce]);
            });

        circles = circles.merge(newCircles);

        // appending the axes
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
        ** brushes
        */

        // horizontal brush
        let brush = d3.brushX().extent([[0,0], [WIDTH, HEIGHT]]);

        // highlight the selected circles
        brush.on("brush", function(d){
            let extent = d3.event.selection;

            // Unclear purpose but worked?: prevent null extent from entering code (due to single selection)
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
            }
        });

        // call brush
        let brush_g = CHARTS[colName].append("g").classed('brush', true).call(brush);

        // What trick is this?
        brush_g.selectAll(".overlay")
            .on("mousemove", function(d){
                const parent = this.parentElement;
                console.log(d3.event);
                const coordinates = [d3.event.pageX, d3.event.pageY];

                // remove the overlay
                parent.removeChild(this);
                // look at which element is under the overlay at this point
                const next_layer = document.elementFromPoint(coordinates[0], coordinates[1]);
                console.log(next_layer);
                // put the overlay back
                parent.appendChild(this);

                // if the next layer down is a circle, show the tooltip
                if (next_layer.tagName === "circle"){
                    const point = d3.select(next_layer);
                    const data = point.data()[0];
                    const info = d3.select("#tooltip");

                    info.style("left", (coordinates[0] + 5 )+ "px")
                        .style("top", (coordinates[1] + 5 )+ "px")
                        .classed("hidden", false);

                    info.select("#songname").text(data["track_name"]);
                    info.select("#album").text(data["album_name"]);

                }else{
                    // not over a circle, hide the tooltip
                    d3.select("#tooltip")
                        .classed("hidden", true);
                }
            });

    }

    /*-------------
    * append the bar chart
    -------------*/
    function updateBarChart() {
        barChart.html("");

        // draw scales
        let x_scale = d3.scaleLinear()
            .rangeRound([0, WIDTH2])
            .domain([0, d3.max(albumList, (d)=>+d['avg'])]);

        let y_scale = d3.scaleBand()
            .range([0, HEIGHT2])
            .domain(getCol(albumList, 'album'))
            .padding(0.1);

        // color scale for bars
        let color_scale = null;

        if (cce != 'album_name'){
            color_scale = d3.scaleLinear()
                .range(["lightgray", colorDict[cce]["barchart"]])
                .domain([0, d3.max(albumList, (d) => +d['avg_' + cce])]);
        }
        else {
            color_scale = album_color_scale;
        }


        // append <g> for bars and labels
        let bars = barChart.append("g");
        let labels = barChart.append("g");

        // x-axis for bar chart
        let x_axis = barChart.append("g")
            .attr("transform", `translate(0, ${HEIGHT2})`)
            .call(d3.axisBottom(x_scale));

        // x-axis label
        barChart.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${WIDTH2/2}, ${HEIGHT2 + margin.top + 15})`)
            .style("font-size", "10px")
            .style("color", "black")
            .attr("font-family", "sans-serif")
            .text("Gloom Index");

        // appending bars for bar chart
        let rects = bars.selectAll("rect")
            .data(albumList)

        rects.exit().remove();

        let newRects = rects.enter()
            .append("rect")
            .classed("unchosenAlbum", true)
            .attr("x", 0)
            .attr("y",(d)=> y_scale(d['album']))
            .attr("width", (d)=> +x_scale(d['avg']))
            .attr("height", y_scale.bandwidth())


        rects = rects.merge(newRects);

        if (cce != 'album_name') {
            rects.attr("fill", (d) => color_scale(d['avg_' + cce]));
        }
        else {
            rects.attr("opacity", 0.1)
                .attr("fill", (d) => color_scale(d['avg']));
        }

        // append album names on each bar
        let abLabels = labels.selectAll(".labels")
            .data(albumList)

        abLabels.exit().remove();

        let newAbLabels = abLabels.enter()
            .append("text")
            .classed("labels", true)
            .text((d) => d['album'])
            .style("color", "black")
            .attr("text-anchor", "left")
            .style("font-size", "15px")
            .attr("font-family", "sans-serif")
            .attr("x", 3)
            .attr("y", function(d){return y_scale(d['album']) + y_scale.bandwidth()/2 + 3; });

        abLabels = abLabels.merge(newAbLabels);

        // append the average gloom index at the end of each bar
        let counts = labels.selectAll(".gloomavgs")
            .data(albumList);

        counts.exit().remove();

        let newCounts = counts.enter()
            .append("text")
            .classed("gloomavgs", true)
            .text((d) => d['avg'].toFixed(2))
            .style("color", "black")
            .attr("text-anchor", "left")
            .style("font-size", "15px")
            .attr("font-family", "sans-serif")
            .attr("x", (d)=> x_scale(d['avg']) + 7)
            .attr("y", (d) => y_scale(d['album']) + y_scale.bandwidth() / 2 + 3);

        counts = counts.merge(newCounts);

        /*--------------------
        * Event listeners: Select albums and update list
        --------------------*/
        barChart.selectAll("rect").on('click', function(d) {
            let thisNode = d3.select(this);

            // if this album is not chosen, select
            if (thisNode.classed("unchosenAlbum")){
                thisNode.classed("unchosenAlbum", false);
                thisNode.classed("chosenAlbum", true);
                chosenAlbums.push(d);
            }
            // else if album is chosen, deselect
            else {
                thisNode.classed("chosenAlbum", false);
                thisNode.classed("unchosenAlbum", true);
                chosenAlbums = chosenAlbums.filter((v, i, arr) => v["album"] != d["album"] ); // !!!!!
            }

            // update vis
            updateSmallVis();
        });

    }

    /*-------------
    * update all the histograms
    --------------*/
    function updateSmallVis() {

        // if nothing is chosen in bar chart
        if (chosenAlbums.length == 0) {
            updateChart("gloom_index", data);
            updateChart("valence", data);
            updateChart("pct_sad", data);
        }

        // else if something is chosen
        else {
            let newData = [];

            for (let i = 0; i < chosenAlbums.length; i++) {
                newData = newData.concat(nested.get(chosenAlbums[i]["album"]));
            }

            updateChart("gloom_index", newData);
            updateChart("valence", newData);
            updateChart("pct_sad", newData);
        }
    }

    /*-------------
    * Executable: append all charts initially
    --------------*/
    updateBarChart();
    updateSmallVis();




    // event handler for radio button
    d3.select("#colorMenu").selectAll(".radio").on("change", function(d){
        cce = d3.select(this).property("value");
        chosenAlbums = [];
        updateSmallVis();
        updateBarChart();
    });

});
