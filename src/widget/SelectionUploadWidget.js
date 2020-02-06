/**
 * Created by bvanlew on 26-7-17.
 */
export default class SelectionUploadWidget {
    /**
     * @constructor
     * SelectionEditControls contains all control widgets for layout loading,
     * predefined selections, ontology, and selection manipulation including
     * editing manipulation and uploading.
     *
     * It locates in a div that is defined as foll
     *
     * Requires a floating <div> with the id 'plotContextMenu' to position itself on the screen
     * eg     <div id="plotContextMenu"></div>
     *
     * @return Singelton. Calling new on PlotContextMenu() returns the same instance
     */
    constructor() {
        this.tableWebixId = 'loadSelectionsLayoutId';
        let self = this;
        this.uploadFormDef = {
            view: 'accordionitem',
            header: 'Upload selections',
            headerHeight: 35,
            headerAltHeight: 35,
            collapsed: true,
            body: {
                view: 'layout',
                id: 'loadSelectionsLayoutId',
                rows: [
                    {template: 'Load selection from CSV file, or enter ids manually', type: 'section'},
                    {
                        margin: 5, cols: [
                            {
                                view: 'select',
                                id: 'uploadTargetId',
                                label: 'Type',
                                inputWidth: 200, labelWidth: 70,
                                readonly: true,
                                options: []
                            },
                            {
                                view: 'select',
                                id: 'selectPropId',
                                label: 'Property',
                                inputWidth: 200, labelWidth: 70,
                                readonly: true,
                                options: []
                            }]
                    },
                    {
                        type: 'space',
                        cols:[
                            {
                                view: 'htmlform',
                                minHeight: 20,
                                template: '<form><input type=\'file\' id=\'selectionFileInput\' ' +
                                      'onchange=\'self.loadSelectionFile(this.files, $$("uploadTargetId").getValue())\'></form>'
                            },
                            {
                                view: 'form',
                                type: 'clean',
                                elements:[{
                                    view: 'textarea',
                                    id: 'manualTextAreaId',
                                    name: 'manualSelText',
                                    height: 100,
                                    placeholder: 'Enter comma, semicolon, or LF separated ids here',
                                },
                                {
                                    view: 'button',
                                    id: 'enterManualSelection',
                                    value: 'Select',
                                    click: function (/*buttonId, ev*/) {
                                        let text = $$('manualTextAreaId').getValue();
                                        // be forgiving - users wanto use use semicolon CRLF etc
                                        let re = /\s*[,;\n]\s*/i;
                                        let values = text.split(re);


                                        if (values.length > 0) {
                                            self.loadValues(values, $$('uploadTargetId').getValue());
                                        }
                                    }
                                }
                                ]
                            }]
                    }
                ]
            }
        };
        ReScatter.controlWidgetLayout.addAccordionView(this.uploadFormDef);
        this.uploadForm = $$(this.tableWebixId);

        $$('uploadTargetId').attachEvent('onChange', function(selectionVal/*, oldVal*/) {
            if (selectionVal === '1') {return;} // the empty combo value
            let keys = ReScatter.dataModel.getSelectionPropKeys(selectionVal);
            keys.sort();
            let options = [];
            keys.forEach(function(val/*, index, array*/){
                let prop = {id: val, value: val};
                options.push(prop);
            });
            $$('selectPropId').define('options', options);
            $$('selectPropId').setValue(ReScatter.dataModel.getSelectionPrimaryProp(selectionVal));
            $$('selectPropId').refresh();
        });

    }

    /**
     *
     * @param selections - id value array containing the possible selection groups
     */
    updateOptionsFromSelections(selections) {
        $$('uploadTargetId').define('options', selections);
        $$('uploadTargetId').refresh();
        $$('uploadTargetId').setValue(selections[0].id);
    }

    loadSelection (selectionIndices, source, description, target) {
        if (selectionIndices.length === 0) {
            alert('No selection created - check the property selection and property names');
            return;
        }
        let label = ReScatter.selectionModel.getNewLabel(target);
        ReScatter.selectionModel.putSelection(
            label,
            source ,
            selectionIndices,
            0x722222, //make user selectable?
            description,
            target
        );
    }

    selectionFileLoaded (target, fileName, loadEvent) {
        let selectionText = loadEvent.target.result;
        // Allow for CRLF or LF separation
        // Convert to commas
        // Split on commas
        let isCRLF = selectionText.search('\r\n') !== -1;
        let isLF = isCRLF ? false: selectionText.search('\n') !== -1;
        let isSemicolon = (isCRLF || isLF) ? false : selectionText.search(';') !== -1;
        let isComma = selectionText.search(',') !== -1;
        if (!isComma) {
            if (isCRLF) {
                // eslint-disable-next-line no-control-regex
                let crlfre = new RegExp('\r\n', 'g');
                selectionText = selectionText.replace(crlfre, ',');
            } else if (isLF) {
                // eslint-disable-next-line no-control-regex
                let lfre = new RegExp('\n', 'g');
                selectionText = selectionText.replace(lfre, ',');
            } else if (isSemicolon) {
                let scre = new RegExp(';', 'g');
                selectionText = selectionText.replace(scre, ',');
            }
        }
        let selectionArray = selectionText.split(',');
        let cleanArray = [];
        selectionArray.forEach(function(value/*, index, array*/){
            cleanArray.push(value.trim());
        });

        let selectionIndices = [];
        let propName = $$('selectPropId').getValue();
        cleanArray.forEach(function(val/*, index, array*/) {
            // case sensitive match
            selectionIndices = selectionIndices.concat(ReScatter.dataModel.getSelectionIndexes(target, propName, val, false));
        });
        this.loadSelection(selectionIndices, 'From file', 'Loaded from ' + fileName, target);
    }

    loadSelectionFile (files, target) {
        let selectionFile = files[0];

        // read the file selected by the user then start loading the selection
        let reader = new FileReader();
        reader.onload = this.selectionFileLoaded.bind(this, target, selectionFile.name);

        reader.readAsText(selectionFile);
    }

    loadValues (values, target) {
        let propName = $$('selectPropId').getValue();
        let selectionIndices = [];
        values.forEach(function(val/*, index, array*/) {
            // case insensitive matches allow
            selectionIndices = selectionIndices.concat(ReScatter.dataModel.getSelectionIndexes(target, propName, val, true));
        });
        this.loadSelection(selectionIndices, 'Manual', 'Manual selection: ' + selectionIndices.length + ' points', target);
    }

}
