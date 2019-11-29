import PointGroupView from '../../view/plot/PointGroupView';

const ndarray = require('ndarray');
const ndops = require('ndarray-ops');


export default class SimplePlotController {
    /**
     * Make a square scatter plot at the DOM element indicated by the ID
     * @param elementId
     */
    constructor(elementId,  forceCanvasRenderer = false) {
        this.elementId = elementId;
        this.plotElement = $('#' + this.elementId)[0];
        this.plotWindowSize = this.plotElement.clientWidth;
        this.renderer = PIXI.autoDetectRenderer(this.plotWindowSize,
            this.plotWindowSize,
            {autoResize: true, forceFXAA: true, preserveDrawingBuffer:true},
            forceCanvasRenderer);
        this.plotElement.appendChild(this.renderer.view);
        this.plotRoot = new PIXI.Container();
        this.plotRoot.interactive = true;
        this.plotRoot.visible = true;
        this.pointSprites;
    }

    /**
     * Get the max and min X and Y coords in the coordArray
     * @param pointCoords - array [x0, y0, x1, y1, ...xi, yi] where i is number of points
     * @returns {{maxX: *, maxY: *, minX: *, minY: *}}
     */
    setScaling(pointCoords) {
        const coordArray = ndarray(pointCoords, [this.numPoints, 2]);
        let ranges =  {
            maxX: ndops.sup(coordArray.pick(null, 0)),
            maxY: ndops.sup(coordArray.pick(null, 1)),
            minX: ndops.inf(coordArray.pick(null, 0)),
            minY: ndops.inf(coordArray.pick(null, 1))
        };
        let rangeX = ranges.maxX - ranges.minX;
        let rangeY = ranges.maxY - ranges.minY;
        const padding = 10;
        this.yScaleFunc = y => {
            return ((y - ranges.minY) * ((this.plotWindowSize - 2 * padding) / rangeY)) + padding;
        };
        this.xScaleFunc = x => {
            return ((x - ranges.minX) * ((this.plotWindowSize - 2 * padding) / rangeX)) + padding;
        };
    }
    /**
     * Display the plot using a single color and background color
     * @param points - array [x0, y0, x1, y1, ...xi, yi] where i is number of points
     * @param pointSize - diameter of point sprite
     * @param pointColor - color of point sprite
     * @param backgroundColor - plot background
     */
    plotPoints (pointCoords, pointSize, pointColor/*, backgroundColor*/) {
        this.numPoints = pointCoords.length/2;
        this.setScaling(pointCoords);
        if (this.pointSprites && this.pointSprites.length > 0) {
            this.movePoints(pointCoords);
            return;
        }
        this.pointSprites = new Array(this.numPoints);

        this.pointGroup =  new PointGroupView(
            this,
            'plot_' + this.elementId,
            this.plotRoot,
            3, 0x808080,
            this.xScaleFunc, this.yScaleFunc,
            null);
        this.pointGroup.visible = false;
        for (let i=0; i < this.numPoints; i++) {
            this.pointSprites[i] = this.pointGroup.addPoint({x:pointCoords[2*i], y:pointCoords[2*i + 1]},
                pointColor);
        }
        this.pointGroup.visible = true;
        this.renderer.render(this.plotRoot);
    }

    /**
     * Move the point sprites to the new coords
     * @param pointCoords
     */
    movePoints(pointCoords) {
        this.pointGroup.visible = false;
        for (let i=0; i < this.numPoints; i++) {
            this.pointSprites[i].position.x = this.xScaleFunc(pointCoords[i*2]);
            this.pointSprites[i].position.y = this.yScaleFunc(pointCoords[i*2 + 1]);
        }
        this.pointGroup.visible = true;
        this.renderer.render(this.plotRoot);
    }

    render() {
        if (this.renderer.gl) {
            this.renderer.render(this.plotRoot);
        }
    }
}
