export default class SelectionEditWidget {
    /**
     * @constructor
     * SelectionDataTable contains all selections for the current layout.
     * It includes both the loaded predefined selections and user created selections.
     * It is added to a another webix control who's id is passed to the constructor
     *
     */
    constructor() {
        this.tableWebixId = "existingSelectionEditFormId";
        self = this;
        this.selectionTableDef = {
            view: "accordionitem",
            header: "Edit selections",
            headerHeight: 35,
            headerAltHeight: 35,
            collapsed: true,
            body: {
                id: this.tableWebixId,
                view: "form",
                hidden: false,
                type: "clean",
                complexData: true,
                elements: [
                    {template: "Edit existing selection", type: "section"},
                    {
                        view: "select",
                        id: 'editModeId',
                        label: 'Edit mode',
                        inputWidth: 250,
                        labelWidth: 100,
                        value: ReScatter.data.PermanentSelection.editModeEnum.enum.ADDPOINTS,
                        yCount: "2",
                        readonly: true,
                        options: ReScatter.utils.enumToOptions(ReScatter.data.PermanentSelection.editModeEnum)
                    },
                    {
                        view: "text",
                        name: "label",
                        label: "Name",
                        inputWidth: 400,
                        labelWidth: 100,
                        readonly: true
                    },
                    {
                        view: "text",
                        name: "selectionId",
                        label: "Group",
                        inputWidth: 400,
                        labelWidth: 100,
                        readonly: true
                    },
                    {
                        view: "text",
                        name: "description",
                        label: "Description",
                        inputWidth: 400,
                        labelWidth: 100
                    },
                    {
                        view: "text",
                        name: "numPoints",
                        label: "Num points",
                        inputWidth: 400,
                        labelWidth: 100,
                        readonly: true
                    },
                    {
                        margin: 5, cols: [
                        {
                            view: "button",
                            id: "saveButton",
                            value: "Save",
                            click: function (buttonId, ev) {
                                ReScatter.selectionModel.saveEditingSelection();
                                self.editExistingSelection(undefined);
                                //$$("editSelectionsControlId").hide();
                            }
                        },
                        {
                            view: "button",
                            id: "cancelButton",
                            value: "Cancel",
                            click: function (buttonId, ev) {
                                ReScatter.selectionModel.cancelEditingSelection();
                                self.editExistingSelection(undefined);
                                //$$("editSelectionsControlId").hide();
                            }
                        }]
                    }
                ]
            }
        }
        this.accordionView = ReScatter.controlWidgetLayout.addAccordionView(this.selectionTableDef);
        this.editForm = $$(this.tableWebixId);
        $$("editModeId").attachEvent("onChange", function(newVal, oldVal) {
            ReScatter.controlEventModel.putControlEventModel('editOp', {editOp:newVal});
            // TODO conside subscribing selectionModel to controlEventModel
            ReScatter.selectionModel.setPutOperation(newVal);
        });
        this.editForm.attachEvent("onValues", function() {
            let editMode = $$("editModeId").getValue();
            ReScatter.controlEventModel.putControlEventModel('editOp', {editOp:editMode});
            // TODO conside subscribing selectionModel to controlEventModel
            ReScatter.selectionModel.setPutOperation(editMode);
        });
        this.editForm.hide();
    }

     editExistingSelection(label) {
        if (label !== undefined) {
            let selData = ReScatter.selectionModel.getSelection(label);
            ReScatter.selectionModel.setEditingSelection(label);
            let copySelData = jQuery.extend(true, {}, selData);
            copySelData.numPoints = copySelData.dataPoints.length;
            // Fill the form
            this.editForm.setValues(copySelData);
            ReScatter.controlEventModel.putControlEventModel('editMode', {
                editMode: "EXISTING",
                editTarget: label,
                selectionId: copySelData.selectionId
            });
            // The existing selection editing form is hidden by default
            this.editForm.show();
            // Open the accordion to draw attention to the edit controls.
            $$(this.accordionView).expand();
        } else {
            this.editForm.hide();
            $$(this.accordionView).collapse();
            ReScatter.selectionModel.cancelEditingSelection();
            ReScatter.controlEventModel.putControlEventModel('editMode', {editMode:"NEW"});
        }
    }
}
