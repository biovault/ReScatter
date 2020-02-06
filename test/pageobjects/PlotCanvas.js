module.exports = class PlotCanvas {
    constructor(canvas) {
        this.canvas = canvas;
    }

    circleMouse(xabs, yabs, canvasOffset) {
        const x = xabs - canvasOffset[0];
        const y = yabs - canvasOffset[1];
        this.canvas.moveTo(x, y);
        browser.pause(80);
        this.canvas.moveTo(x+2, y+2);
        browser.pause(80);
        this.canvas.moveTo(x-2, y+2);
        browser.pause(80);
        this.canvas.moveTo(x-2, y-2);
        browser.pause(80);
        this.canvas.moveTo(x+2, y-2);
        browser.pause(80);
        this.canvas.moveTo(x, y);
        browser.pause(80);
    }

    click() {
        this.canvas.click();
    }

    /**
     * Draw a line as follows (The code is a simplified version of drawPath
     * Mouse down, move to, mouse up
     * @param x0
     * @param y0
     * @param x1
     * @param y1
     */
    drawLine(x0, y0, x1, y1) {
        const ACTION_BUTTON = 0;
        const y0abs = y0;
        const y1abs = y1;
        const x0abs = x0;
        const x1abs = x1;
        console.log(`Drawing: [${x0abs},${y1abs}] [${x1abs},${y1abs}]`);
        // perform draw using W3C
        browser.performActions([{
            type: 'pointer',
            id: 'traceLine',
            parameters: { pointerType: 'mouse' },
            actions: [
                { type: 'pointerMove', duration: 0, x: x0abs, y: y0abs },
                { type: 'pointerDown', button: ACTION_BUTTON },
                { type: 'pause', duration: 100 }, // emulate human pause
                { type: 'pointerMove', duration: 100, x: x1abs, y: y1abs },
                { type: 'pointerUp', button: ACTION_BUTTON },
                { type: 'pause', duration: 500 } // wait for linked plot update
            ]
        }]);
    }

    /**
     * Draw a path as follows
     * Mouse down
     * move to X n
     * mouse up
     * @param pathArray
     */
    drawPath(pathArray) {
        if ((pathArray.length % 2) !== 0) {
            return;
        }
        const ACTION_BUTTON = 0;
        const actionsList = [];
        let pointIdx = 0;
        actionsList.push({ type: 'pointerMove', duration:0, x:pathArray[pointIdx], y:pathArray[pointIdx + 1]});
        actionsList.push({ type: 'pointerDown', button: ACTION_BUTTON });
        actionsList.push({ type: 'pause', duration: 100 });
        for (let i = 2; i < pathArray.length; i+=2) {
            actionsList.push({ type: 'pointerMove', duration: 100, x:pathArray[i], y:pathArray[i + 1] });
        }
        actionsList.push({ type: 'pointerUp', button: ACTION_BUTTON });
        actionsList.push({ type: 'pause', duration: 500 }); // wait for linked plot update)
        browser.performActions([{
            type: 'pointer',
            id: 'tracePath',
            parameters: { pointerType: 'mouse' },
            actions: actionsList
        }]);
    }

};