
import { select } from 'd3-selection';

import { html as svg } from '@redsift/d3-rs-svg';
import { 
  presentation10,
  brand,
  display,
  dashes,
  fonts,
  widths
} from '@redsift/d3-rs-theme';


import { venn, normalizeSolution, scaleSolution } from './layout';
import { intersectionArea, distance, getCenter } from './circleintersection';
import { nelderMead } from '../node_modules/fmin/index.js';

const DEFAULT_SIZE = 400;
const DEFAULT_ASPECT = 0.5;
const DEFAULT_MARGIN = 8;

export function circlePath(x, y, r) {
  var ret = [];
  ret.push("\nM", x, y);
  ret.push("\nm", -r, 0);
  ret.push("\na", r, r, 0, 1, 0, r *2, 0);
  ret.push("\na", r, r, 0, 1, 0,-r *2, 0);
  return ret.join(" ");
}

// inverse of the circlePath function, returns a circle object from an svg path
export function circleFromPath(path) {
  var tokens = path.split(' ');
  return {'x' : parseFloat(tokens[1]),
          'y' : parseFloat(tokens[2]),
          'radius' : -parseFloat(tokens[4])
          };
}

/** returns a svg path of the intersection area of a bunch of circles */
export function intersectionAreaPath(circles) {
  var stats = {};
  intersectionArea(circles, stats);
  var arcs = stats.arcs;

  if (arcs.length === 0) {
      return "M 0 0";

  } else if (arcs.length == 1) {
      var circle = arcs[0].circle;
      return circlePath(circle.x, circle.y, circle.radius);

  } else {
      // draw path around arcs
      var ret = ["\nM", arcs[0].p2.x, arcs[0].p2.y];
      for (var i = 0; i < arcs.length; ++i) {
          var arc = arcs[i], r = arc.circle.radius, wide = arc.width > r;
          ret.push("\nA", r, r, 0, wide ? 1 : 0, 1,
                   arc.p1.x, arc.p1.y);
      }
      return ret.join(" ");
  }
}

