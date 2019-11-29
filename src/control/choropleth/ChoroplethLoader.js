/**
 * Created by baldur on 03/01/16.
 * Ported to ES6 by bvanlew on 21-7-17.
 */
import SimpleChoroplethLoader from './SimpleChoroplethLoader';
import ImageStripChoroplethLoader from './ImageStripChoroplethLoader';
import ChoroplethController from './ChoroplethController';
import SnapShotController from "../snapshot/SnapShotController";
import ChoroplethSVGView from "../../view/choropleth/ChoroplethSVGView";
/*
 * Was ThematicMapController coordinates the choropleth loader type (either SIMPLE_LOADER or IMAGE_STRIP_LOADER)
 * and the SVGChoropleth object responsible for handling the selection/display effect logic.
 * TODO Refactor to a singleton.
 */
export default class ChoroplethLoader{

    static get LoaderType() {return  {
        SIMPLE_LOADER: 0,
        IMAGE_STRIP_LOADER: 1
    };}
    /**
     *
     * @param plethDescrip - the choropleth definition from the configuration
     * @param choroplethContainerId - the id of theHTML element that will be the conteiner for the choropleth widgte
     * @param choroAnnotationContainerId - the id for the div where mouse over popups (annotation) of the choropleth will be placed
     * @param choroImageStripContainerId - id for the div where the choropleth thumbnails are placed
     * @returns {*}
     */
    constructor(plethDescrip, choroplethContainerId, choroAnnotationContainerId, choroImageStripContainerId) {


        // TODO should this be a parameter
        this.containerId = choroplethContainerId;
        this.annotationId = choroAnnotationContainerId;
        this.imageStripId = choroImageStripContainerId;
        this.loaderType = null;
        "use strict";
        switch (plethDescrip.type) {
            case ChoroplethLoader.LoaderType.SIMPLE_LOADER:
                this.loader = new SimpleChoroplethLoader(plethDescrip.svgTemplate, plethDescrip.svgList);
                this.loaderType = ChoroplethLoader.LoaderTypes.SIMPLE_LOADER;
                break;
            case ChoroplethLoader.LoaderType.IMAGE_STRIP_LOADER:
                this.loader = new ImageStripChoroplethLoader(this.imageStripId, plethDescrip.svgTemplate, plethDescrip.thumbnailTemplate, plethDescrip.svgList);
                this.loaderType = ChoroplethLoader.LoaderTypes.IMAGE_STRIP_LOADER;
                break;
            default:
                this.loader = undefined;
                this.loaderType = ChoroplethLoader.LoaderTypes.NO_LOADER;
                //console.log('Choose a valid loader from the keys of ChoroplethLoader.LoaderTypes ');
                break;
        }
        this.plethDescrip = plethDescrip;
        return this;
    }

    static get LoaderTypes() { return {
        SIMPLE_LOADER: 0,
        IMAGE_STRIP_LOADER: 1,
        NO_LOADER: 9999
    };}

    initialize() {
        ReScatter.choroplethControl = new ChoroplethController(
                this.containerId, this.annotationId, this.plethDescrip);
        if (this.plethDescrip.plugin) {
            ReScatter.choroplethView = ReScatter.config.PluginFactory.createChoroplethType(
                this.plethDescrip.plugin, this.containerId)
        } else {
            ReScatter.choroplethView = new ChoroplethSVGView(this.containerId);
        }
        SnapShotController.addComponent(ReScatter.choroplethView);
        ReScatter.choroplethControl.initialize(ReScatter.choroplethView);
    }

    destroy() {
        if (ReScatter.choroplethControl) {
            ReScatter.choroplethControl.destroy();
            ReScatter.choroplethControl = undefined;
        }
        this.plethDescrip = undefined;
        this.loader = undefined;
    }

    loadImages (svgIdArray) {
        if (this.loader) {
            this.loader.loadImages(svgIdArray);
        }
    }

    getMapContainerId () {
        return this.containerId;
    }

};
