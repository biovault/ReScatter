/*
 * ES6 Port 11/07/2017
 */
let instance = null;
export default class GaussianDistCanvas  {
    /** @class GaussianDistCanvas is a singleton  that
     * creates a gaussian dist on a canvas that can be used a sprite texture.
     * The class is a private helper for KDETexture.
     * It could probably be done faster using WebGL
     * The class contains now unused functionality to tweak rendering levels nd width that used to be
     * use to manipulate the final KDE. This is now handled in WebGL
     *
     * @param mean - usually 0
     * @param level - a brightness level (between 1 and 50)
     * @param stddev - or sigma use between 1 and 50
     * @param scaleFactor - should be the parent window divided by a constant factor. Scales the texture
     * @param width - how many standard deviations wid should the texture be (use at least 8 for a smooth result)
     * @constructor
     */
    constructor(mean, level, stddev, scaleFactor, width) {
        if (instance) {
            return instance;
        }
        instance = this;
        this._width = width; // visible smoother result than using 3 stdevs
        this._mean = mean;
        this._level = level;
        this._displayStdDev = stddev;
        this._scaleFactor = scaleFactor;
        this.rawCanvas = document.createElement('canvas'); // my offscreen canvas
        this.stddevOrScaleChanged();
        this.calculatePdf();
    }

    get pdf() {
        if (this.done) {
            return this._pdf;
        }
        this.calculatePdf();
        return this._pdf;
    }

    get canvas () {
        let ctx = this.rawCanvas.getContext('2d');
        ctx.fillRect(0, 0, this._canvasWidth, this._canvasWidth);
        let imgData = ctx.getImageData(0, 0, this._canvasWidth, this._canvasWidth);
        let data = imgData.data;
        if (!this.done) {
            this.calculatePdf();
        }

        for (let i=0; i< this._canvasWidth; i++) {
            let y = this._canvasWidth * 4 * i; // for RGBA
            let q = this._canvasWidth * i;
            for (let j=0; j< this._canvasWidth; j++) {
                let pixVal = Math.round(this._pdf[q + j]);
                data[y + j*4] = pixVal;
                data[y + j*4 + 1] = pixVal;
                data[y + j*4 + 2] = pixVal;
                data[y + j*4 + 3] = 256;
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return this.rawCanvas;
    }

    set mean (val) {
        if (this._mean !== val ) {
            this._mean = val;
            this.done = false;
        }
    }

    get mean() {
        return this._mean;
    }

    set level(val) {
        if (this._level !== val) {
            this._level = val;
            this.done = false;
        }
    }

    get level() {
        return this._level;
    }

    set stddev(val) {
        if (this._displayStdDev !== val) {
            this._displayStdDev = val;
            this.stddevOrScaleChanged();
        }
    }

    get stddev() {
        return this._displayStdDev;
    }

    set scaleFactor(val) {
        if (this._scaleFactor !== val) {
            this._scaleFactor = val;
            this.stddevOrScaleChanged();
        }
    }
    get scaleFactor() {
        return this._scaleFactor;
    }

    set width(val) {
        this._width = val;
        this.canvasWidthChanged();
    }
    get width() {
        return this._width;
    }

    calculatePdf() {
        let temp = new Float32Array(this._canvasWidth);
        let halfDim = this._canvasWidth/2;
        for (let i=0; i < this._canvasWidth; i++) {
            let val = 0.5 + i - halfDim;
            temp[i] = this._invdevroot2pi * Math.exp(-Math.pow(val - this._mean, 2) / (2 * this._variance));
        }
        let max = Math.max.apply(null, temp);
        let scale = this._level/(max * max); // scale to mid gray
        for (let n=0; n < this._canvasWidth; n++) {
            let y = n * this._canvasWidth;
            for (let m=0; m < this._canvasWidth; m++) {
                this._pdf[y+m] = scale * temp[n] * temp[m];
            }
        }
        this.done = true;
    }

    stddevOrScaleChanged() {
        this._stddev = Math.round(this._displayStdDev * this._scaleFactor);
        this.canvasWidthChanged();
        this._variance = Math.pow(this._stddev, 2);
        this._invdevroot2pi = 1.0 / (Math.sqrt(2 * Math.PI) * this._stddev);
        this.done = false;
    }

    canvasWidthChanged() {
        let canvasWidth = this._width * this._stddev;
        if (this._canvasWidth !== canvasWidth) {
            this._canvasWidth = canvasWidth;
            this._pdf = new Float32Array(canvasWidth * canvasWidth);
            this.rawCanvas.width = canvasWidth;
            this.rawCanvas.height = canvasWidth;
            this.done = false;
        }
    }
}

