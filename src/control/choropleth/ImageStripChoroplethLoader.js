/**
 * Created by baldur on 10/27/15.
 * Ported to ES6 by bvanlew on 21-7-17.
 */
/*
 * ImageStripChoroplethLoader allow the user to configure list of SVG images that can function as choropleths.
 * The images can be loaded from a local or remote URL. Default images are loaded and an interactive list of
 * thumbnal images is provided to allow a user to select and remove active images.
 */
import ToolTipController from '../layout/ToolTipController';
let toolTipController = new ToolTipController();

export default class ImageStripChoroplethLoader {
    constructor (stripElementId, svgTemplate, thumbnailTemplate, svgList) {
        "use strict";

        // a brush selection is an object {'originator': originator, 'dataPoints': dataPoints};
        this.svgRetrieveTemplate = svgTemplate;
        this.thumbnailTemplate = thumbnailTemplate;
        this.svgidList = svgList;
        this.stripElementId = stripElementId;

        this.imageElements = {};
        this.selected = [];

        this.__initialize();

    }

    imageClicked(retrieveTemplate, e) {
        let imgElement = e.target;
        let selectedIdx;
        if (imgElement.className === 'selected_thumbnail') {
            imgElement.className = 'unselected_thumbnail';
            ReScatter.choroplethControl.removeSvg(imgElement.dataset.svgindex);
            selectedIdx = this.selected.indexOf(imgElement.dataset.svgid);
            if (selectedIdx >= 0) {
                this.selected.splice(selectedIdx, 1);
            }
        } else {
            imgElement.className = 'selected_thumbnail';
            ReScatter.choroplethControl.addSvg(
                imgElement.dataset.svgid,
                imgElement.dataset.svgindex,
                retrieveTemplate
            );
            selectedIdx = this.selected.indexOf(imgElement.dataset.svgid);
            if (selectedIdx === -1) {
                this.selected.push(imgElement.dataset.svgid);
            }
        }
    }

    __initialize() {
        window.setTimeout(this.__populateImageStrip.bind(this), 2000);
    }

    __populateImageStrip() {
        let thumbnailStrip = document.getElementById(this.stripElementId);
        toolTipController.addTooltip(this.stripElementId, 'IMEChoroplethStrip', 'top');
        //let docfrag = document.createDocumentFragment();
        this.svgidList.forEach(function (elem, index) {
            let imgNode = document.createElement("img");
            imgNode.src = this.thumbnailTemplate.replace("<svgid>", elem);
            imgNode.className = "unselected_thumbnail";
            imgNode.onclick = this.imageClicked.bind(this, this.svgRetrieveTemplate);
            imgNode.setAttribute("data-svgid", elem); //custom attr with id
            imgNode.setAttribute("data-svgindex", index); //custom attr with id
            this.imageElements[elem] = imgNode;
            thumbnailStrip.appendChild(imgNode);
        }, this);
        this.selected.forEach(function (val) {
            this.imageElements[val].className = 'selected_thumbnail';
        }, this);
    }

    loadImages (svgIdArray) {
        let svgIdIndexArray = [];
        svgIdArray.forEach(function (val) {
            let svgIndex = this.svgidList.indexOf(val);
            if (svgIndex >= 0) {
                svgIdIndexArray.push({id: val, index: svgIndex});
            }
            let selectedIdx = this.selected.indexOf(val);
            if (selectedIdx === -1) {
                this.selected.push(val);
            }
            if (this.imageElements[val]) {
                this.imageElements[val].className = 'selected_thumbnail';
            }
        }, this);
        ReScatter.choroplethControl.addSvgs(
            svgIdIndexArray,
            this.svgRetrieveTemplate
        );
    }

};
