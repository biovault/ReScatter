/**
 * Created by baldur on 8/5/15.
 * Migrated to ES6 24/7/17
 */

import SelectionSubscriber from '../common/SelectionSubscriber';
import ToolTipController from '../layout/ToolTipController';
import SnapShotController from '../snapshot/SnapShotController';
import SelectionProtocol from '../../protocols/SelectionProtocol';
import ControlProtocol from '../../protocols/ControlProtocol';

let toolTipController = new ToolTipController();

class ChoroplethController extends SelectionSubscriber {

    /**
     * @constructor
     * A choropleth or thematic map localizer is based on one or more SVG files
     * from svgPath with identifiable regions.
     * The supplied SVG must have region ids stored in a tag <path> with
     * attribute called svg_structure containing an svg path and structure_id
     * containing the ids corresponding to the list in regionsIndex (obtained from regionsIndexPath).
     * The order in regionsIndex corresponds to the column order in the
     * nrrd data at mappng.mapDataPath.
     * @param svgId - id if the div where the choropleth wil be placed
     * @param annotateId - id of the (floating) div where choropleth animation will be placed
     * @param plethDescrip - the pleth description from the the layout
     */
    constructor (svgId, annotateId, plethDescrip) {
        'use strict';
        super(2); // only keep the last 2 dynamic selections
        this.index_to_brain_regions = []; // Array which maps index to brain regions
        this.svgId = svgId;
        this.annotateId = annotateId;
        this.id = plethDescrip.id;
        this.selectionIn = plethDescrip.selectionIn;
        this.dynamicSelectionIn = plethDescrip.dynamicSelectionIn;
        this.dynamicSelectionOut = plethDescrip.dynamicSelectionOut;
        this.regionsIndexPath = plethDescrip.region_ids;
        this.propsPath = plethDescrip.props;
        this.preselect = plethDescrip.preselect;
        this.popupAttributeList = plethDescrip.popupAttributeList || [];
        this.lastColorSet = undefined;
        this.loadedSvgs = {};
        this.cachedSvgs = {};
        this.lastVisibleSelectionContext = undefined;
        this.selectedIds = [];
        this.regionsOrdered = [];
        this.regionMaps = {};
        this.view = undefined;

    }

    initialize(view) {
        let self = this;
        this.view = view;
        let filesAndTypes = [
            {path:this.regionsIndexPath, type:'json'},
            {path:this.propsPath, type:'json'},
        ];
        ReScatter.dataModel.dataCache.loadFiles(filesAndTypes,
            function() {
                let regionIdData = ReScatter.dataModel.dataCache.getFromCache(self.regionsIndexPath);
                let propsData = ReScatter.dataModel.dataCache.getFromCache(self.propsPath);
                self.locatorRoot = document.body.querySelector('#' + self.svgId);
                self.locatorRoot.oncontextmenu = self.onContextEvent.bind(self);
                self.annotateRoot = $('#' + self.annotateId);
                // extract the ordered array of region ids
                self.__loadRegionMap(regionIdData);
                self.props = {};
                // TODO assuming the props is a hierarchical ontology
                // place this elsewhere.
                self.__flattenOntology(propsData, self.props);
                self.view.loadPleth();
                ReScatter.thematicMapController.loadImages(self.preselect);
                toolTipController.addTooltip(self.svgId, 'IMEChoropleth', 'left');
                self.dispatchLoadedEvent(self);
            }
        );
    }

    destroy () {
        'use strict';
        if (ReScatter.selectionModel) {
            ReScatter.selectionModel.removeObserver(this);
        }
        if (self.locatorRoot) {
            self.locatorRoot.innerHTML = '';
        }
    }

    __addMouseEventsToSvg () {
        let mouseoverFn = this.mouseoverSvgRegion.bind(this);
        let mouseoutFn = this.mouseoutSvgRegion.bind(this);
        let clickFn = this.clickSvgRegion.bind(this);
        let keys = Object.keys(this.props);
        keys.map(function(key){
            let svgRegions = this.locatorRoot.querySelectorAll('path[structure_id="' + key + '"]');
            for (let i=0; i< svgRegions.length; ++i) {
                let path = svgRegions[i];
                path.onclick = clickFn;
                path.onmouseover = mouseoverFn;
                path.onmouseout = mouseoutFn;
            }
        }, this);
    }

