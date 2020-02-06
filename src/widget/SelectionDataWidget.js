/**
 * Created by bvanlew on 26-7-17.
 */
//import PIXI from 'pixi.js';
import { css_color_string_from_int } from '../utils';
import { int_from_css_color_string } from '../utils';
import SelectionContextMenu from './SelectionContextMenu';
export default class SelectionDataWidget {
    /**
     * @constructor
     * SelectionDataTable contains all selections for the current layout.
     * It includes both the loaded predefined selections and user created selections.
     * It is added to a another webix control who's id is passed to the constructor
     *
     */
    constructor() {
        let colorFieldTemplate = '<span style=\'background:#color#; border-radius:4px;' +
            ' text-shadow: 1px 0px 1px #000,0px 1px 1px #000;' +
            ' font-family: monospace\'>#color#</span>';
        this.tableWebixId = 'selectionsDataTableId';
        this.editMode = SelectionDataWidget.modeEnum.NONE;
        this.editLabels = [];
        let self = this;
        this.selectionTableDef = {
            view: 'accordionitem',
            header: 'Loaded selections',
            headerHeight: 35,
            headerAltHeight: 35,
            collapsed: true,
            body: {
                view: 'layout',
                rows:
                [
                    {
                        view: 'datatable',
                        id: this.tableWebixId,
                        multiselect: false,
                        editable: true,
                        select: 'row',
                        columns: [
                            {id: 'label', header: 'Selection', /*width*/gravity: 1, minWidth: 80, sort: 'string'},
                            {id: 'selectionId', header: 'Group', /*width*/gravity: 1, minWidth: 80, sort: 'string'},
                            {id: 'description', header: 'Description', /*width*/gravity: 2, minWidth: 160, sort: 'string'},
                            {
                                id: 'color',
                                header: 'Color picker',
                                /*width: 80,*/
                                editor: 'color',
                                template: colorFieldTemplate
                            } //requires css color string
                        ],
                        fixedRowHeight: false,
                        rowHeight: 25,
                        rowLineHeight: 25,
                        autoConfig: true,
                        resizeColumn: true,
                        checkboxRefresh: true,
                        scrollX: false,
                        onContext: {},
                        on: {
                            onAfterEditStop: function (state, editor/*, ignoreUpdate*/) {
                                if (state.value !== state.old) {
                                    let row = this.getItem(editor.row);
                                    self.selectionRowChanged(row, editor.column);
                                    console.log('Changed selection: ' + row);
                                }
                            },
                            onSelectChange: function () {
                                let obj = this.getSelectedItem(true);
                                // single selection is show selection
                                if (obj.length === 1) {
                                    self.editLabels.push(obj[0].label);
                                    let functionMode = self.editMode;
                                    // clear the cursor and other mode related stuff
                                    self.setMode(SelectionDataWidget.modeEnum.NONE);
                                    switch (functionMode) {
                                    case SelectionDataWidget.modeEnum.NONE:
                                        if (obj && obj[0].show !== 1) { //prevents infinite looping when setting the selection from show event
                                            ReScatter.selectionEditWidget.editExistingSelection(undefined);
                                            ReScatter.selectionModel.showSelection(obj[0].label);
                                        }
                                        break;
                                    case SelectionDataWidget.modeEnum.UNION:
                                        ReScatter.selectionModel.unionSelections(self.editLabels, 'User union');
                                        break;
                                    case SelectionDataWidget.modeEnum.INTERSECT:
                                        ReScatter.selectionModel.intersectSelections(self.editLabels, 'User intersect');
                                        break;
                                    case SelectionDataWidget.modeEnum.SUBTRACT:
                                        ReScatter.selectionModel.subtractSelections(self.editLabels, 'User subtract');
                                        break;
                                    }
                                    self.editLabels = [];
                                } else if (obj.length === 0) {
                                    ReScatter.selectionModel.hideVisibleSelection();
                                }
                            }
                        }
                    },
                    {
                        view: 'layout',
                        id: 'selectionButtonsLayout',
                        /*width: 200,*/
                        rows: [
                            {template: 'Clear/delete', type: 'section'},
                            {
                                margin: 5, cols: [
                                    {
                                        view: 'button',
                                        id: 'hideVisibleSelection',
                                        value: 'Deselect',
                                        click: function (/*buttonId, ev*/) {
                                        //console.log('Pressed: ' + buttonId);
                                            $$('selectionsDataTableId').clearSelection();
                                        }
                                    },
                                    {
                                        view: 'button',
                                        id: 'deleteLastSelectionButton',
                                        value: 'Delete last',
                                        click: function (/*buttonId, ev*/) {
                                        //console.log('Pressed: ' + buttonId);
                                            ReScatter.selectionModel.deleteLastSelection();
                                        }
                                    },
                                    {
                                        view: 'button',
                                        id: 'deleteAllSelectionsButton',
                                        value: 'Delete all',
                                        click: function (/*buttonId, ev*/) {
                                        //console.log('Pressed: ' + buttonId);
                                            ReScatter.selectionModel.deleteAllSelections();
                                        }
                                    }]
                            }
                        ]
                    }
                ]
            }
        };
        this.accordionId = ReScatter.controlWidgetLayout.addAccordionView(this.selectionTableDef);
        this.selectionTable = $$(this.tableWebixId);
        this.selectionContextMenu = new SelectionContextMenu();
        this.selectionContextMenu.getMenuUi().attachTo(this.selectionTable);
    }

