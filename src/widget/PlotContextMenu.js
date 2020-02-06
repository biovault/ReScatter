
import webix from 'webix';
import LUTTexture from '../view/filters/LUTTexture';
import PixijsPlotController from '../control/plot/PixijsPlotController';
import { enumToOptions } from '../utils';
import ToolTipController from '../control/layout/ToolTipController';
import SnapShotController from '../control/snapshot/SnapShotController';
import ControlProtocol from '../protocols/ControlProtocol';
let toolTipController = new ToolTipController();

let instance = null;
export default class PlotContextMenu {
    /**
     * @constructor
     * PlotContextMenu is a popup used in collaboration with PixijsPlotController
     * (and perhaps, with appropriate refactoring, in the future other plot renderers).
     * It provides selection and control functionality for the plot render and communicates using the
     * global ReScatter.controlEventModel
     *
     * Requires a floating <div> with the id 'plotContextMenu' to position itself on the screen
     * eg     <div id="plotContextMenu"></div>
     *
     * @return Singelton. Calling new on PlotContextMenu() returns the same instance
     */
    constructor() {

        if (instance) {
            return instance;
        }
        this.currentPlot = undefined;
        this.inInitialize = false;
        this.controlGroups = new Map();
        this.controlGroups.set(PlotContextMenu.selectionState.ALL, [
            'seedPropId',
            'seedPropValueId',
            'savePropSelectionId',
            'excludeSeedId',
            'NumNeighboursId',
            'neighboursSectionId',
            'brushModeId'
        ]);
        this.controlGroups.set(PlotContextMenu.selectionState.DRAW, [
            'brushModeId'
        ]);
        this.controlGroups.set(PlotContextMenu.selectionState.MOUSEOVER, [
            'excludeSeedId',
            'NumNeighboursId',
            'neighboursSectionId']);
        this.controlGroups.set(PlotContextMenu.selectionState.PROPERTY,[
            'seedPropId',
            'seedPropValueId',
            'savePropSelectionId',
            'excludeSeedId',
            'NumNeighboursId',
            'neighboursSectionId'
        ]);

        let lutTexture = new LUTTexture();
        let lutNameGroups = lutTexture.getLutNameGroups();
        let lutGroupNames = Object.keys(lutNameGroups);
        // Inject disable html attribute into options based on the fact that webix builds
        // options thus : "<option value='"+id+"'>"+label+"</option>";
        // Trick is to close the quote
        let disabled = '\' disabled \'';
        this.lutNames = ['Grey'];
        lutGroupNames.forEach(function(gval/*, gindex, garray*/) {
            this.lutNames.push({id:' ' + gval + disabled, value:gval});
            lutNameGroups[gval].forEach(function (val/*, index, array*/) {
                this.lutNames.push(val);
            }, this);
        }, this);

        let self = this;
        this.plotContextMenu = webix.ui({
            view: 'window',
            container: ReScatter.CONTROL_ID.PLOTMENU,
            hidden: true,
            move: true,
            zindex: 999,
            sizeToContent:true,
            //width: 350,
            //height:70,
            id: 'plotContextMenuUI',
            head:{
                view:'toolbar', margin:-4, height: 25, cols:[
                    {view:'label', label: 'Settings',  },
                    {
                        view: 'icon', icon: 'times-circle', css: 'alter',
                        on: {
                            onItemClick: function (/*id, e*/) {
                                self.hideMe();
                            }
                        }
                    }
                    /*click:"$$('plotContextMenuUI').hide();"}*/
                ]
            },
            body: {
                id: 'plotProperties',
                view: 'form',
                autoheight: true,
                width:350,
                type: 'clean',
                complexData: true,
                elements: [
                    {view: 'text', label: 'Plot', name: 'plotId', id: 'ReScatter_context_plotId', readonly: true},
                    {view: 'text', name: 'staticSelectionLabel', readonly: true, hidden: true},
                    {view: 'text', name: 'dynamicSelectionLabel', readonly: true, hidden: true},
                    {view: 'text', name: 'canvasSelectorLabel', readonly: true, hidden: true},
                    {
                        view: 'template',
                        template: 'Selection',
                        type: 'section',
                        height: 25,
                    },

                    {rows: [
                        {view: 'radio', label: 'Method:', name: 'activeSelection', id: 'ReScatter_context_selectionRadio', value: 0, height: 25, optionHeight: 12, options: [
                            {id: ReScatter.control.PixijsPlotController.SelectionEnum.NONE, value: 'Draw'},
                            {id: ReScatter.control.PixijsPlotController.SelectionEnum.MOUSEOVER, value: 'Mouse'},
                            {id: ReScatter.control.PixijsPlotController.SelectionEnum.PROPOVER, value: 'Property'}
                        ],
                        on: {
                            onChange: function (newVal, oldVal) {
                                self.changeSelectionControlState(newVal);
                                self.changeActiveSelection(this, newVal, oldVal);
                            }
                        }
                        },
                        {
                            view: 'select',
                            id: 'brushModeId',
                            label: 'Brush mode',
                            inputWidth: 250,
                            labelWidth: 100,
                            value: 'Circle',
                            yCount: '3',
                            autoheight: true,
                            readonly: true,
                            options: enumToOptions(PixijsPlotController.brushModeEnum),
                            on: {
                                onChange: function(newVal/*, oldVal*/) {
                                    ReScatter.controlEventModel.putControlEventModel('brushMode', {brushType:newVal});
                                }
                            }
                        },
                        {
                            view: 'select',
                            id: 'seedPropId',
                            label: 'Prop',
                            inputWidth: 250, labelWidth: 70,
                            inputHeight: 30,
                            readonly: true,
                            options: [],
                            on: {
                                onChange: function (newVal/*, oldVal*/) {
                                    // Set the selectable seed propertys value based on the chosen property
                                    let plotSelect = this.getFormView().elements.staticSelectionLabel.getValue();
                                    // the following step can be slow - enable wait cursor
                                    document.body.style.cursor = 'wait';
                                    setTimeout(function () {
                                        let uniqueValues = ReScatter.dataModel.getUniqueSelectionPropValues(plotSelect, newVal);
                                        uniqueValues = uniqueValues.map(function (item) {
                                            return item.toString();
                                        });
                                        $$('seedPropSuggest').getList().clearAll();
                                        $$('seedPropSuggest').getList().parse(uniqueValues.sort());
                                        document.body.style.cursor = 'auto';
                                    }, 0);
                                }
                            }
                        },
                        {
                            view: 'text',
                            id: 'seedPropValueId',
                            label: 'Value',
                            inputWidth: 250, labelWidth: 70,
                            inputHeight: 30,
                            //readonly: false,
                            //placeholder: 'Type here',
                            suggest: {
                                id: 'seedPropSuggest',
                                keyPressTimeout:50, //100ms delay before filtering
                                filter: function (item, value) {
                                    if (item.value === undefined) {
                                        return false;
                                    }
                                    if (item.value.toString().length <= 1) {
                                        return (item.value.toString().toLowerCase().indexOf(value.toLowerCase()) === 0);
                                    } else {
                                        return (value.length > 0 &&
                                        item.value.toString().toLowerCase().indexOf(value.toLowerCase()) === 0);
                                    }
                                },
                                on: {
                                    onValueSuggest: function (/*obj*/) {
                                        self.doPropertySelection();
                                    },
                                },
                                data: []
                            },
                            on: {
                                // Also accept the selection if the user presses Enter
                                onKeyPress: function(code/*, e*/) {
                                    // pressed enter
                                    if (code === '\r'.charCodeAt(0)) {
                                        self.doPropertySelection();
                                    }
                                }
                            }
                        },
                        {
                            view: 'button',
                            id: 'savePropSelectionId',
                            label: 'Save prop selection',
                            align: 'center',
                            height: 25,
                            width: 175,
                            on: {
                                onItemClick: function (/*id, e*/) {
                                    let selector = this.getFormView().elements.dynamicSelectionLabel.getValue();
                                    ReScatter.controlEventModel.putControlEventModel('savePropertySelect', {
                                        selector: selector,
                                        targetPlotId: $$('plotProperties').elements.plotId.getValue()
                                    });
                                }
                            }
                        },
                        {
                            view: 'template',
                            template: 'Nearest Neighbours',
                            type: 'section',
                            id: 'neighboursSectionId',
                            height: 25,
                        },
                        {cols :[
                            {
                                view: 'checkbox',
                                label: 'Exclude seed',
                                labelPosition: 'top',
                                id: 'excludeSeedId',
                                width: 140,
                                name: 'mouseInteractionNoSeed',
                                value: true,
                                height: 35,
                                gravity: 3,
                                on: {
                                    onItemClick: function () {
                                        let selector = $$('plotProperties').elements.dynamicSelectionLabel.getValue();
                                        ReScatter.controlEventModel.putControlEventModel('mouseOverActive', {
                                            active: parseInt(this.getFormView().elements.activeSelection.getValue()),
                                            noSeed: this.getFormView().elements.mouseInteractionNoSeed.getValue(),
                                            selector: selector
                                        });
                                    }
                                }
                            },
                            {
                                view: 'slider',
                                id: 'NumNeighboursId',
                                title: 'Neighbors: 15',
                                name: 'numNeighbours',
                                width: 190,
                                height: 35,
                                value: 15,
                                step: 1,
                                min: 0,
                                disabled: false,
                                on: {
                                    onSliderDrag: function () {
                                        self.neighboursChange(this);
                                    },
                                    onChange: function () {
                                        self.neighboursChange(this);
                                    }
                                }
                            }]
                        },
                        {
                            view: 'template',
                            template: 'Display effect',
                            type: 'section',
                            id: 'effectsSectionId',
                            height: 25,
                        },
                        {
                            view: 'select',
                            id: 'pointDisplayId',
                            name: 'pointDisplayMode',
                            label: 'Point color',
                            labelWidth: 100,
                            readonly: true,
                            options: ['Default'],
                            on: {
                                onChange: function (newVal/*, oldVal*/) {
                                    // Set the selectable seed property's value based on the chosen property
                                    //let plotSelect = this.getFormView().elements.staticSelectionLabel.getValue();
                                    ReScatter.controlEventModel.putControlEventModel('changePointMode', {
                                        pointMode: newVal
                                    });
                                }
                            }
                        },
                    ]},
                    {
                        view: 'template',
                        template: 'Density plot',
                        type: 'section',
                        height: 25,
                    },
                    {
                        cols: [
                            {
                                view: 'checkbox', label: 'Active', name: 'kdePlotActivate', id: 'kdePlotActivateId', value: false,
                                on: {
                                    onItemClick: function () {
                                        /*if (this.getValue()) {
                                            this.getFormView().elements.kdePlotColor.enable();
                                        } else {
                                            this.getFormView().elements.kdePlotColor.disable();
                                        }*/

                                        let selector = this.getFormView().elements.dynamicSelectionLabel.getValue();
                                        let sigma = this.getFormView().elements.kdekernelSigma.getValue();
                                        //var level = this.getFormView().elements.kdekernelLevel.getValue();
                                        let contours = this.getFormView().elements.kdekernelContours.getValue();
                                        let color = this.getFormView().elements.kdePlotColor.getValue();
                                        ReScatter.controlEventModel.putControlEventModel('kdePlotActive', {
                                            selector: selector,
                                            // Previously value included: level: level,
                                            value: {active: this.getValue(), sigma: sigma,  contours: contours, color: color}
                                        });
                                    }
                                }
                            },
                            {
                                view: 'select',
                                name: 'kdePlotColor',
                                id: 'lutColorId',
                                label: 'Color',
                                disabled: true,
                                inputWidth: 175, labelWidth: 70,
                                readonly: true,
                                options: [],
                                on: {
                                    onChange: function (/*newVal, oldVal*/) {
                                        instance.kdeChange(this);
                                    }
                                }
                            }
                        ],
                        height: 25,
                    },
                    {
                        view: 'slider', id: 'kdeSigmaSlider', title: 'Sigma: 12', height:35, name: 'kdekernelSigma', value: 12, min: 1, max: 80, step: 1,
                        on: {

                            onChange: function () {
                                self.kdeChange(this, 'Sigma');
                            },
                            onSliderDrag: function() {
                                self.kdeChange(this, 'Sigma');
                            }
                        }
                    },
                    {
                        view: 'counter', id: 'kdeContourCounter', label: 'Contours', height: 35, name: 'kdekernelContours', value: 32, min: 5, max: 63, step: 1,
                        on: {
                            onChange: function () {
                                self.kdeChange(this);
                            }
                        }
                    },
                    {
                        view: 'template',
                        template: 'Plot to image',
                        type: 'section',
                        height: 25,
                    },
                    {
                        cols: [
                            {
                                view: 'button',
                                id: 'savePlot',
                                label: 'Current',
                                height: 25,
                                on: {
                                    onItemClick: function (/*id, e*/) {
                                        let canvasId = this.getFormView().elements.canvasSelectorLabel.getValue();
                                        let plotId = this.getFormView().elements.plotId.getValue();
                                        ReScatter.utils.SnapshotSaver.saveCanvasToPng(canvasId, plotId + '.png');
                                    }
                                }
                            },
                            {
                                view: 'button',
                                id: 'saveAllPlots',
                                label: 'All',
                                height: 25,
                                on: {
                                    onItemClick: function (/*id, e*/) {
                                        SnapShotController.snapshotAll(); //TODO - experiment
                                    }
                                }
                            }
                        ]
                    },

                ],
                on: {
                    onValues: function () {
                        this.elements.numNeighbours.define('max', this.getValues().maxNeighbours);
                        this.elements.numNeighbours.define('title', 'Neighbours: ' + this.elements.numNeighbours.getValue());
                    },
                    onHide: function() {
                        this.hideMe();
                        /*if (this.currentPlot) {
                            ReScatter.controlEventModel.putControlEventModel('plotContextMenuClosed', {
                                selector: form.getFormView().elements.dynamicSelectionLabel.getValue(),
                                value: {formId: this.currentPlot.id}
                            });
                        }*/
                    }
                }
            }
        });
        toolTipController.addTooltipToWebixControl(this.plotContextMenu, 'IMEPlotContextMenu', 'top-right' );
        instance = this;
        return instance;
    }