    __loadRegionMap (regionMap) {
        this.regionsOrdered = [];
        this.regionMaps = {};
        regionMap.ordered_region_map.forEach(function(val) {
            this.regionsOrdered.push(val[0]);
            this.regionMaps[val[0]] = val[1];
        }, this);
    }

    /**
     * Function to handle mouse over of the svg region - this triggers an annotation.
     * @param event
     */
    mouseoverSvgRegion (event) {
        let regionId = event.currentTarget.attributes.structure_id;
        let props = this.props[regionId.value];
        let keys = Object.keys(props);
        let table = '<table>';
        let filterList = this.popupAttributeList;
        keys.map(function(key){
            if (filterList.indexOf(key) >= 0 ) {
                table += '<tr><td>' +
                    key + '&nbsp;</td><td style=\'word-wrap:break-word\'>' + props[key] + '&nbsp;</td></tr>';
            }
        });
        table += '</table>';
        this.inSvgRegion = true;
        this.annotateRoot.html(table);
        this.annotateRoot.css({'display': 'inline',
            'top': event.clientY - 50,
            'left': event.clientX - 400,
            'position': 'fixed',
            'z-index': '999',
            'color': '#fff',
            'background-color': '#000',
            'opacity': '0.6',
            'text-align': 'left',
            'table-layout': ' fixed',
            'width': '350'});
    }

    /**
     * Function to handle mouse over of the svg region - this removes the annotation.
     * @param event
     */
    mouseoutSvgRegion () {
        let self = this;
        this.inSvgRegion = false;
        setTimeout(
            function() {
                if (!self.inSvgRegion) {
                    self.annotateRoot.css('display', 'none');
                }
            }, 100);
    }


    clickSvgRegion (event) {
        let regionId = event.currentTarget.attributes.structure_id;
        this.__peformRegionSelection(regionId.value, event.ctrlKey);
    }

    onContextEvent (event) {
        event.preventDefault(); // disable the original context menu
        console.log('Saving SVGs as thematicmap_N.png');
        SnapShotController.snapShotSelected(this.view);
        event.stopPropagation();
    }

    __peformRegionSelection (regionId, addSelection) {
        if (!addSelection) {
            this.selectedIds = [];
            this.view.clearPlethColors();
        }
        this.selectedIds.push(regionId);
        // map to sample ids
        let mappedIds = this.__mapSelectedRegionIds();
        if (mappedIds.length > 0) {
            ReScatter.dynamicSelectionModel.putTransitiveSelection(
                'ThematicMap',
                mappedIds,
                0x772222,
                this.dynamicSelectionOut);
        }
    }

    __mapSelectedRegionIds () {
        // Use the regionMaps (the mapping from choropleth to the sample
        // axis) to create a list of selected samples.
        let sampleIds = [];
        this.selectedIds.forEach(function(id) {
            if (Object.prototype.hasOwnProperty.call(this.regionMaps, id)) {
                Array.prototype.push.apply(sampleIds, this.regionMaps[id]);
            }
        }, this);
        return sampleIds.reduce(function(arr, val) {
            if (arr.indexOf(val) === -1) {
                arr.push(val);
            }
            return arr;
        }, []);
    }

    /**
     * @private
     * Flatten a hierarchical ontology containing 'children' sub trees
     * @param ontObj
     * @param flatMap
     * @private
     */
    __flattenOntology (ontObj, flatMap) {
        let firstObj = ontObj.msg[0];
        this.__flattenOntChildren(firstObj, flatMap);
    }

    /**
     * @private
     * Recursive function to flatten an ontology with a 'children' key
     */
    __flattenOntChildren (ontLevel, flatMap) {
        let keys = Object.keys(ontLevel);
        let levelObj = {};
        if (ontLevel.id !== undefined) {
            // clone the level
            keys.map(function (key) {
                if (key !== 'children') {
                    levelObj[key] = ontLevel[key];
                }
            });
            flatMap[levelObj.id] = levelObj;
        }
        if (ontLevel.children !== undefined) {
            ontLevel.children.map(function (child) {
                this.__flattenOntChildren(child, flatMap);
            }, this);
        }
    }

