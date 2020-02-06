//<Class for LUTTexture>
// webpack require.context to get a list of files
// see requireAll @ https://webpack.github.io/docs/context.html
let colormaps = require.context('./colormaps', true, /^\.\/.*\.png$/);
// require all the files
colormaps.keys().map(colormaps);

export default class LUTTexture {
    constructor() {
        this.lutNameGroups = {
            'Diverging maps': ['BrBG', 'bwr', 'coolwarm', 'PiYG', 'PRGn', 'PuOr',
                'RdBu', 'RdGy', 'RdYlBu', 'RdYlGn', 'Spectral', 'seismic'],
            'Perceptually Uniform': ['viridis', 'inferno', 'plasma', 'magma'],
            'Sequential Maps': ['Blues', 'BuGn', 'BuPu',
                'GnBu', 'Greens', 'Greys', 'Oranges', 'OrRd',
                'PuBu', 'PuBuGn', 'PuRd', 'Purples', 'RdPu',
                'Reds', 'YlGn', 'YlGnBu', 'YlOrBr', 'YlOrRd'],
            'Sequential(2) Maps':['afmhot', 'autumn', 'bone', 'cool', 'copper',
                'gist_heat', 'gray', 'hot', 'pink',
                'spring', 'summer', 'winter']
        };
    }

    getLutNameGroups () {
        return this.lutNameGroups;
    }

    getLutTexture(name, callback) {
        let image = new Image();
        image.onload = () => {
            let texture = new PIXI.Texture(new PIXI.BaseTexture(image));
            texture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            callback(texture);
        };
        image.src = colormaps('./' + name + '.png');
    }
}

//</Class for LUTTexture>
