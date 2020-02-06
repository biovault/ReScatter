/**
 * Created by baldur on 8/10/15.
 * Ported to ES6 11/07/17
 */

//import PIXI from 'pixi.js';
import KDETexture from './KDETexture';


//<Class definition for the PointGroupView>
// A viewer component
// The selection view is based on a Pixijs container
// holding sprites for each point.
// A selection view can be hidden or visible.
// When hidden a filter is used to change the point
// colours (perhaps to gray)
// Points can be added or remove from a selection view.

export default class PointGroupView {

    constructor(parentPlot, label,
        selectionsContainer,
        pointSize,
        color,
        scaleFuncX, scaleFuncY,
        zoomFactor) {
        // label: unique text label for this selectiion
        // selectionsRoot: a PIXI.container used to hold all selections
        // pointSize: diameter for the point circle
        // color: an RGB number color used to display points when active
        //        may be undefined in which case each point added should define
        //        its own color
        // TODO provide options for other point shapes other than circle
        // Perhaps change this to the less functional ParticleContainer???
        // - no because the sprites are not interactive
        'use strict';
        this.parentPlot = parentPlot;
        this.label = label;
        //console.log("Adding pointgroupview: "+ label + " to: " + selectionsRoot.parent.renderer.id);
        this.selectionsRoot = selectionsContainer;
        this.container = new PIXI.Container();
        this.container.interactive = false;
        this.container.visible = false;
        this.selectionsRoot.addChild(this.container);
        this.kdeOn = false;
        this.kernelTexture = undefined;
        this.pdf = undefined;
        this.zoomFactor = zoomFactor || 1;
        this.color = color;
        this.pointSize = pointSize;
        this.spriteDrawingScale = 4; // draw sprites texture at a larger scale and scale down

        // Have to draw a background rectangle and circle
        // for correct interaction with the color matrix filter
        this.pointTexture = this.__createPointTexture(pointSize * this.spriteDrawingScale, 0XFFFFFF);
        this.xTexture = this.__createXTexture(pointSize * this.spriteDrawingScale, 0XFFFFFF);
        this.oTexture = this.__createOTexture(pointSize * this.spriteDrawingScale, 0XFFFFFF);
        // It would be possible to combine multiple filters for nice effects
        // but a bit of math means that a single ColorMatrixFilter can just as effective
        // and perhaps more efficient.

        //if (color !== undefined) {
        //    this.activeColorMatrix = this.colorToOverrideMatrix(color);
        //    this.colorFilter = new PIXI.filters.ColorMatrixFilter();
        //    this.colorFilter.matrix = this.activeColorMatrix;
        //    this.container.filters = [this.colorFilter];
        //}
        this.pointSprites = [];
        this.origTextures = [];
        // TODO remove this workaround later?
        // Each sprite point is linked to a sprite point in the underlying parent plot
        // This is largely a workaround to a pixijs bug (in v 3.0.7) where mouse
        // events are not propagated to lower z-index even if the overlying sprites are non-interactive.
        // This link complicates the structure but may have some other advantages.
        // See https://github.com/pixijs/pixi.js/issues/1725
        this.linkedPoints = [];
        this.points = [];
        this.scaleFuncX = scaleFuncX;
        this.scaleFuncY = scaleFuncY;
        //this.outlineFilter = new PIXI.filters.ConvolutionFilter([0,1,0,1,-4,1,0,1,0], 100, 100);
        this.outlineFilter = new PIXI.filters.DropShadowFilter();
        this.outlineFilter.alpha = 1;
        this.outlineFilter.blur = 0;
        this.outlineFilter.distance = 1;
        this.outlineFilter.padding = 2;
        this.outlineFilter.color = 0xFFFFFF;
        //this.setColorOnActive(true, color);
        this.sizeOnActive = false;
    }

    /**
     * Get visibility state of this point group
     * @returns {boolean}
     */
    get visible() {return this.container.visible;}

    /**
     * Set visibility state of this point group
     * @param {boolean} visibility
     */
    set visible(visibility) {this.container.visible = visibility;}

