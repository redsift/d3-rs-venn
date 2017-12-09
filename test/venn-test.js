var tape = require("@redsift/tape-reel")("<div id='test'></div>"),
    d3 = require("d3-selection"),
    venn = require("../");

// This test should be on all brick compatable charts
tape("html() empty state", function(t) {
    var host = venn.html();
    var el = d3.select('#test');
    el.call(host);
    
    t.equal(el.selectAll('svg').size(), 1);
    
    // should have an X and Y major and minor axis
    t.equal(el.selectAll('g.chart-venn').size(), 1);
        
    t.end();
});

tape("html() no overlaps 1", function(t) {
    var host = venn.html('no-overlap-1');
    var el = d3.select('#test');
    el.datum([  {sets: ['A'], size: 14},
                {sets: ['B'], size: 6}
            ]);
    el.call(host);
    
    t.equal(el.selectAll('svg').size(), 1);
    
    // should have an X and Y major and minor axis
    t.equal(el.selectAll('g.venn-area').size(), 2);
    t.equal(el.selectAll('g.venn-circle').size(), 2);
    t.equal(el.selectAll('path').size(), 2);

    t.end();
});

tape("html() overlap", function(t) {
    var host = venn.html('overlap-1');
    var el = d3.select('#test');
    el.datum([  {sets: ['A'], size: 14},
                {sets: ['B'], size: 6},
                {sets: ['A','B'], size: 3}
            ]);
    el.call(host);
    
    t.equal(el.selectAll('svg').size(), 1);
    
    // should have an X and Y major and minor axis
    t.equal(el.selectAll('g.venn-area').size(), 3);
    t.equal(el.selectAll('g.venn-circle').size(), 2);
    t.equal(el.selectAll('g.venn-intersection').size(), 1);
    t.equal(el.selectAll('path').size(), 3);

    t.end();
});