    // function returns a promise - call appropriately
    __mapProperty (property, dataPoints, selectionMap, selectionProp, sourceProps, result) {
        'use strict';
        let mapOp = selectionMap.propMap[property].mapOp;
        let mapFn = selectionMap.propMap[property].mapFn;
        let self = this;

        //TODO handle failures
        return new Promise(function(resolve /*, reject*/) {
            if (mapOp === undefined) {
                if (mapFn === undefined) {
                    result[property] = dataPoints;
                } else {
                    result[property] = mapFn(dataPoints, self.props, selectionProp, self.regionsOrdered, self.regionMaps, sourceProps);
                    //console.log("Done " + property + " for " + self.id);
                }
                resolve(result);
            } else {
                let dataMapper = ReScatter.data.DataMapper.getDataMap(selectionMap.dataMap);
                dataMapper.mapData(dataPoints, mapOp)
                    .then(function (values) {
                        result[property] = mapFn(values, self.props, selectionProp, self.regionsOrdered, self.regionMaps, sourceProps);
                        //console.log("Done " + property + " for " + self.id);
                        resolve(result);
                    })
                    .catch(function(e) {
                        console.log('Error in choropleth datamapping ' + e);
                        resolve(result);
                    });
            }
        });
    }

    onPlethResize() {
        // forward to the actual view
        this.view.onPlethResize();
    }


    dispatchLoadedEvent (self) {
        ReScatter.controlEventModel.putControlEventModel('rendererLoadComplete', {
            renderer:self,
            rendererId:self.id,
            type:'choropleth'
        });
    }

    /**
     * Add a single svg to the ordered strip of svgs
     * @param svgId - unique id
     * @param svgIndex - ordering index
     * @param svgString - a template sting containing <svgid> used to load the svg
     *                  (<svgid> is replaced by the contents of svgID
     */
    addSvg (svgId, svgIndex, svgString) {
        // A typical brain svg starts with:
        //<svg width="285" height="355" xmlns="http://www.w3.org/2000/svg">

        if (this.isCached(svgIndex)) {
            this.loadedSvgs[svgIndex] = this.cachedSvgs[svgIndex];
            this.refreshLocator();
            this.view.savePlethColors();
            this.reloadLastVisibleSelection();
            return;
        }
        let retrievePath = svgString.replace('<svgid>', svgId);
        let xhr = new XMLHttpRequest();
        xhr.open('GET', retrievePath, true);
        xhr.responseType = 'text'; //i.e. a DOMString
        let self = this;
        let callback = function() {
            self.refreshLocator();
            self.view.savePlethColors();
            self.reloadLastVisibleSelection();
        };
        this.fetchSvg(retrievePath, svgIndex, callback);
    }

    // recursively, asynchronously fetch the SVGs
    // svgIdIndexArray is an array of objects containing
    // the svg id (used for fetching) and the positional index
    // {id: <id>, index <int>}
    /**
     * Add multiple svgs to the ordered strip of svgs
     * @param svgIdIndexArray - consists of {id: <id>, index <int>}
     * @param svgString - a template sting containing <svgid> used to load the svg
     *                  (<svgid> is replaced by the contents of svgID
     */
    addSvgs (svgIdIndexArray, svgString) {
        if (svgIdIndexArray.length === 0) {
            this.view.clearPlethColors();
            this.refreshLocator();
            this.view.savePlethColors();
            this.reloadLastVisibleSelection();
            return;
        }
        let svgIdIndex = svgIdIndexArray.splice(0, 1);
        let retrievePath = svgString.replace('<svgid>', svgIdIndex[0].id);
        let callback = this.addSvgs.bind(this, svgIdIndexArray, svgString);
        this.fetchSvg(retrievePath, svgIdIndex[0].index, callback);
    }

