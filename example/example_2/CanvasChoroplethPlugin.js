/**
 * Created by bvanlew on 7-2-18.
 * Demonstrated how to build a fast response choropleth based
 * on the HTML5 canvas. For ease of implementation the excellent
 * Konva.js library is used (see https://konvajs.github.io/)
 *
 */
import Konva from 'konva';

export default class CanvasChoroplethPlugin {

    /**
     * Required override to initialize the plugin
     * @param params
     */
    constructor(containerId) {
        this.containerId = containerId;
        this.gridSize = 28;
        this.rectangles = new Map();
        this.stage_width = 1000;
        this.stage_height = 1000;
        this.rect_width = 1000/this.gridSize;
        this.rect_height = 1000/this.gridSize;
        this.defaultColor = 'snow';
        this.savedColors = [];
    }



    __fitStageIntoParentContainer() {
        var container = document.querySelector('#' + this.containerId);

        // now we need to fit stage into parent
        var containerWidth = container.offsetWidth;
        // to do this we need to scale the stage
        var scale = containerWidth / this.stage_width;


        this.stage.width(this.stage_width * scale);
        this.stage.height(this.stage_height * scale);
        this.stage.scale({ x: scale, y: scale });
        this.stage.draw();
    }
}

ReScatter.protocols.ChoroplethProtocol.impl(CanvasChoroplethPlugin, [], {
    /**
     * Required override to allow choropleth resize
     */
    onPlethResize() {
        this.__fitStageIntoParentContainer();
    },

    /**
     * Required override to load (or in this case draw) the
     * base choropleth image
     */
    loadPleth() {
        this.stage = new Konva.Stage({
            container: this.containerId,
            width: this.stage_width,
            height: this.stage_height
        });
        this.layer = new Konva.Layer();


        for (let row_idx of Array.from(Array(this.gridSize).keys())) {
            for (let col_idx of Array.from(Array(this.gridSize).keys())) {
                let index = this.gridSize * row_idx + col_idx;
                let rect = new Konva.Rect({
                    fill: 'green',
                    stroke: 'black',
                    x: this.rect_width * col_idx,
                    y: this.rect_height * row_idx,
                    width: this.rect_width,
                    height: this.rect_height
                });
                this.layer.add(rect);
                this.rectangles.set(String(index), rect);
            }
        }
        this.stage.add(this.layer);


        this.__fitStageIntoParentContainer();
        window.addEventListener('resize', this.__fitStageIntoParentContainer);
    },

    /**
     * Required override to reset the choroplet region colors to the defaults(s)
     */
    clearPlethColors () {
        this.rectangles.forEach(val => {
            val.fill(this.defaultColor);
        });
        this.layer.draw();
    },

    /**
     * Required override to save the current choropleth colors to
     * allow later restore (this is needed for dynamic selections over a
     * static selection)
     */
    savePlethColors () {
        this.savedColors = [];
        this.rectangles.forEach(() => {
            this.savedColors.push(this.defaultColor);
        });
    },

    /**
     * Required override to restore the saved choropleth colors.
     */
    restorePlethColors () {
        this.rectangles.forEach((val, idx) => {
            val.fill(this.savedColors[idx]);
        });
        this.layer.draw();
    },

    /**
     * Required override to set the choropleth colors based
     * on a region map. The map contains the region "id"s, in this
     * cast the string representation of the numbers 0-783 and the
     * corresponding color. In this code we allow for the color as a CSS
     * string or RGB integer.
     * @param colorMap
     */
    setPlethColorsFromMap (colorMap) {
        let convert = x => x;
        // allow numeric RGB values
        if (typeof(colorMap[0]) === 'number') {
            convert = (x) => {return '#' + x.toString(16);};
        }
        let regions = Object.keys(colorMap);
        regions.map(regionId => {
            this.rectangles.get(regionId).fill(convert(colorMap[regionId]));
        });
        this.layer.draw();
    }
});

// Implement a snapshot protocol to allow screen capture
ReScatter.protocols.SnapshotProtocolForCanvas.impl(CanvasChoroplethPlugin, [], {
    getNumberofCanvases() {
        return 1; // We have a single canvas
    },

    getCanvasNameAtIndex(/*index*/) {
        return 'MnistPixelGrid';
    },

    getCanvasAtIndex(/*index*/) {
        return this.layer.getCanvas()._canvas; // Return the canvas used by the drawing library
    }
});

