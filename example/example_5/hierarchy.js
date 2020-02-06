// =============================================================================
// find out if the Qt object is available
// otherwise we are running in the browser
// =============================================================================

var Qt = Qt || undefined;
var isQtAvailable = isQtAvailable || false;
var HierarchyUI = HierarchyUI || {};

var Hierarchy = Hierarchy || function(container) {
    if (Qt) {
        try {
            Qt.qt_setData.connect(this.setData);
            Qt.qt_addAvailableData.connect(this.addAvailableData);
            Qt.qt_setMarkerSelection.connect(this.setMarkerSelection);
            Qt.qt_setMarkerNames.connect(this.setMarkerNames);
            Qt.qt_setDemoMode.connect(this.setDemoMode);
        } catch (error) {
            isQtAvailable = false;
            //console.log("could not connect qt");
        }
    } else {
        isQtAvailable = false;
    }

    this.container = container;
    this._hierarchyUI = new HierarchyUI(this);
    this._imageSize = 512;

    this._contextMenu = this._hierarchyUI.initContextMenu();

    //this._markerRangeSlider = this._hierarchyUI.initMarkerRangeSlider();


    this._data = null;
    this._availableDataSets= [];

    this._numMarkers;
    this._isMarkerActive = [];
    this._markerNames = [];

    this._expressionRange = [0.0, 5.0];
    this._variationRange = [0.0, 5.0];

    this._isVariationActive = true;
    this._isSizeModeActive = false;

    this._demoMode = true;
    this._uniqueId = 0;

    this._breadCrumbsHeight = 50;
    this._navIconSize = 100;

    this._idBarHeight = 15;
    this._metaBarHeight = 15;
    this._combinedBarHeight = this._idBarHeight + this._metaBarHeight;
    this._margin = 10;

    this._sunburstHeight = height - this._breadCrumbsHeight;
    this._radius = (Math.min(width, this._sunburstHeight) / 2) - this._combinedBarHeight - this._margin;
    var self = this;
    this._xAxisScale = d3.scaleLinear()
        .range([-circ / 3, 2 * circ / 3])
        .clamp(true);

    this._yAxisScale = d3.scaleLinear()
        .range([0, this._radius])
        .domain([0, 1])
        .clamp(true);

    this._iconXAxisScale = d3.scaleLinear()
        .range([-circ / 3, 2 * circ / 3])
        .clamp(true);

    this._iconYAxisScale = d3.scaleLinear()
        .range([0, this._navIconSize / 2])
        .clamp(true);

    this._containerSvg = d3.select(this.container).append('svg')
        .attr('id', 'container')
        .attr('width', width)
        .attr('height', this._sunburstHeight)
        .attr('xmlns', 'http://www.w3.org/2000/svg'); //namespace needed for independent snapshot

    this._breadCrumbsData = [];
    this._breadCrumbsIds = [];
    this._breadCrumbs = this._containerSvg.append('g')
        .attr('id', '_breadCrumbs');

    this._navIcon = this._containerSvg.append('g')
        .attr('id', '_navIcon');

    this._sunburst = this._containerSvg.append('g')
        .attr('id', '_sunburst')
        .attr('transform', 'translate(' + width / 2 + ',' + (height / 2 + 2 * this._margin) + ')');

    this._partition = d3.partition();

    this._tooltip = d3.select('#tooltip');

    this._simple_tooltip = d3.select('#simple_tooltip');

    this._ttNumber = wNumb({
        decimals: 3,
    });

    this._activeColormap = 9;

    this.arc = d3.arc()
        .startAngle(function (d) {
            return self._xAxisScale(d.x0);
        })
        .endAngle(function (d) {
            return self._xAxisScale(d.x1);
        })
        .innerRadius(function (d) {
            return (!d.data.image[0].length || self._yAxisScale(d.y0) == 0) ? 0 : self._yAxisScale(d.y0) + self._combinedBarHeight;
        })
        .outerRadius(function (d) {
            return d.data.image[0].length ? self._yAxisScale(d.y1) : 0;
        });

    this.iconArc = d3.arc()
        .startAngle(function (d) {
            return self._iconXAxisScale(d.x0);
        })
        .endAngle(function (d) {
            return self._iconXAxisScale(d.x1);
        })
        .innerRadius(function (d) {
            return self._iconYAxisScale(d.y0);
        })
        .outerRadius(function (d) {
            return self._iconYAxisScale(d.y1);
        });

    this.idArc = d3.arc()
        .startAngle(function (d) {
            return self._xAxisScale(d.x0);
        })
        .endAngle(function (d) {
            return self._xAxisScale(d.x1);
        })
        .innerRadius(function (d) {
            return self._yAxisScale(d.y0);
        })
        .outerRadius(function (d) {
            return self._yAxisScale(d.y0) == 0 ? 0 : self._yAxisScale(d.y0) + self._idBarHeight;
        })
        .cornerRadius(10);

    this.metaArc = d3.arc()
        .startAngle(function (d) {
            return self._xAxisScale(d.x0);
        })
        .endAngle(function (d) {
            return self._xAxisScale(d.x1);
        })
        .innerRadius(function (d) {
            return self._yAxisScale(d.y0) == 0 ? 0 : self._yAxisScale(d.y0) + self._idBarHeight;
        })
        .outerRadius(function (d) {
            return self._yAxisScale(d.y0) == 0 ? 0 : self._yAxisScale(d.y0) + self._combinedBarHeight;
        });
    this._fills;
    this._outlines;
    this._idBars;
    this._metaBars;
    this._metaFill;
    this._iconArcs;
    this._imgs = [];
    this._partitionData;

    this._viewRoot = '';

    this._arrowWidth = 15;
    this._arrowHeight = 30;
    this._arrowTopOffset = 10;
    this._maxVal = 5;
    this.setClickActions();
    this.setDemoMode();

};



