export { default as ColorRamp} from './ColorRamp';
export { default as SnapshotSaver} from './SnapshotSaver';
export { default as LookupEnum } from './LookupEnum';

import {CONTROL_ID as CONTROL_ID} from './const';

/**
 * Converts a LookupEnum object to a list of strings
 * @param enumObj
 * @returns {Array}
 */
export function enumToOptions(enumObj) {
    let options = [];
    Object.keys(enumObj.enum).forEach(function(val) {
        options.push(enumObj.enum[val]);
    });
    return options;
}

/**
 * Convert an RGB integer to a 6 digit hexadecimal string preceeded by #
 * @param colorint
 * @returns {string}
 */
export function css_color_string_from_int(colorint) {
    let colorString = colorint.toString(16);
    if (colorString.length > 6) {
        throw new RangeError('Value too large to convert to 6 digit hexadecimal: ' + colorint);
    }
    return "#000000".slice(0,-colorString.length) + colorString;
}

export function isVivaldiBrowser () {
    let agent = navigator.userAgent;
    return (agent.indexOf('Vivaldi') > -1);
}

export function sortAndUnique (array) {
    return array.sort().filter(function(val, index, array) {
      return (index === 0 || val !== array[index -1]);
    });
};

export function css_color_from_hextriplet (hex_triplet) {
    let textCol = (parseInt("0x"+hex_triplet, 16) > 0xffffff/2) ? 'black':'white';
    let backCol = "#"+hex_triplet;
    return {"color":textCol, "background-color":backCol};
}


export function style_from_hextriplet (hex_triplet) {
    let obj = css_color_from_hextriplet(hex_triplet);
    let styleString = " style=\'";
    for (let property in obj) {
        if (obj.hasOwnProperty(property)) {
            styleString = styleString + property + ":" + obj[property] + "; ";
        }
    }
    styleString = styleString + "\' ";
    return styleString;
}

export function int_from_css_color_string (colorString) {
    return parseInt(colorString.replace('#', '0x'));
};


/**
 * Check which ReScatter.CONTROL_ID div ids are present,
 * if debug is enabled alert missing or unrecognized ids,
 * replace the ids with their string definitions in the document DOM.
 *
 * return an array of the control ID's that
 */
export function control_ids_to_strings() {
    "use strict";
    // first get all control type IDS
    let allControlNodes = document.querySelectorAll("[id^='ReScatter.CONTROL_ID']");
    let allInDocument = new Set();
    for (let node of allControlNodes) {
        allInDocument.add(node.id);
    }
    let prefix = "ReScatter.CONTROL_ID.";
    let idList = Object.getOwnPropertyNames(CONTROL_ID);
    let prefixedIdList = idList.map(x => {return prefix + x;});
    let unmatchedInDocument = new Set([...allInDocument].filter(x => !prefixedIdList.includes(x)));
    if (ReScatter.debugOn && unmatchedInDocument.size > 0) {
        alert('ReScatter config detected unknown control ids in the html: '
            + Array.from(unmatchedInDocument));
    }

    let unmatchedInReScatter = new Set();
    // Replace CONTROL_ID definitions in the DOM with the actual string values
    idList.forEach(function(val) {
        let searchString = "[id='" + prefix + val + "']";
        let nodeList = document.querySelectorAll(searchString);
        if (nodeList.length === 0) {
            unmatchedInReScatter.add(val);
        }
        for (let item of nodeList) {
            item.id = CONTROL_ID[val];
        }
    });
    if (ReScatter.debugOn && unmatchedInReScatter.size > 0) {
        alert('ReScatter config detected unused control ids in the html: '
            + Array.from(unmatchedInReScatter));
    }
    return Array.from(allInDocument)
}

export function hide_container_behind(self) {
    self.parentNode.style.display = "none";
    self.parentNode.style.zIndex = -200;
}

export function log(message) {
    "use strict";
    if (ReScatter.debugOn) {
        console.log(message);
    }
}

export function warn(message) {
    "use strict";
    if (ReScatter.debugOn) {
        console.warn(message);
    }
}

export function error(message) {
    "use strict";
    if (ReScatter.debugOn) {
        console.error(message);
    }
}