    /**
     * Get state of the outline filter
     * @returns {boolean}
     */
    get outline() {
        return ((this.container.filters !== undefined) &&
        (this.container.filters.indexOf(this.outlineFilter) !== -1));
    }

    /**
     * Set state of the outline filter
     * @param {boolean} val
     */
    set outline(val) {
        if (val) {
            if (this.container.filters) {
                if (this.container.filters.indexOf(self.outlineFilter) === -1) {
                    this.container.filters.push(self.outlineFilter);
                }
            } else {
                this.container.filters = [self.outlineFilter];
            }
        } else {
            let index = this.container.filters.indexOf(this.outlineFilter);
            this.container.filters.splice(index, 1);
        }
    }

    __createPointTexture(pointSize, color) {
        let graphicPoint = new PIXI.Graphics();
        graphicPoint.beginFill(0x000000, 0);
        graphicPoint.drawRect(0, 0, pointSize, pointSize);
        graphicPoint.endFill();
        graphicPoint.beginFill(color, 1);
        graphicPoint.drawCircle(0, 0, pointSize);
        graphicPoint.endFill();
        return graphicPoint.generateTexture(1, PIXI.SCALE_MODES.LINEAR);
    }

    __createXTexture(pointSize/*, color*/) {
        let graphicLine = new PIXI.Graphics();
        graphicLine.lineStyle(2 * this.spriteDrawingScale, 0x000000, 1);
        graphicLine.moveTo(0, 0);
        graphicLine.lineTo(pointSize, pointSize);
        graphicLine.moveTo(pointSize, 0);
        graphicLine.lineTo(0, pointSize);

        return graphicLine.generateTexture(1, PIXI.SCALE_MODES.LINEAR);
    }

    __createOTexture(pointSize, color) {
        let graphicCircle = new PIXI.Graphics();
        graphicCircle.beginFill(0x000000, 1);
        graphicCircle.drawRect(-pointSize, -pointSize, 2 * pointSize, 2 * pointSize);
        graphicCircle.endFill();
        graphicCircle.lineStyle(2 * this.spriteDrawingScale, color, 1);
        graphicCircle.drawCircle(0, 0, pointSize + 2);
        return graphicCircle.generateTexture(1, PIXI.SCALE_MODES.LINEAR);
    }

    destroy(){
        'use strict';
        for (let i = 0, len = this.pointSprites.length; i<len ; i++) {
            this.container.removeChild(this.pointSprites[i]);
            this.pointSprites[i].destroy();
        }
        this.container = undefined;
        this.pointSprites = [];
        this.points = [];
        this.pointTexture = undefined;
    }

    colorToOverrideMatrix(color) {
        'use strict';
        let r = (0xFF0000 & color) >> 16;
        let g = (0x00FF00 & color) >> 8;
        let b = (0x0000FF & color);
        // the color matrix changes a white (the point color) to the desired color
        return [
            r/255, 0, 0, 0, 0,
            0, g/255, 0, 0, 0,
            0, 0, b/255, 0, 0,
            0, 0, 0, 1, 0
        ];
    }

    colorToInactiveOverrideMatrix(color) {
        'use strict';
        let r = (0xFF0000 & color) >> 16;
        let g = (0x00FF00 & color) >> 8;
        let b = (0x0000FF & color);
        let luminosity = (0.21 * r/255) + (0.72 * g/255) + (0.07 * b/255);
        // the color matrix changes a white (the point color) to the desired color
        return [
            luminosity, 0, 0, 0, 0,
            0, luminosity, 0, 0, 0,
            0, 0, luminosity, 0, 0,
            0, 0, 0, 1, 0
        ];
    }

    colorToLuminanceMatrix() {
        'use strict';

        // Convert color to equivalent luminance
        // only correct in certain color spaces
        return [
            0.21, 0.72, 0.07, 0, 0,
            0.21, 0.72, 0.07, 0, 0,
            0.21, 0.72, 0.07, 0, 0,
            0, 0, 0, 1, 0
        ];
    }

