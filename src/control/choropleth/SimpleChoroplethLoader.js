/**
 * Created by baldur as SimpleImageLoader on 10/27/15.
 * Ported to ES by bvanlew on 21-7-17.
 */
/*
 * SimpleChoroplethLoader allows the definition of a single SVG image to be displayed as a choropleth
 */
export default class SimpleChoroplethLoader {
    constructor(svgTemplate, svgList) {
        this.svgidList = svgList;
        this.svgRetrieveTemplate = svgTemplate;
    };


    loadImages(svgIdArray) {
        let svgIdIndexArray = [];
        svgIdArray.forEach(function (val, index, array) {
            let svgIndex = this.svgidList.indexOf(val);
            if (svgIndex >= 0) {
                svgIdIndexArray.push({id: val, index: svgIndex});
            }
        }, this);
        ReScatter.choroplethControl.addSvgs(
            svgIdIndexArray,
            this.svgRetrieveTemplate
        );
    }
}