    __setDisplayEffects (displayOptions) {
        $$('effectsSectionId').show();
        $$('pointDisplayId').show();
        // webix define will overwrite the array of string with one of objects
        // so clone to prevent editing of the original layout
        $$('pointDisplayId').define('options', Array.from(displayOptions));
        $$('pointDisplayId').refresh();
    }

    __setDisplayEffectVisibility (displayOptions) {
        if (displayOptions.length <=1) {
            $$('effectsSectionId').hide();
            $$('pointDisplayId').hide();
        }
    }

    kdeChange (form, controlName) {
        if (controlName !== undefined) {
            form.define('title', controlName + ': ' + form.getValue());
        }
        form.refresh();
        if (!form.getFormView().elements.kdePlotActivate.getValue()) {
            return;
        }
        let selector = form.getFormView().elements.dynamicSelectionLabel.getValue();
        let sigma = form.getFormView().elements.kdekernelSigma.getValue();
        //var level = form.getFormView().elements.kdekernelLevel.getValue();
        let contours = form.getFormView().elements.kdekernelContours.getValue();
        let color = form.getFormView().elements.kdePlotColor.getValue();
        if (!this.inInitialize) {
            ReScatter.controlEventModel.putControlEventModel('kdePlotChanged', {
                selector: selector,
                // Previously value included level
                value: {active: true, sigma: sigma, contours: contours, color: color}
            });
        }
    }