    colorPreserveMatrix (/*color*/) {
        'use strict';

        // the color matrix replaces any color
        return [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0
        ];
    }

    pointOver (interactionData) {
        let target = interactionData.target;
        let index = this.pointSprites.indexOf(target);
        if (index > -1) {
            let linkedPoint = this.linkedPoints[index];
            if (linkedPoint) {
                this.parentPlot.annotatePoint(this.linkedPoints[index]);
            }
        }
    }

    /**
     * Add a point with
     * @param {x:<x-coord> , y:<y-coord> } point object
     * @param {number | undefined} RGB color, if undefined group color is used
     * @param {number | undefined} size, if undefined group size is used
     * @param {string} texture - a single character code describing the point shaps (currently X, O - default is a filled circle)
     * @param linkedPoint - the corresponding point in the parent plot mousOver events are forwarded to this
     * @returns {PIXI.Sprite} - the sprite that was created
     */
    addPoint(point, color, size, texture, linkedPoint) {
        'use strict';

        let pointSprite;
        if (texture === 'X') {
            pointSprite = new PIXI.Sprite(this.xTexture);
        } else if (texture === 'O') {
            pointSprite = new PIXI.Sprite(this.oTexture);
        } else{
            pointSprite = new PIXI.Sprite(this.pointTexture);
        }
        pointSprite.anchor.x = 0.5;
        pointSprite.anchor.y = 0.5;
        pointSprite.position.x = this.scaleFuncX(point.x);
        pointSprite.position.y = this.scaleFuncY(point.y);
        pointSprite.interactive = true;
        pointSprite.point = point;
        // Note: tried to use the filters with color matrix filter on individual points
        // to apply point by point color but this overloads the GPU. Tint works.
        // TODO investigate this problem further

        pointSprite.tint = color || this.color;

        pointSprite.scale = {x: (size || 1) / (this.spriteDrawingScale * this.zoomFactor), y: (size || 1) / (this.spriteDrawingScale * this.zoomFactor)};
        pointSprite.pointSize = size || 1;

        this.container.addChild(pointSprite);
        this.pointSprites.push(pointSprite);
        this.origTextures.push(pointSprite.texture);
        this.linkedPoints.push(linkedPoint);
        this.points.push(point);
        return pointSprite;
    }

    /**
     * Zoom the plot to the given zoom factor. Sprite sizes are corrected automatically.
     * @param zoomFactor
     */
    zoom(zoomFactor) {
        let self = this;
        this.zoomFactor = zoomFactor;
        this.pointSprites.forEach(function(val/*, indx, array*/) {
            val.scale = {
                x: val.pointSize/(zoomFactor * self.spriteDrawingScale),
                y: val.pointSize/(zoomFactor * self.spriteDrawingScale)
            };
        });
    }

    /** Change the sprite texture to a Gaussian PDF with additive blending
     * this results in a quick and dirty kernel density estimate.
     * @param level     brightness level  - couple to a user control with values between 1 and 50
     * @param stddev    standard deviation sigma  - couple to a user control with values between 1 and 50
     */
    setKdeOn (stddev, contours) {

        if (this.kdeOn) {return;}
        this.kdeOn = true;
        this.__addKDEToContainer(stddev, contours);
        return;
    }

    /**
     * Refresh the gaussian with new stddev (sigma)  and contours values
     * @param {number} stddev - gaussian width in plot units.
     * @param {number} contours - number of render levels
     */
    updateKde (stddev, contours) {
        this.refreshKDE(stddev, contours);
        return;
    }

    /**
     * The kernel density estimate is hidden by restoring the original point sprite textures
     */
    setKdeOff () {

        this.kdeOn = false;
        this.__removeKDEFromContainer();
        return;
    }

    /** Return an object containing the sigma and contours values as properties
     * @returns {{activate: boolean, sigma: number, contours: number}}
     * Default values of sigma -12 and countours 32 are hardcoded here - could be configurable
     */
    kdeValues () {
        let result = {activate: this.kdeOn, sigma: 12, contours:32};
        if (this.kdeTexture) {
            result.sigma = this.kdeTexture.stddev;
            result.contours = this.kdeTexture.contours;
        }
        return result;
    }

