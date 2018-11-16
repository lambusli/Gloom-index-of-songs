let brush = d3.brushX().extent([[0,0], [WIDTH, HEIGHT]]);

brush.on("brush", function(d){

    let extent = d3.event.selection;
    let x_extent = [extent[0], extent[1]].map(x_scale.invert);
    console.log(x_extent);

    // "grey" the deselected columns
    col.classed("deselected", function(d) {
        return (d.x0 < d3.min(x_extent) || d.x1 > d3.max(x_extent))
    });

    // end brush
    brush.on("end", function(){
        if (d3.event.selection == null){
            col.classed("deselected", false);
        }
    });

});

// take away previous brushes
brush.on("start", function(){
    if (d3.event.sourceEvent.type === "mousedown") {
        d3.selectAll('.brush').call(brush.move, null);
    }
});


// call brush
CHARTS[colName].append("g").classed('brush', true).call(brush);