    neighboursChange (form) {
        let selector = form.getFormView().elements.dynamicSelectionLabel.getValue();
        form.define('title', 'Neighbours: ' + form.getValue());
        form.refresh();
        if (!this.inInitialize) {
            ReScatter.controlEventModel.putControlEventModel('numNeighbours', {
                number: form.getValue(),
                selector: selector
            });
        }
    }

    changeActiveSelection (form, newVal/*, oldVal*/) {
        if (this.inInitialize) { //prevent startup event looping
            return;
        }
        let val = parseInt(newVal);
        let selector = form.getFormView().elements.dynamicSelectionLabel.getValue();
        ReScatter.controlEventModel.putControlEventModel('mouseOverActive', {
            active: val,
            noSeed:  form.getFormView().elements.mouseInteractionNoSeed.getValue(),
            selector: selector
        });
    }

    changeSelectionControlState (state) {
        // Oddly enough sometime the state comes as an int sometimes as string version of int
        // webix bug?
        let groupSelect = (typeof state === 'string')  ? parseInt(state) : state;

        this.controlGroups.get(PlotContextMenu.selectionState.ALL).forEach(function(v) {
            $$(v).hide();
        });
        this.controlGroups.get(groupSelect).forEach(function(v) {
            $$(v).show();
        });
    }

