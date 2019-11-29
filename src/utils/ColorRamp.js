/**
 * Created by baldur on 25-11-16.
 * Migrated to ES6 10-07-17
 */

//<Class definition for the ColorRamp>
/**
 * Map a numeric range to a color interval.
 * Color intervals are restricted to RGB for now
 * TODO extend color intervals to support HSV
 */
export default class ColorRamp  {

    static get InterpolationEnum() {return {
        RGB: 0,
        HSV: 1
    };}

    constructor() {
        this._range = [0, 255];
        this._colorArray = [0xFF0000, 0xFFFFFF, 0x0000FF];
        this._intervals = [];
    };

    /**
     * Get the currently defined numeric range
     * @returns {[number, number]}
     */
    get range() {
        return this._range;
    };

    /**
     * Set a new numeric range to map
     * @param {[number, number]} newRange - array containing a lower and upper bound for the range
     */
    set range(newRange) {
        if (newRange.length !== 2) {
            return;
        }
        if (newRange[1] <= newRange[0]) {
            return;
        }
        this._range = newRange;
        this._refreshColorIntervals();
    };

    /**
     * Get the currently defined color intervals
     * @returns {Array<number>}
     */
    get colorIntervals() {
        return this._colorArray;
    };

    /**
     * Set array of RGB colors to use as interpolation intervals.
     * At least one RGB color is required.
     * @param {Array<number>} rgbArray One or more RGB colours (0x000000 - 0xFFFFFF) to interpolate
     */
    set colorIntervals(rgbArray) {
        // validate
        rgbArray.map(function(val){ return Math.round(val);});
        rgbArray.forEach(function(val) {
            if (0 > val || val > 0xFFFFFF) {
                throw(new Error('Color value outside RGB range'));
            }
        });
        this._colorArray = rgbArray;
        this._refreshColorIntervals();
    };

    /**
     * Get the color coresponding to the value
     * @param val
     * @returns {number} RGB value
     */
    getColorInRange(val /*, interpolationEnum*/) { /*@param interpolationEnum - currently ignored*/
        if (val < this._range[0]) {
            val = this._range[0];
        }

        if (val > this._range[1]) {
            val = this._range[1];
        }
        //var inter = interpolationEnum || this.InterpolationEnum.ColorRamp.RGB;
        // currently HSV is not implemented
        return this._rgbInterpolate(val);

    };

    // The colors are simply linearily interpolated on RGB
    _rgbInterpolate(val) {
        // simply interpolate the rgb values
        // based on the current subrange
        let rsize = this._range[1] - this._range[0];
        let numIntervals = this._colorArray.length - 1;
        let offset = (val - this._range[0]);
        let interval = (offset < rsize) ? Math.floor((offset/rsize) * numIntervals) : numIntervals - 1;

        let cInt = this._intervals[interval];
        let subRange = rsize/numIntervals;
        let subOffset = offset - (subRange * interval);
        return  ((cInt.cr + Math.round(cInt.crStep * subOffset)) << 16) |
                ((cInt.cg + Math.round(cInt.cgStep * subOffset)) << 8) |
                (cInt.cb + Math.round(cInt.cbStep * subOffset));
    };

    // The colors are simply linearily interpolated on Hue (HSV space)
    // TODO hsv Interpolation
    _hsvInterpolate() {

    };

    _refreshColorIntervals() {
        let rsize = this._range[1] - this._range[0];
        let numIntervals = this._colorArray.length - 1;
        if (numIntervals < 1) {
            return;
        }
        let subRange = rsize/numIntervals;
        this._intervals = new Array(numIntervals);
        // for now just the rgb steps
        for (let i = 0; i < numIntervals; i++) {
            let c0 = this._colorArray[i];
            let c0r = (c0 & 0xFF0000) >>> 16;
            let c0g = (c0 & 0x00FF00) >>> 8;
            let c0b = (c0 & 0x0000FF);
            let c1 = this._colorArray[i + 1];
            let c1r = (c1 & 0xFF0000) >>> 16;
            let c1g = (c1 & 0x00FF00) >>> 8;
            let c1b = c1 & 0x0000FF;
            this._intervals[i] = {
                c: c0,
                cr: c0r,
                crStep : (c1r - c0r)/subRange,
                cg: c0g,
                cgStep : (c1g - c0g)/subRange,
                cb: c0b,
                cbStep : (c1b - c0b)/subRange,
            }
        }

    }

};
