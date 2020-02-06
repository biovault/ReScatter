import Layout from './layout/Layout';

//TODO complete this refactoring - currently unused
export default class ConfigModel {
    static instance;

    constructor(configData) {
        if (this.instance) {
            if (configData) {
                this.instance.__init(configData);
            }
            return this.instance;
        }
        this.__init(configData);
        this.instance = this;
    }

    __init(configData) {
        this.configData = configData;
        this.loadedlayouts = {};
        this.activeLayout = undefined;
    }

    loadLayout(id) {
        if (Object.keys(this.loadedlayouts).includes(id)) {
            this.loadedlayouts[id] = new Layout(this.configData[id]);
        }
        this.activeLayout = this.loadedlayouts[id];
    }

    __loadDataMaps() {

    }
}