export default function chart(id) {
  let classed = 'chart-venn', 
      background = undefined,
      width = DEFAULT_SIZE,
      theme = 'light',
      height = null,
      margin = DEFAULT_MARGIN,
      style = undefined,
      scale = 1.0,
      orientation = Math.PI / 2,
      normalize = false,
      orientationOrder = null,      
      layoutFunction = venn,
      fill = null;


  function _makeFillFn() {
    let colors = () => fill;
    if (fill == null) {
      let c = presentation10.standard;
      colors = (d, i) => (c[i % c.length]);
    } else if (typeof fill === 'function') {
      colors = fill;
    } else if (Array.isArray(fill)) {
      colors = (d, i) => fill[ i % fill.length ];
    }
    return colors;  
  } 
  function _impl(context) {
    let selection = context.selection ? context.selection() : context,
        transition = (context.selection !== undefined);
  
    let _background = background;
    if (_background === undefined) {
      _background = display[theme].background;
    }

    let _fill = _makeFillFn();
    
    selection.each(function() {
      let node = select(this);  

      let data = node.datum() || {};

      let sh = height || Math.round(width * DEFAULT_ASPECT);
      
      
      // SVG element
      let sid = null;
      if (id) sid = 'svg-' + id;

      let root = svg(sid)
                  .width(width).height(sh).margin(margin).scale(scale)
                  .background(_background);
      let tnode = node;
      if (transition === true) {
        tnode = node.transition(context);
      }
    
      let w = root.childWidth(),
          h = root.childHeight();        
      let _style = style;
      if (_style === undefined) {
        // build a style sheet from the embedded charts
        _style = [ _impl ].filter(c => c != null).reduce((p, c) => p + c.defaultStyle(theme, w), '');
      }    

      root.style(_style);
      tnode.call(root);

      let snode = node.select(root.self());
      let elmS = snode.select(root.child());

      let g = elmS.select(_impl.self())
      if (g.empty()) {
        g = elmS.append('g').attr('class', classed).attr('id', id);
      }
      
      // start chart
      let previous = {}, 
          hasPrevious = false;
      
      g.selectAll('.venn-area path').each(function (d) {
          let path = select(this).attr('d');
          if (d.sets.length == 1 && path) {
              hasPrevious = true;
              previous[d.sets[0]] = circleFromPath(path);
          }
      });
// interpolate intersection area paths between previous and
        // current paths
      const pathTween = (d) => {
          return (t) => {
              const c = d.sets.map(function(set) {
                  let start = previous[set], 
                      end = circles[set];
                  if (!start) {
                      start = {x : width/2, y : height/2, radius : 1};
                  }
                  if (!end) {
                      end = {x : width/2, y : height/2, radius : 1};
                  }
                  return {'x' : start.x * (1 - t) + end.x * t,
                          'y' : start.y * (1 - t) + end.y * t,
                          'radius' : start.radius * (1 - t) + end.radius * t};
              });
              return intersectionAreaPath(c);
          };
      };

      let solution = layoutFunction(data);
      if (normalize) {
          solution = normalizeSolution(solution, orientation, orientationOrder); 
      }
      let circles = scaleSolution(solution, w, h, 0.0);
      let nodes = g.selectAll('g.venn-area').data(data, (d) => d.sets);

      let enter = nodes.enter()
              .append('g')
              .attr('class', (d) => 'venn-area venn-' + (d.sets.length == 1 ? 'circle' : 'intersection'));
      enter.append('path');
      let update = enter.merge(nodes);

      let pathUpdate = update.select('path');
      if (transition === true && hasPrevious) {
        pathUpdate = pathUpdate.transition(context);
        pathUpdate.attrTween('d', pathTween);
      } else {
        pathUpdate.attr('d', (d) => intersectionAreaPath(d.sets.map((set) => circles[set])))
      }

      pathUpdate.attr('fill', _fill);

      let exit = nodes.exit();
      if (transition === true) {
        exit = exit.transition(context);
        exit.selectAll('path')
        .attrTween('d', pathTween)
        .remove();
      }

      exit.remove();
    });
    
  }
  
  _impl.self = function() { return 'g' + (id ?  '#' + id : '.' + classed); }

  _impl.id = function() {
    return id;
  };

  _impl.defaultStyle = (_theme, _width) => `
                  ${_impl.self()} { 
                    shape-rendering: geometricprecision;
                  }
                `;
  
  _impl.classed = function(value) {
    return arguments.length ? (classed = value, _impl) : classed;
  };
    
  _impl.background = function(value) {
    return arguments.length ? (background = value, _impl) : background;
  };

  _impl.theme = function(value) {
    return arguments.length ? (theme = value, _impl) : theme;
  };  

  _impl.size = function(value) {
    return arguments.length ? (width = value, height = null, _impl) : width;
  };
    
  _impl.width = function(value) {
    return arguments.length ? (width = value, _impl) : width;
  };  

  _impl.height = function(value) {
    return arguments.length ? (height = value, _impl) : height;
  }; 

  _impl.scale = function(value) {
    return arguments.length ? (scale = value, _impl) : scale;
  }; 

  _impl.margin = function(value) {
    return arguments.length ? (margin = value, _impl) : margin;
  };   

  _impl.style = function(value) {
    return arguments.length ? (style = value, _impl) : style;
  }; 

  _impl.orientation = function(value) {
    return arguments.length ? (orientation = value, _impl) : orientation;
  }; 
  
  _impl.normalize = function(value) {
    return arguments.length ? (normalize = value, _impl) : normalize;
  };   

  _impl.orientationOrder = function(value) {
    return arguments.length ? (orientationOrder = value, _impl) : orientationOrder;
  };   
  
  _impl.fill = function(value) {
    return arguments.length ? (fill = value, _impl) : fill;
  }; 

  return _impl;
}