    fetchSvg (retrievePath, svgIndex, callback) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', retrievePath, true);
        xhr.responseType = 'text'; //i.e. a DOMString
        let self = this;
        xhr.onload = function () {
            // fix the width and viewbox to allow scaling, inject a namespace to allow data storage in private attributes
            let scalableSvg = this.response.replace(/width="(\d*)" height="(\d*)"/, 'xmlns:iedata="http://www.brainscope.nl/brainscope" width="100%" viewbox="0 0 $1 $2"' );
            self.loadedSvgs[svgIndex] = scalableSvg;
            self.cachedSvgs[svgIndex] = scalableSvg;
            callback();
        };
        xhr.onerror = function(e) {
            alert('Error Loading SVG From source URL: ' + retrievePath + ' ' + e.target.status);
            callback();
        };
        //console.log("XHR get Data Map: " + self.filePath);
        this.displayLoading();
        xhr.send();
    }

    removeSvg (svgId) {
        delete this.loadedSvgs[svgId];
        this.refreshLocator();
        this.reloadLastVisibleSelection();
    }

    isCached (svgId) {
        return (this.cachedSvgs[svgId] !== undefined);
    }

    displayLoading () {
        this.locatorRoot.innerHTML = '<h4>Loading vector images</h4>';
    }

    refreshLocator () {
        this.locatorRoot.innerHTML = '';
        let docfrag = document.createDocumentFragment();
        let keys = Object.keys(this.loadedSvgs);
        keys.sort(function(a,b) {
            let x = parseInt(a);
            let y = parseInt(b);
            return x === y ? 0 : x > y ? 1 : -1;
        });
        keys.forEach(function(elem) {
            let newDiv = document.createElement('div');
            newDiv.innerHTML = this.loadedSvgs[elem];
            docfrag.appendChild(newDiv);
        }, this);
        this.locatorRoot.appendChild(docfrag);
        this.__addMouseEventsToSvg();
    }

    reloadLastVisibleSelection () {
        if (this.lastVisibleSelectionContext) {
            this.processSelectionEvent(this.lastVisibleSelectionContext);
        }
    }

}

SelectionProtocol.impl(ChoroplethController, [], {
    /**
     * A choropleth has a single property that is mapped in selection events - color
     * This applies the configured standard mapOp (a simple ROW/COLUMN operation) and mapFn
     * (a javascript function that can map more complex behaviour
     * @param context
     */
    processSelectionEvent (context) {
        'use strict';
        let selectionMap;
        if (context.type === 'dyna') {
            selectionMap = this.dynamicSelectionIn[context.id];
        } else {
            selectionMap = this.selectionIn[context.id];
        }
        if (selectionMap === undefined) {this.processingDone(); return;} // we are not subscribed to this selection
        if ((context.op === 'show') ||
            ((context.op === 'create') && (context.type === 'dyna'))) {
            this.lastVisibleSelectionContext = context;
            //console.log("Choropleth select " + context.op + " in: " + this.id);
            // Start a potentially asynchronous chain with a resolved promise (future)
            // For choropleths on the property color is mappable
            let sequence = Promise.resolve({color: undefined});
            let self = this;
            let dataPoints = context.sel.dataPoints;
            let color = context.sel.color;
            let sourceProps = context.sel.sourceProps;
            sequence
                .then(function(result){
                    return self.__mapProperty('color',
                        dataPoints,
                        selectionMap,
                        color,
                        sourceProps,
                        result);})
                .then(function(result) {
                    self.view.clearPlethColors();
                    self.view.setPlethColorsFromMap(result.color);
                    if (context.type !== 'dyna') {
                        self.lastColorSet = $.extend(true, {}, result.color);
                    }
                    self.processingDone();
                })
                .catch(function(e) {
                    console.log('Error adding selection:' + e);
                    self.processingDone();
                });
        } else if ((context.op === 'delete') && (context.type === 'dyna')) {
            // only on dynamic selection
            this.lastVisibleSelectionContext = undefined;
            this.view.clearPlethColors();
            if (this.lastColorSet !== undefined) {
                this.view.setPlethColorsFromMap(this.lastColorSet);
            } else {
                this.view.restorePlethColors();
            }
            //} else if (context.hasOwnProperty('color')) { //TODO - add option to change color map
        } else if (context.op === 'hide') {
            this.lastVisibleSelectionContext = undefined;
            this.lastColorSet = undefined;
            this.view.clearPlethColors();
            this.view.restorePlethColors();
        } else if ((context.op === 'delete') && (context.type !== 'dyna')) {
            this.lastColorSet = undefined;
        }
        this.processingDone();
    }
});

ControlProtocol.impl(ChoroplethController, [], {
    onControlEvent(/*eventContext*/) {
        return; // not coupled to any control events
    }
});
export default ChoroplethController;
