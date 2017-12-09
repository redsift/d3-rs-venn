# d3-rs-venn

[![Circle CI](https://img.shields.io/circleci/project/redsift/d3-rs-venn.svg?style=flat-square)](https://circleci.com/gh/redsift/d3-rs-venn)
[![npm](https://img.shields.io/npm/v/@redsift/d3-rs-venn.svg?style=flat-square)](https://www.npmjs.com/package/@redsift/d3-rs-venn)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.githubusercontent.com/redsift/d3-rs-venn/master/LICENSE)

`d3-rs-venn` generate a venn via the D3 reusable chart convention. Code adapted from https://github.com/benfred/venn.js

## Example

[View @redsift/d3-rs-venn on Codepen](http://codepen.io/collection/DgkEpa/)

### Line chart

![Sample bars with a bottom orientation](https://bricks.redsift.cloud/reusable/d3-rs-venn.svg?_datum=[1,200,3100,1000]&orientation=bottom)

### Multiple series

![Sample bars with a left orientation](https://bricks.redsift.cloud/reusable/d3-rs-venn.svg?_datum=[[1,2,4],[0,1]])

## Usage

### Browser

    <script src="//static.redsift.io/reusable/d3-rs-venn/latest/d3-rs-venn.umd-es2015.min.js"></script>
    <script>
        var chart = d3_rs_venn.html();
        d3.select('body').datum([ 1, 2, 3, 10, 100 ]).call(chart);
    </script>

### ES6

    import { html as chart } from "@redsift/d3-rs-venn";
    let eml = chart();
    ...

### Require

    var chart = require("@redsift/d3-rs-venn");
    var eml = chart.html();
    ...