Hierarchy.findMax = function (d, attr) {
    var m = 0;
    for (var i in d) {
        //if(attr == "y0") log("rec: " + i + " of " + d.length );
        if (d[i] !== null && typeof (d[i]) == 'object') {
            if (d[i][attr] != undefined) {
                //if(attr == "y0") log("value = " + d[i][attr]);
                m = Math.max(m, d[i][attr]);
            }
            //going on step down in the object tree
            //if(attr == "y0" && d[i].children) log(d[i].children.length + " children");
            m = Math.max(m, Hierarchy.findMax(d[i].children, attr));
        }
    }
    //if(attr == "y0") log("returning " + m);
    return m;
};

Hierarchy.findViewRoot = function (d) {
    var node = null;

    for (var i in d) {
        if (d[i] !== null && typeof (d[i]) == 'object') {
            if (d[i].data.name == this._viewRoot) {
                return d[i];
            }
            n = Hierarchy.findViewRoot(d[i].children);
            if (n) return n;
        }
    }
    return null;
};

Hierarchy.findNumMarkers = function (d) {
    var m = 0;
    for (var i in d) {
        if (d[i] !== null && typeof (d[i]) == 'object') {
            //log(d[i])
            if (d[i].expression != undefined && d[i].expression.length > 0) {
                return d[i].expression.length;
            }

            //going on step down in the object tree
            m = Hierarchy.findNumMarkers(d[i].children);

            if (m > 0) {
                return m;
            }
        }
    }
    return m;
};

