/**
 * Created by baldur on 03/01/16.
 * Ported to ES6 by bvanlew on 21-7-17.
 */
let instance = null;

//
// Implementation note: ToolTipController is a singleton
// Calling new on ToolTipController() returns a single instance

// ToolTipControl relies on ToolTipTemplates <template></template>
// defined in ToolTipTemplates.html which is
// imported into the base page macro
export default class ToolTipController {
    constructor () {
        if (instance) {
            return instance;
        }
        this.enabled = false;
        instance = this;
        return instance;
    }

    setupToolTip(toolTipTarget) {
        let IMETooltipId = toolTipTarget.getAttribute('data-ime-tooltip-id');
        let template = document.querySelector('#' + IMETooltipId);
        if (template === null) {
            return;
        }
        toolTipTarget.setAttribute("data-toggle","tooltip");
        toolTipTarget.setAttribute("data-html","true");
        toolTipTarget.setAttribute("title",template.innerHTML);
    }

    setupAllToolTips() {
        let toolTipTargets = document.querySelectorAll("[data-IME-tooltip-id]");
        if (toolTipTargets === null) {
            return;
        }
        for (let i= 0, len=toolTipTargets.length; i<len; i++) {
            this.setupToolTip(toolTipTargets.item(i));
        }
    }

    enableToolTips() {
        $('[data-toggle="tooltip"]').tooltip('enable');
        this.enabled = true;
        this.updateCheckBox();
    }

    disableToolTips() {
        $('[data-toggle="tooltip"]').tooltip('disable');
        this.enabled = false;
        this.updateCheckBox();
    }

    syncToolTips() {
        $('[data-toggle="tooltip"]').tooltip(this.getEnabledState());
    }

    getEnabledState() {
        if (this.enabled) {
            return 'enable';
        } else {
            return 'disable';
        }
    }

    addTooltip(id, tooltipId, placement, displayContainer) {
        let checkbox = document.querySelector('#' + ReScatter.CONTROL_ID.TOOLTIPCHECKBOX);
        if (!checkbox) {
            return;
        }
        let element = document.querySelector('#' + id);
        if (element.getAttribute('data-ime-tooltip-id') !== null) {
            return;
        }
        element.setAttribute('data-ime-tooltip-id', tooltipId);
        element.setAttribute('data-placement', placement);
        if (displayContainer !== undefined) {
            element.setAttribute('data-container', displayContainer);
        }
        this.setupToolTip(element);
        if ($('#' + id).tooltip) {
            $('#' + id).tooltip(this.getEnabledState());
        }
    }

    addTooltipToWebixControl(webixControl, tooltipId, placement, displayContainer) {
        let x = webixControl.getNode();
        x.setAttribute('data-ime-tooltip-id', tooltipId);
        x.setAttribute('data-placement', placement);
        if (displayContainer !== undefined) {
            x.setAttribute('data-container', displayContainer);
        }
    }

    removeToolTips() {
        //TODO make a function to destroy the tooltip on an element
    }

    changedToolTipVisibility() {
        let checkbox = document.querySelector('#' + ReScatter.CONTROL_ID.TOOLTIPCHECKBOX);
        if (!checkbox) {
            return;
        }
        if (checkbox.checked) {
            this.disableToolTips();
        } else {
            this.enableToolTips();
        }
    }

    updateCheckBox() {
        let checkbox = document.querySelector('#' + ReScatter.CONTROL_ID.TOOLTIPCHECKBOX);
        if (!checkbox) {
            return;
        }
        if (this.enabled) {
            checkbox.nextSibling.data = "Disable tooltips";
        } else {
            checkbox.nextSibling.data = "Enable tooltips";
        }
    }
};