    /**
     * Remove the point sprite from the group
     * @param point
     */
    removePoint (point) {
        'use strict';
        let index = this.points.indexOf(point);
        let sprite = this.pointSprites[index];
        this.container.removeChild(sprite);
        this.points.splice(index, 1);
        this.pointSprites.splice(index, 1);
    }

    /**
     * Set all ths points in this group to the give color
     * @param {number} color - RGB
     */
    setColor (color) {
        'use strict';
        // ignored if coloring is not on group
        this.container.children.map(function(childSprite) {childSprite.tint = color;});
        //if (this.color !== undefined) {
        //    this.activeColorMatrix = this.colorToOverrideMatrix(color);
        //    this.colorFilter = new PIXI.filters.ColorMatrixFilter();
        //    this.colorFilter.matrix = this.activeColorMatrix;
        //    this.container.filters = [this.colorFilter];
        //    this.color = color;
        //}
    }

    /**
     * Set the opacity of all the point sprites in this group
     * @param alpha
     */
    setAlpha (alpha) {
        'use strict';
        // ignored if coloring is not on group
        this.container.alpha = alpha;
    }

    showBlur () {
        // test function
    }

    hideBlur () {
        // test function
    }

    /**
     * Initialize the KDE texture
     */
    __setupKDETexture () {
        this.kdeTexture = new KDETexture(this.parentPlot.renderer,
            this.parentPlot.plotSize, this.parentPlot.plotWindowSize);
        let coordArray = new Float32Array(2 * this.pointSprites.length);
        this.pointSprites.forEach(function(value, index/*, array*/) {
            coordArray[2*index] = value.position.x ;
            coordArray[2*index + 1] = value.position.y;
        });
        this.kdeTexture.setPoints(coordArray);
    }

    /**
     * Show a KDE underlay (i.e. lowest in z-order) an hide points (point opacity is set to 0) but point
     * interaction is still possible. The KDE has a discretized number of render levels given by contours
     * @param stddev
     * @param contours
     */
    __addKDEToContainer (stddev, contours) {
        if (this.kdeTexture === undefined) {
            this.__setupKDETexture();
        }

        let texture = this.kdeTexture.draw(stddev, contours);

        // simply render the KDE texture along with the other point sprites
        // place at the bottom of the z-stack (index 0) to permit other
        // sprite interactions to work and set the other sprites alpha to 0
        // to make them transparent
        // The sizing and positioning is performed in the original plot
        // coordinates.
        this.kdeSprite = new PIXI.Sprite(texture);
        this.kdeSprite.anchor.x = 0.5;
        this.kdeSprite.anchor.y = 0.5;
        this.kdeSprite.position.x = this.parentPlot.plotSize/2;
        this.kdeSprite.position.y = this.parentPlot.plotSize/2;
        this.kdeSprite.alpha = 1;
        this.kdeSprite.interactive = false;
        this.kdeSprite.visible = true;
        this.kdeSprite.width = this.parentPlot.plotSize;
        this.kdeSprite.height = this.parentPlot.plotSize;
        this.container.addChild(this.kdeSprite);
        this.container.setChildIndex(this.kdeSprite, 0); //push to bottom of stack to allow interaction

        this.pointSprites.forEach(function(sprite/*, index, array*/) {
            sprite.alpha = 0.0;
        });
    }

    /**
     * Update the KDE underlay with the new stdev and level values
     * @param stddev - gaussian width
     * @param contours - number of render levels
     */
    refreshKDE (stddev, contours) {
        this.container.removeChild(this.kdeSprite);
        this.__addKDEToContainer(stddev, contours);
    }

    /**
     * Hide he KDE underlay and restore the point visibility.
     */
    __removeKDEFromContainer () {
        this.container.removeChild(this.kdeSprite);
        this.pointSprites.forEach(function(sprite/*, index, array*/) {
            sprite.alpha = 1;
        });
        //this.parentPlot.render();
    }

}
//</Class definition for the PointGroupView>