    hideMe () {
        if (this.currentPlot) {
            let formView = $$('plotProperties');
            ReScatter.controlEventModel.putControlEventModel('plotContextMenuClosed', {
                selector: formView.elements.dynamicSelectionLabel.getValue(),
                value: {formId: this.currentPlot.id}
            });
        }
        $$('plotContextMenuUI').hide();
    }

    doPropertySelection () {
        let plotSelect = $$('plotProperties').elements.staticSelectionLabel.getValue();
        let selector = $$('plotProperties').elements.dynamicSelectionLabel.getValue();
        let prop = $$('seedPropId').getValue();
        let value = $$('seedPropValueId').getValue();
        let indexes = ReScatter.dataModel.getSelectionIndexes(plotSelect, prop, value, true);
        ReScatter.controlEventModel.putControlEventModel('propertySelect', {
            indexes: indexes,
            selector: selector,
            targetPlotId: $$('plotProperties').elements.plotId.getValue()
        });
    }

    static get selectionState() {return {
        ALL: PixijsPlotController.SelectionEnum.NONE-1, // show all - not an actual state
        DRAW: PixijsPlotController.SelectionEnum.NONE ,// draw with cursor
        MOUSEOVER: PixijsPlotController.SelectionEnum.MOUSEOVER, // mouse over showing neareast neighbours
        PROPERTY: PixijsPlotController.SelectionEnum.PROPOVER // type a property
    };}
}