Hierarchy.prototype = {

    setClickActions: function() {
        var self = this;
        $('#explorationSelector').click(function(){
            self.setActiveExploration(this.value);
        });
        $('#showVariationCheckBox').click(function(){
            self.toggleVariation();
        });
        $('#sizeModeCheckBox').click(function(){
            self.toggleSizeMode();
        });
    },

    // static utility functions outside prototype
    arcIncircle: function (d, offset, print) {
        //var t0 = performance.now();

        var startAngle = this._xAxisScale(d.x0);
        var endAngle = this._xAxisScale(d.x1);
        var innerRadius = this._yAxisScale(d.y0);
        var outerRadius = this._yAxisScale(d.y1);

        var c = {x: 0, y: 0, radius: 0, diameter: 0, centerX: 0, centerY: 0};
        if (outerRadius == 0) {
            return c;
        }
        else if (innerRadius == 0) {
            c.radius = outerRadius * 0.9;
            c.diameter = c.radius * 2;
            c.centerX = c.x - c.radius;
            c.centerY = c.y - c.radius;
            return c;
        }

        innerRadius += offset;

        var r = innerRadius + ((outerRadius - innerRadius) * 0.5);
        var t = startAngle + ((endAngle - startAngle) * 0.5);

        // rough estimate of max width
        var width = r * (endAngle - startAngle);
        var height = outerRadius - innerRadius;

        c.x = r * Math.sin(t);
        c.y = -(r * Math.cos(t));
        c.radius = Math.min(width, height) * 0.5 * 0.9;
        c.diameter = c.radius * 2;
        c.centerX = c.x - c.radius;
        c.centerY = c.y - c.radius;

        //var t1 = performance.now();
        //log("arcIncircle " + (t1-t0) + " milliseconds")
        return (c);
    },

    initLayout: function () {
        if (this._data == null) return;

        var root = d3.hierarchy(this._data);
        var self = this;
        root.sum(function (d) {
            if (self._isSizeModeActive) {
                return d.isOutermost ? d.size : 0;
            } else {
                return d.fraction;
            }
        });
        // root.sort(null);
        this._partition(root);

        this._sunburst.selectAll('*').remove();

        this._partitionData = root.descendants();

        this._partitionData.forEach(function (d) {
            d.data.circle = self.arcIncircle(d, self._combinedBarHeight);
        });

        if (this._viewRoot == '') {
            this._viewRoot = root.data.name;
        }

        var n = Hierarchy.findViewRoot([root]);
        var top = Hierarchy.findMax([n], 'y0');

        if (n) {
            this._yAxisScale.domain([this._yAxisScale.domain()[0], top]);
        }

        if (this._breadCrumbsData.length < 1) {
            this.updateBreadCrumbs(this._partitionData[0]);
        }

        var clipPaths = this._sunburst.selectAll('clipPath')
            .data(this._partitionData)
            .enter()
            .append('clipPath')
            .attr('id', function (d) {
                return d.data.uniqueID + '_clip';
            });

        clipPaths.append('path')
            .attr('class', 'mainPaths')
            .attr('id', function (d) {
                return d.data.uniqueID + '_mask';
            })
            .attr('d', this.arc);

        var g_outer = this._sunburst.selectAll('g')
            .data(this._partitionData)
            .enter()
            .append('g')
            .attr('id', function (d) {
                return d.data.uniqueID;
            });

        var g = g_outer.append('g')
            .style('clip-path', function (d) {
                return 'url(#' + d.data.uniqueID + '_clip)';
            })
            //.on("mouseover", function (d) {
            ////    log("mouseover "+d3.event.pageX+" "+d3.event.pageY);
            //    self._simple_tooltip.style("display", "block")

        //    .style("left", Math.max(0, d3.event.pageX - (self._simple_tooltip.node().getBoundingClientRect().width)) + "px")
        //    .style("top", Math.min(height - (self._simple_tooltip.node().getBoundingClientRect().height), d3.event.pageY) + "px");
        //    self._simple_tooltip.select(".title")
        //        .html(d.data.name);

            //})
            //.on("mouseout", function (d) {
            //    self._simple_tooltip.style("display", "none");
            //})
            .on('click', function (d, i) {

                if (!self._demoMode && !d.data.image[0].length) return;
                if (d3.event.ctrlKey) {
                    self.raise(d.data.name, -1);
                }
                // else if (event.altKey) { }
                else if (d3.event.shiftKey) {
                    self.zoom(d, i);
                }
                else {
                    self.raise(d.data.name, -1);
                }
            });

        this._fills = g.append('path')
            .attr('class', 'mainPaths')
            .attr('d', function (d) {
                return d3.select('#' + d.data.uniqueID + '_mask').attr('d');
            })
            .attr('fill', function (d) {
                return 'white';
            });


        this._imgs.length = 3;
        this._imgs[2] = g.append('image')
            .attr('overflow', 'visible')
            .attr('height', function (d) {
                return d.data.image[2].length ? '1px' : '0px';
            })
            .attr('width', function (d) {
                return d.data.image[2].length ? '1px' : '0px';
            })
            .attr('transform', function (d) {
                return 'matrix(' + d.data.circle.diameter + ' 0 0 ' + d.data.circle.diameter + ' ' + d.data.circle.centerX + ' ' + d.data.circle.centerY + ')';
            })
            .attr('xlink:href', function (d) {
                //var idx = 2;
                //if(d.data.circle.diameter*2 > _imageSize) idx--;
                //if(d.data.circle.diameter > _imageSize) idx--;
                return (d.data.image[2].length != undefined) ? 'data:image/png;base64,' + d.data.image[2] : '';
            })
            .style('opacity', 1);//function (d) {
        //            if(d.data.circle.diameter < 128) return 1;
        //            if(d.data.circle.diameter > 256) return 0;
        //            return (256 - d.data.circle.diameter)/128;
        //        });


        this._imgs[1] = g.append('image')
            .attr('overflow', 'visible')
            .attr('height', function (d) {
                return d.data.image[1].length ? '1px' : '0px';
            })
            .attr('width', function (d) {
                return d.data.image[1].length ? '1px' : '0px';
            })
            .attr('transform', function (d) {
                return 'matrix(' + d.data.circle.diameter + ' 0 0 ' + d.data.circle.diameter + ' ' + d.data.circle.centerX + ' ' + d.data.circle.centerY + ')';
            })
            .attr('xlink:href', function (d) {
                //var idx = 2;
                //if(d.data.circle.diameter*2 > _imageSize) idx--;
                //if(d.data.circle.diameter > _imageSize) idx--;
                return (d.data.image[1].length != undefined) ? 'data:image/png;base64,' + d.data.image[1] : '';
            })
            .style('opacity', function (d) {
                return Math.max(0.0, (d.data.circle.diameter - 128) / 128);
                //if(d.data.circle.diameter < 128) return 0;
                //if(d.data.circle.diameter > 512) return 0;
                //if(d.data.circle.diameter < 256) return (d.data.circle.diameter - 128)/128;
                //return (512 - d.data.circle.diameter)/256;
            });


        this._imgs[0] = g.append('image')
            .attr('overflow', 'visible')
            .attr('height', function (d) {
                return d.data.image[0].length ? '1px' : '0px';
            })
            .attr('width', function (d) {
                return d.data.image[0].length ? '1px' : '0px';
            })
            .attr('transform', function (d) {
                return 'matrix(' + d.data.circle.diameter + ' 0 0 ' + d.data.circle.diameter + ' ' + d.data.circle.centerX + ' ' + d.data.circle.centerY + ')';
            })
            .attr('xlink:href', function (d) {
                //var idx = 2;
                //if(d.data.circle.diameter*2 > _imageSize) idx--;
                //if(d.data.circle.diameter > _imageSize) idx--;
                return (d.data.image[0].length != undefined) ? 'data:image/png;base64,' + d.data.image[0] : '';
            })
            .style('opacity', function (d) {
                return Math.max(0.0, (d.data.circle.diameter - 256) / 256);
                //if(d.data.circle.diameter < 256) return 0;
                //if(d.data.circle.diameter > 512) return 1;
                //return (d.data.circle.diameter - 256)/256;
            });


        this._outlines = g.append('path')
            .attr('class', 'segmentOutline mainPaths')
            .attr('d', function (d) {
                return d3.select('#' + d.data.uniqueID + '_mask').attr('d');
            })
            /*.style("stroke", function (d) {
             return d3.hsv(d.data.hue, 0.5, 1.0)
             })*/
            .style('fill', 'transparent');

        var g_meta = g_outer.append('g')
            .on('contextmenu', d3.contextMenu(self._contextMenu, function (d) {
                d3.select('.d3-context-menu').style('display', 'none');
                // if(d.children || d.data.isLeaf) { return false; }
            }));


        this._idBars = g_meta.append('path')
            .attr('class', 'idOutline idPaths')
            .attr('id', function (d) {
                return d.data.uniqueID + '_idBar';
            })
            .attr('d', this.idArc)
            .attr('fill', function (d) {
                //return "red";
                //log("xxx");
                // log(d.data.color);
                //return d3.hsv(d.data.hue, 0.5, 1.0);
                return d3.color(d.data.color);
            })
            .on('mouseover', function (d) {
                self._simple_tooltip.style('display', 'block')
                    .style('left', Math.max(10, d3.event.pageX - (self._simple_tooltip.node().getBoundingClientRect().width)) + 'px')
                    .style('top', Math.min(height - (self._simple_tooltip.node().getBoundingClientRect().height), d3.event.pageY + 10) + 'px');
                self._simple_tooltip.select('.title')
                    .html(d.data.displayName);
            })
            .on('mouseout', function (d) {
                self._simple_tooltip.style('display', 'none');
            })
            .on('click', function (d, i) {
                if (d3.event.altKey) {
                    self.select_cluster(1, d.data.cName, d.data.cId);
                }
                else {
                    self.select_cluster(0, d.data.cName, d.data.cId);
                }

            });

        var g_marker = g_meta.append('g');
        this._metaFill = g_marker.append('g').selectAll('path')
            .data(function (d) {
                var data = [];
                if (!d.data.expression) {
                    return data;
                }
                var numTotalMarkers = d.data.expression.length;
                self._numMarkers = numTotalMarkers;
                var length = (d.x1 - d.x0) / self._numMarkers;

                var idx = 0;
                for (var i = 0; i < numTotalMarkers; i++) {

                    if (self._isMarkerActive.length == 0 || self._isMarkerActive[d.data.markerOrder[i]]) {

                        var angle = idx * length + d.x0;
                        data.push({
                            'name': self._markerNames.length > 0 ? self._markerNames[d.data.markerOrder[i]] : 'Marker',
                            'expression': d.data.expression[i],
                            'variation': (d.data.variation) ? d.data.variation[i] : d.data.expression[i] - 2.0,
                            'x0': angle,
                            'x1': angle + length,
                            'y0': d.y0,
                            'y1': d.y1,
                            'originalIdx': d.data.markerOrder[i],
                            'maxIdx': d.data.maxIdx,
                            'clusterId': d.data.cId,
                            'clusterName': d.data.cName,
                            'analysis': self._demoMode || d.data.image[0].length ? d.data.name : '',
                            'parent': d.parent != null ? d.parent.data.name : '',
                        });
                        idx++;
                    }
                }

                return data;
            })
            .enter()
            .append('path')
            .attr('class', 'metaSegments')
            .attr('d', this.metaArc)
            .attr('fill', function (d) {
                return _color(this._isVariationActive ? d.variation : d.expression);
            })
            .on('mouseover', function (d) {
                self._tooltip.style('display', 'block')
                    .style('left', Math.max(10, d3.event.pageX - (self._tooltip.node().getBoundingClientRect().width)) + 'px')
                    .style('top', Math.min(height - (self._tooltip.node().getBoundingClientRect().height), d3.event.pageY + 10) + 'px');
                self._tooltip.select('.title')
                    .html(d.name);
                self._tooltip.select('.exp')
                    .html(self._ttNumber.to(d.expression));
                self._tooltip.select('.stddev')
                    .html(self._ttNumber.to(d.variation));
            })
            .on('mouseout', function (d) {
                self._tooltip.style('display', 'none');
            })
            .on('click', function (d, i) {

                if (d3.event.altKey && d.analysis.length) {
                    self.raise(d.analysis, d.originalIdx);
                }
                else if (d3.event.ctrlKey) {
                    if (self._demoMode) self.raise('tSNE Analysis', d.originalIdx);
                }
                else if (d.parent.length) {
                    self.select_cluster(0, d.clusterName, d.clusterId);
                    self.raise(d.parent, d.originalIdx);
                }

            });

        this._metaBars = g_marker.append('path')
            .attr('class', 'metaOutline metaPaths')
            .attr('id', function (d) {
                return d.data.uniqueID + '_metaBar';
            })
            .attr('d', this.metaArc);

        this.updateAdaptiveInformation();
    },

    drawTooltipHeatmap: function (d) {

        this._tooltip.selectAll('svg').remove();
        var tooltipHeatmap = this._tooltip.append('svg').attr('id', '_tooltipHeatmap');

        var data = [];
        var idx = 0;
        var w = 0;
        if (!d.data.expression) {
            return;
        }
        for (var i = 0; i < d.data.expression.length; i++) {
            if (this._isMarkerActive.length == 0 || this._isMarkerActive[d.data.markerOrder[i]]) {
                var name = this._markerNames.length > 0 ? this._markerNames[d.data.markerOrder[i]] : '' + i;
                //log(name);
                //log(name.width());
                w = Math.max(w, name.width());
                data.push({
                    'name': name,
                    'expression': d.data.expression[i],
                    'variation': (d.data.variation) ? d.data.variation[i] : d.data.expression[i]
                });
                idx++;
            }
        }

        var s = 15;

        tooltipHeatmap
            .attr('width', w + s + 10)
            .attr('height', s * data.length);

        var g = tooltipHeatmap.selectAll('g')
            .data(data)
            .enter()
            .append('g');

        g.append('rect')
            .attr('x', 0)
            .attr('y', function (d, i) {
                return s * i;
            })
            .attr('width', s)
            .attr('height', s)
            .attr('fill', function (d) {
                return _color(this._isVariationActive ? d.variation : d.expression);
            });

        g.append('text')
            .attr('x', s + 5)
            .attr('y', function (d, i) {
                return s * (i + 1);
            })
            .attr('class', 'tooltipLabel')
            .text(function (d) {
                return d.name;
            });
    },


    drawIcon: function () {

        this._navIcon.selectAll('*').remove();

        this._navIcon.attr('transform', 'translate(' + (this._navIconSize / 2 +this._margin) + ',' + (this._navIconSize / 2 + this._arrowTopOffset / 2) + ')');
        var self = this;
        this._iconArcs = this._navIcon.selectAll('path')
            .data(this._partitionData)
            .enter()
            .append('path')
            .attr('class', 'iconPaths')
            .attr('id', function (d) {
                return d.data.uniqueID + '_icon';
            })
            .attr('d', this.iconArc)
            // FIXME: something is going on with setting data twice and the node not finding itself in the _breadCrumbsData (even though it isstill there...)
            .attr('fill', function (d, i) {
                if (d.parent == null || self._breadCrumbsIds.indexOf(d.data.uniqueID) >= 0) return 'rgb(60,150,250)'; else return '#F5F5F5';
            })
            .on('click', function (d, i) {
                if (d.data.image[0].length) {
                    self.zoom(d, i);
                }
            })
            .on('contextmenu', d3.contextMenu(self._contextMenu, function (d) {
                d3.select('.d3-context-menu').style('display', 'none');
                if (d.children || d.data.isLeaf) {
                    return false;
                }
            }));
    },

    drawBreadCrumbs: function () {

        this._breadCrumbs.selectAll('*').remove();
        var self = this;
        var arrows = this._breadCrumbs.selectAll('path')
            .data(this._breadCrumbsData)
            .enter()
            .append('path')
            .attr('class', 'breadCrumbOutline')
            .attr('d', function (d, i) {
                var left = d.data.offset;
                var right = d.data.offset + d.data.width;
                var larrow = i == 0 ? left : left + self._arrowWidth;
                var rarrow = right + self._arrowWidth;
                var top = self._arrowTopOffset;
                var middle = self._arrowTopOffset + self._arrowHeight / 2;
                var bottom = self._arrowTopOffset + self._arrowHeight;
                return (
                    'M ' + left + ' ' + top + ' ' +
                    'L ' + right + ' ' + top + ' ' +
                    'L ' + rarrow + ' ' + middle + ' ' +
                    'L ' + right + ' ' + bottom + ' ' +
                    'L ' + left + ' ' + bottom + ' ' +
                    'L ' + larrow + ' ' + middle + ' ' +
                    'L ' + left + ' ' + top + ' '
                );
            })
            .on('click', this.zoom.bind(this));

        var text = this._breadCrumbs.selectAll('text')
            .data(this._breadCrumbsData);


        text.enter()
            .append('text')
            .text(function (d) {
                return d.data.name;
            })
            .attr('transform', function (d, i) {
                var arrowAdd = i == 0 ? 0 : self._arrowWidth;
                return 'translate(' + (d.data.offset + 5 + arrowAdd) + ',30)';
            })
            .on('click', this.zoom.bind(this));

        text.exit().remove();

        this.drawIcon();
    },

    zoom: function (d, i) {


        if (i > 0) {
            sizeModeSwitch;

            //  document.querySelector('#my-checkbox').MaterialCheckbox.disable()

            var selector = document.getElementById('sizeModeSwitch');
            selector.style.visibility = 'hidden';

        }
        else {
            var selector = document.getElementById('sizeModeSwitch');
            selector.style.visibility = 'visible';
        }


        this._viewRoot = d.data.name;

        if (this._wrapper) {
            this._wrapper.loadLayoutByName(this._viewRoot);
        }

        this.updateBreadCrumbs(d);


        var e = document.getElementById(d.data.uniqueID);
        e.parentNode.appendChild(e);

        var maxDepth = Hierarchy.findMax([d], 'y0');

        this._imgs[0].style('opacity', 0.0);
        this._imgs[1].style('opacity', 0.0);
        this._imgs[2].style('opacity', 0.0);

        var self = this;
        this._sunburst.transition()
            .duration(1000)
            .on('end', function () {
                self.updateClippings();
                self.updateAdaptiveInformation(true);
            })
            .tween('scale', function () {


                var xd = d3.interpolate(self._xAxisScale.domain(), [d.x0, d.x1]);
                var yd = d3.interpolate(self._yAxisScale.domain(), [d.y0, maxDepth]);
                var yr = d3.interpolate(self._yAxisScale.range(), [0, self._radius]);
                return function (t) {
                    self._xAxisScale.domain(xd(t));
                    self._yAxisScale.domain(yd(t)).range(yr(t));
                };


            })
            .selectAll('path')
            .filter(function () {
                return !d3.select(this).classed('metaSegments');
            })
            .attrTween('d', function (d) {
                var arcFunc = self.arc;
                var item = d3.select(this);
                if (item.classed('metaPaths')) {
                    arcFunc = self.metaArc;
                }
                if (item.classed('idPaths')) {
                    arcFunc = self.idArc;
                }
                return function () {
                    d.data.circle = self.arcIncircle(d, self._combinedBarHeight);
                    //self.updateMetaBars();
                    //self.updateClippings();
                    //self.updateAdaptiveInformation(true);
                    return arcFunc(d);
                };
            });


        //    _metaFill.style("opacity", 0.0);
        this._metaFill.transition()
            .duration(1000)
            //        .delay(250)
            //        .style("opacity", 1.0)
            .attrTween('d', function (d) {
                return function () {
                    return self.metaArc(d);
                };
            });


    },

    updateBreadCrumbs: function (lastNode) {

        this._breadCrumbsData.length = 0;

        var inverseBreadCrumbs = [lastNode];

        var p = lastNode.parent;
        while (p != null) {
            inverseBreadCrumbs.push(p);
            p = p.parent;
        }

        this._breadCrumbsData = inverseBreadCrumbs.reverse();

        var offset = 20 + this._navIconSize;
        for (var i = 0; i < this._breadCrumbsData.length; i++) {
            this._breadCrumbsData[i].data.offset = offset;
            var additionalSpace = i == 0 ? -5 : 10;
            var w = this._breadCrumbsData[i].data.name.width() + this._arrowWidth + additionalSpace;
            offset += w + 5;
            this._breadCrumbsData[i].data.width = w;
        }

        //log(_breadCrumbsData)
        this._breadCrumbsIds.length = this._breadCrumbsData.length;
        for (var i = 0; i < this._breadCrumbsData.length; i++) {
            this._breadCrumbsIds[i] = this._breadCrumbsData[i].data.uniqueID;
        }

        this.drawBreadCrumbs();
    },

    updateClippings: function () {
        //log("domain: [" + self._yAxisScale.domain()[0] + ".." + self._yAxisScale.domain()[1] + "]");


        this._fills.attr('d', function (d) {
            return d3.select('#' + d.data.uniqueID + '_mask').attr('d');
        });

        this._imgs[0].attr('transform', function (d) {
            return 'matrix(' + d.data.circle.diameter + ' 0 0 ' + d.data.circle.diameter + ' ' + d.data.circle.centerX + ' ' + d.data.circle.centerY + ')';
        });

        this._imgs[1].attr('transform', function (d) {
            return 'matrix(' + d.data.circle.diameter + ' 0 0 ' + d.data.circle.diameter + ' ' + d.data.circle.centerX + ' ' + d.data.circle.centerY + ')';
        });

        this._imgs[2].attr('transform', function (d) {
            return 'matrix(' + d.data.circle.diameter + ' 0 0 ' + d.data.circle.diameter + ' ' + d.data.circle.centerX + ' ' + d.data.circle.centerY + ')';
        });

        this._outlines.attr('d', function (d) {
            return d3.select('#' + d.data.uniqueID + '_mask').attr('d');
        });
        /*
        var self = this;
         this._metaBars.attr("fill", function (d) {
         d.pixelWidth = self._yAxisScale(d.y0) * (_xAxisScale(d.x1) - _xAxisScale(d.x0)) / _numMarkers;
         if( d.data.expression.length == 0 ) { // no markers available => show the grey bar
         return "grey";
         } else {
         if(d.pixelWidth < 2.0) { // we dont have enough space to show complete marker expression, just show max
         return _color(self._isVariationActive ? d.data.maxVariation : d.data.maxExpression);
         } else {
         return "none"
         }
         }
         })
         .on("mouseover", function(d){
         if(d.pixelWidth < 2.0) {
         log(d);
         this.drawTooltipHeatmap(d);
         if( d.data.expression.length == 0 ) { return }
         self._tooltip.style("display", "block")
         .style("left", Math.max(10, d3.event.pageX-120) + "px")
         .style("top", Math.min(height - 75, d3.event.pageY+10) + "px");
         self._tooltip.select(".title")
         .html("Max Variation: " + d.data.maxVariationName);
         self._tooltip.select(".exp")
         .html(self._ttNumber.to(d.data.maxExpression));
         self._tooltip.select(".stddev")
         .html(self._ttNumber.to(d.data.maxVariation));
         }
         })
         .on("mouseout", function(d){
         self._tooltip.style("display", "none");
         })
         .on("click", function (d) {
         if (d.parent != null && event.altKey) { self.raise(d.parent.data.name, d.data.maxIdx); }
         else if (d.data.image[0].length) { self.raise(d.data.name, d.data.maxIdx); }
         });*/

    },

    updateAdaptiveInformation: function (recompute) {

        this.updateMetaBars(recompute);
        this.updateImages(recompute);

    },

    updateMetaBars: function (recompute) {
        var self = this;
        this._metaBars.attr('fill', function (d) {

            d.pixelWidth = self._yAxisScale(d.y0) * (self._xAxisScale(d.x1) - self._xAxisScale(d.x0)) / self._numMarkers;
            if (!d.data.expression) {
                return 'white';
            }
            if (d.data.expression.length == 0) { // no markers available => show the grey bar
                return 'grey';
            } else {
                if (d.pixelWidth < 2.0) { // we dont have enough space to show complete marker expression, just show max
                    return _color(this._isVariationActive ? d.data.maxVariation : d.data.maxExpression);
                } else {
                    return 'none';
                }
            }
        })
            .on('mouseover', function (d) {
                if (d.pixelWidth < 2.0) {
                    self.drawTooltipHeatmap(d);
                    if (!d.data.expression) {
                        return;
                    }
                    if (d.data.expression.length == 0) {
                        return;
                    }
                    self._tooltip.style('display', 'block')
                        .style('left', Math.max(10, d3.event.pageX - (self._tooltip.node().getBoundingClientRect().width)) + 'px')
                        .style('top', Math.min(height - (self._tooltip.node().getBoundingClientRect().height), d3.event.pageY + 10) + 'px');
                    self._tooltip.select('.title')
                        .html('Max Variation: ' + d.data.maxVariationName);
                    self._tooltip.select('.exp')
                        .html(self._ttNumber.to(d.data.maxExpression));
                    self._tooltip.select('.stddev')
                        .html(self._ttNumber.to(d.data.maxVariation));
                }
            })
            .on('mouseout', function (d) {
                self._tooltip.selectAll('svg').remove();
                self._tooltip.style('display', 'none');
            })
            .on('click', function (d) {
                if (d.parent != null && d3.event.altKey) {
                    self.raise(d.parent.data.name, d.data.maxIdx);
                }
                else if (self._demoMode || d.data.image[0].length) {
                    self.raise(d.data.name, d.data.maxIdx);
                }
            });
    },

    updateImages: function (recompute) {
        var self = this;
        this._imgs[0].attr('transform', function (d) {
            if (recompute) d.data.circle = self.arcIncircle(d, self._combinedBarHeight);
            return 'matrix(' + d.data.circle.diameter + ' 0 0 ' + d.data.circle.diameter + ' ' + d.data.circle.centerX + ' ' + d.data.circle.centerY + ')';
        })
            .style('opacity', function (d) {
            //if(d.data.circle.diameter < 256) return 0;
            //if(d.data.circle.diameter > 512) return 1;
                return Math.max(0.0, (d.data.circle.diameter - 256) / 256);
            });
        this._imgs[1].attr('transform', function (d) {
            if (recompute) d.data.circle = self.arcIncircle(d, self._combinedBarHeight);
            return 'matrix(' + d.data.circle.diameter + ' 0 0 ' + d.data.circle.diameter + ' ' + d.data.circle.centerX + ' ' + d.data.circle.centerY + ')';
        })
            .style('opacity', function (d) {
                //if(d.data.circle.diameter < 128) return 0;
                //if(d.data.circle.diameter > 512) return 0;
                //if(d.data.circle.diameter < 256) return (d.data.circle.diameter - 128)/128;
                //return (512 - d.data.circle.diameter)/256;
                return Math.max(0.0, (d.data.circle.diameter - 128) / 128);
            });
        this._imgs[2].attr('transform', function (d) {
            if (recompute) d.data.circle = self.arcIncircle(d, self._combinedBarHeight);
            return 'matrix(' + d.data.circle.diameter + ' 0 0 ' + d.data.circle.diameter + ' ' + d.data.circle.centerX + ' ' + d.data.circle.centerY + ')';
        })
            .style('opacity', 1);//function (d) {
        //        if(d.data.circle.diameter < 128) return 1;
        //        if(d.data.circle.diameter > 256) return 0;
        //        return (256 - d.data.circle.diameter)/128;
        //    });

        //    .attr("xlink:href", function (d) {
        //        //if(d.data.uniqueID == "UID24") log(d.data.circle)
        //        var idx = 2;
        //        if(d.data.circle.diameter*2 > _imageSize) idx--;
        //        if(d.data.circle.diameter > _imageSize) idx--;
        //        return (d.data.image[0].length != undefined) ? "data:image/png;base64," + d.data.image[idx] : "";
        //    });
    },

    setDemoMode: function () {

        this._demoMode = true;
        if (this._demoMode) {
            var selector = document.getElementById('explorationSelector');
            selector.style.visibility = 'hidden';


            var uncertaintySwitch = document.getElementById('uncertaintySwitch');
            uncertaintySwitch.style.visibility = 'hidden';
            this.toggleVariation();
            this._isVariationActive = false;
        }
    },

    setData: function (d) {

        this.initData(d);

        setColormap(this._activeColormap);
        //refreshColormap();

        this.initLayout();
        this.drawIcon();
    },

    /**
     * Set the plugin wrapper for integration with ReScatter
     * @param wrapper
     */
    setWrapper: function(wrapper) {
        this._wrapper = wrapper;
    },

    setMarkerSelection: function (isMarkerActive) {

        this._isMarkerActive = isMarkerActive.slice();

        //   this._numMarkers = this._isMarkerActive.reduce(function (a, b) { return a + b }, 0);

        if (this._data) {
            this.initLayout();
        }
    },

    setMarkerNames: function (names) {

        this._markerNames = JSON.parse(names).names;

        if (this._data) {
            this.initLayout();
        }
    },

    addAvailableData: function (name) {

        for (var i = 0; i < this._availableDataSets.length; i++) {
            if (name == this._availableDataSets[i]) {
                return;
            }
        }
        this._availableDataSets.push(name);
        if (this._demoMode) {
            this.setActiveExploration(name);
        }
        else
            this.updateAvailableDataSelectionBox();
    },

    initData: function (d) {
        // Changed to loading pure JSON data
        //this._data = JSON.parse(d);
        this._data = d;

        this._uniqueId = 0;
        this.addUniqueIds([this._data]);

        this.addFraction([this._data], 1.0);

        this.updateMaxStatistics([this._data]);
        //this._hierarchyUI.rebuildRangeSlider(self._demoMode, this._variationRange, this._expressionRange, this._isVariationActive);

        this._maxVal = Hierarchy.findMax([this._data], 'size');

        if (this._isMarkerActive.length > 0) {
            this._numMarkers = this._isMarkerActive.reduce(function (a, b) {
                return a + b;
            }, 0);
        } else {
            this._numMarkers = Hierarchy.findNumMarkers([this._data]);
        }
    },

    addUniqueIds: function (d) {
        for (var i in d) {
            if (d[i] !== null && typeof (d[i]) == 'object') {
                //log(o[i].size)
                d[i].uniqueID = 'UID' + this._uniqueId++;
                //going one step down in the object tree
                this.addUniqueIds(d[i].children);
            }
        }
    },

    addFraction: function (d, v) {
        for (var i in d) {
            //log(o[i].size)
            //going one step down in the object tree
            if (d[i].children !== null && typeof (d[i].children) == 'object') {
                d[i].isOutermost = false;
                this.addFraction(d[i].children, v / d[i].children.length);
            } else {
                d[i].isOutermost = true;
                d[i].fraction = v;
            }
        }
    },

    updateMaxStatistics: function (d) {

        // log("updateMaxStatistics");
        this._expressionRange = [9999.9, 0.0];
        this._variationRange = [9999.9, 0.0];

        this.updateMaxStatisticsRecursive(d);

        // log(this._expressionRange[0] + " " + this._expressionRange[1]);
        //  log(this._variationRange[0] + " " + this._variationRange[1]);
    },

    updateMaxStatisticsRecursive: function (d) {

        for (var i in d) {
            if (d[i] !== null && typeof (d[i]) == 'object') {

                d[i].maxExpression = 0.0;
                d[i].maxVariation = 0.0;
                d[i].maxVariationName = '';
                d[i].maxIdx = -1;

                var minExpression = 9999.9;
                var maxExpression = 0.0;
                var minVariation = 9999.9;
                var maxVariation = 0.0;

                if (d[i].expression && d[i].expression.length > 0) {

                    var variation = (d[i].variation && d[i].variation.length > 0) ? d[i].variation : d[i].expression;

                    for (var j = 0; j < d[i].expression.length; j++) {
                        // if(!this._isMarkerActive[j]) continue;

                        if (variation[j] >= maxVariation) {
                            maxVariation = variation[j];
                            d[i].maxIdx = j;
                        }

                        minExpression = Math.min(minExpression, d[i].expression[j]);
                        maxExpression = Math.max(maxExpression, d[i].expression[j]);
                        minVariation = Math.min(minVariation, variation[j]);
                    }
                    d[i].maxExpression = d[i].expression[d[i].maxIdx];
                    d[i].maxVariation = maxVariation;
                    d[i].maxVariationName = this._markerNames.length > 0 ? this._markerNames[d[i].markerOrder[d[i].maxIdx]] : d[i].maxIdx;
                }

                this._expressionRange[0] = Math.min(this._expressionRange[0], minExpression);
                this._expressionRange[1] = Math.max(this._expressionRange[1], maxExpression);
                this._variationRange[0] = Math.min(this._variationRange[0], minVariation);
                this._variationRange[1] = Math.max(this._variationRange[1], maxVariation);

                //going one step down in the object tree
                this.updateMaxStatisticsRecursive(d[i].children);
            }
            //log(d[i].maxIdx);
        }
    },



    // =============================================================================
    // interaction
    // =============================================================================
    leftClickColormap: function (idx) {

        setColormap(idx, true);

        this.initLayout();
    },

    toggleDiscreteColormap: function () {

        _isColormapDiscrete = !_isColormapDiscrete;

        setColormap(self._activeColormap, false);

        this.initLayout();
    },

    toggleVariation: function () {
        this._isVariationActive = !this._isVariationActive;

        //this._hierarchyUI.rebuildRangeSlider(self._demoMode, this._variationRange, this._expressionRange, this._isVariationActive));
    },

    toggleSizeMode: function () {
        this._isSizeModeActive = !this._isSizeModeActive;

        this.initLayout();
        this.drawIcon();
    },

    updateAvailableDataSelectionBox: function () {

        var selector = document.getElementById('explorationSelector');
        var selected;
        if (selector.length > 0) {
            selected = selector.selectedIndex;
        }
        selector.length = 1;

        for (var i = 0; i < this._availableDataSets.length; i++) {

            var opt = document.createElement('option');
            opt.text = this._availableDataSets[i];
            opt.value = this._availableDataSets[i];

            selector.add(opt);
        }

        selector.selectedIndex = selected;
    },

    // =============================================================================
    // Windowing ===================================================================
    // =============================================================================
    resize: function() {

        width = $(this.container).width();
        height = $(this.container).width() + this._breadCrumbsHeight;

        this._sunburstHeight = height - this._breadCrumbsHeight;
        this._radius = Math.min(width, this._sunburstHeight) / 2 - this._combinedBarHeight - this._margin;

        this._containerSvg
            .attr('width', width)
            .attr('height', height);

        this._sunburst.attr('transform', 'translate(' + width / 2 + ',' + (height / 2 + 2 * this._margin) + ')');

        this._yAxisScale.range([0, this._radius]);

        this.initLayout();
    },

    // =============================================================================
    // external
    // =============================================================================
    setActiveExploration: function (name) {

        if (this.isQtAvailable) {
            Qt.js_selectData(name);
        }
    },

    raise: function (name, markerIndex) {

        //    log("raising " + name + " with marker " + markerIndex);

        if (this.isQtAvailable) {
            Qt.js_raiseView(name, parseInt(markerIndex));
        }
    },

    select_cluster: function (selectionId, clusterName, clusterId) {

        if (this.isQtAvailable) {
            Qt.js_selectCluster(selectionId, clusterName, parseInt(clusterId));
        }
    }
};

// =============================================================================
// run =========================================================================
// =============================================================================

function hierarchy_start(hierarchyContainer, hierarchyJsonPath) {
    var hierarchy = new Hierarchy(hierarchyContainer);
    //defineGlobals();
    hierarchy.resize();
    d3.select(window).on('resize', hierarchy.resize.bind(hierarchy));
    //initLegend();

    if (!hierarchy.isQtAvailable) {
        //var active = [0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
        //var active = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var active = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
        //log(active.length);
        hierarchy.setMarkerSelection(active);
        $.getJSON(hierarchyJsonPath, function(data) {
            hierarchy.setData(data);
        });
    }
}