    static get modeEnum() {return {
        // undefined: the selection dataPoints are passed to the values param
        NONE: 0, /** No edit operation in progress **/
        EDIT: 1, /** Edit selection GUI */
        UNION: 2, /** Selecting a row add it to a union of selections*/
        INTERSECT: 3, /** Selection a row performs an intersection with the current selection  */
        SUBTRACT: 4, /** Selection a row subtracts it from the current selection */
    };}

    selectionRowChanged (row, column) {
        'use strict';
        switch (column) {
        case 'color':
            ReScatter.selectionModel.setColor(
                row.label,
                int_from_css_color_string(row.color)
            );
            break;
        default:
            console.log('Column: ' + column + ' not handled when selection edited');
        }
    }

    startEditOp(mode, selLabel/*, selId*/) {
        // to change the cursor in a webix datatable need to set it on the body item
        this.editMode = SelectionDataWidget.modeEnum.NONE; //set NONE mode to prevent first selection triggering action
        ReScatter.selectionModel.showSelection(selLabel);
        this.setMode(mode);
        if (mode === SelectionDataWidget.modeEnum.EDIT) {
            this.editLabels = [];
            ReScatter.selectionEditWidget.editExistingSelection(selLabel);
            return;
        } else if (mode === SelectionDataWidget.modeEnum.NONE) {
            return;
        }
        this.editLabels = [selLabel];
    }

    setMode(mode) {
        this.editMode = mode;
        let tableBody = this.selectionTable.getNode().querySelector('div.webix_ss_body');
        switch(mode) {
        case SelectionDataWidget.modeEnum.UNION:
            tableBody.style.cursor = 'url(' + ReScatter.cursors('./union.png') + '), auto';
            break;
        case SelectionDataWidget.modeEnum.INTERSECT:
            tableBody.style.cursor = 'url(' + ReScatter.cursors('./intersect.png') + '), auto';
            break;
        case SelectionDataWidget.modeEnum.SUBTRACT:
            tableBody.style.cursor = 'url(' + ReScatter.cursors('./subtract.png') + '), auto';
            break;
        default:
            tableBody.style.cursor = 'default';
        }
    }

    // callback from the a selectionModel
    update (context) {
        'use strict';
        let self = this;
        switch(context.op) {
        case 'create': {
            let graphicPoint = new PIXI.Graphics();
            graphicPoint.beginFill(context.sel.color);
            this.selectionTable.add({
                label: context.sel.label,
                selectionId: context.sel.selectionId,
                description: context.sel.description,
                color: css_color_string_from_int(context.sel.color)
            });
            ReScatter.selectionEditWidget.editExistingSelection(undefined);
            break;
        }

        case 'delete': {
            let foundRows = this.selectionTable.find(function (obj) {
                return obj.label === context.sel.label;
            });
            for (let i = 0, len = foundRows.length; i < len; i++) {
                this.selectionTable.remove(foundRows[i].id);
            }
            break;
        }
        case 'show':
            this.selectionTable.find(function (obj) {
                if (context.sel.label === obj.label) {
                    obj.active = 1;
                    self.selectionTable.select(obj.id);
                } else {
                    obj.active = 0;
                }
                self.selectionTable.updateItem(obj.id, obj);
                return undefined;
            });
            break;
        case 'hide':
            this.selectionTable.find(function (obj) {
                if (context.sel.label === obj.label && obj.active !== 0) {
                    obj.active = 0;
                    self.selectionTable.unselect(obj.id);
                }
                self.selectionTable.updateItem(obj.id, obj);
                return undefined;
            });
            break;
        default:
            console.log('Unrecognized selection operation in SelectionDataWidget, op: ' + context.op);
        }
        this.selectionTable.adjustRowHeight('description');
    }

    expand() {
        $$(this.accordionId).expand();
    }
}