ControlProtocol.impl(PlotContextMenu, [], {
    // TODO the context menu is tightly coupled to the PixijsPlotController as
    // evidenced by this code. It should also work for other plot types.
    // Needs refactoring.
    onControlEvent (eventContext) {
        switch (eventContext.eventName) {
        case 'plotContextMenu':
            try {
                this.inInitialize = true;
                this.currentPlot = eventContext.event.plot;
                this.__setDisplayEffects(this.currentPlot.selectionConfigs);
                this.plotContextMenu.show();
                $$('plotProperties').setValues({
                    dynamicSelectionLabel: eventContext.event.plot.dynamicSelectionId,
                    staticSelectionLabel: eventContext.event.plot.selectionOutId,
                    canvasSelectorLabel: eventContext.event.plot.elementId,
                    plotId: eventContext.event.plot.id,
                    activeSelection: eventContext.event.plot.selectOver,
                    mouseInteractionNoSeed: eventContext.event.plot.mouseOverExcludeSeed,
                    numNeighbours: eventContext.event.plot.numNeighbours,
                    maxNeighbours: Math.ceil(Math.sqrt(eventContext.event.plot.plotPoints.length)),
                    kdekernelSigma: eventContext.event.kde.sigma,
                    kdekernelContours: eventContext.event.kde.contours,
                    kdePlotColor: eventContext.event.kde.color
                }, true);
                $$('plotProperties').callEvent('onValues', []); //shouldn't be necessary
                // for some reason this checkbox fails using set
                $$('kdePlotActivateId').setValue(eventContext.event.kde.activate);
                let props = ReScatter.dataModel.getSelectionPropKeys(eventContext.event.plot.selectionOutId);
                let propOptions = [];
                props.forEach(function (val/*, index, array*/) {
                    propOptions.push({id: val, value: val});
                });
                let wasVisible = $$('seedPropId').isVisible();
                // In order to set properties the control must be visible
                $$('seedPropId').show();
                $$('seedPropId').define('options', props.sort());
                $$('seedPropId').setValue(ReScatter.dataModel.getSelectionPrimaryProp(eventContext.event.plot.selectionOutId));
                $$('seedPropId').refresh();
                if (!wasVisible) {
                    $$('seedPropId').hide();
                }
                wasVisible = $$('lutColorId').isVisible();
                $$('lutColorId').show();
                $$('lutColorId').define('options', this.lutNames);
                $$('lutColorId').refresh();
                $$('lutColorId').setValue(eventContext.event.kde.color);
                $$('lutColorId').enable();
                if (!wasVisible) {
                    $$('lutColorId').hide();
                }
                this.__setDisplayEffectVisibility(this.currentPlot.selectionConfigs);
                this.plotContextMenu.setPosition(eventContext.event.coords.x,
                    eventContext.event.coords.y);
            }
            catch (e) {
                console.log('Error displaying plot context menu: ' + e);
            }
            finally {
                this.inInitialize = false;
            }
            break;
        case 'numNeighbours':
            if ($$('plotProperties').getValues().dynamicSelectionLabel === eventContext.event.selector) {
                $$('plotProperties').setValues({
                    numNeighbours: eventContext.event.number
                }, true);
            }
            break;
        case 'hidePlotContextMenu':
            this.hideMe();
            break;
        default:
            return;
        }
    }
});
