/**
 * StartAction handles queries to the BrainScope page that trigger it to startup differently
 *
 **/


export default class StartupSelection {
    constructor() {
    }

    performStartupAction() {
        this.registerSelectionMessageListener();
        if ($('#rescatter-data') && $('#rescatter-data').attr('data-start-selection')) {
            let startupSelection = JSON.parse($('#rescatter-data').attr('data-start-selection'));
            ReScatter.dimres_url= null;
            if (startupSelection.dimres_url) {
                ReScatter.dimres_url = startupSelection.dimres_url;
            }
            if (!startupSelection.display) {
                StartupSelection.sendReadyMessageToOpener();
                return;
            }
            ReScatter.viewController.loadLayoutByIndex(startupSelection.display, () => {
                StartupSelection.addSelection(startupSelection);
                ReScatter.selectionDataWidget.expand();
            });
        }
    }

    static addSelection(startupSelection) {
        // Load data set based on display and then output selection
        //
        // This function is more ore less duplicated from the SelectionUploadWidget
        // TOD improve design here
        try {
            let values = startupSelection.selection.split(',');
            let description = startupSelection.description;
            let target = startupSelection.group;
            let propName = startupSelection.property;
            let color = startupSelection.color || 0x772222;
            let selectionIndices = [];
            let originator = 'data-start-selection';
            values.forEach(function (val) {
                // case insensitive matches allow
                selectionIndices = selectionIndices.concat(ReScatter.dataModel.getSelectionIndex(target, propName, val));
            });
            let label = ReScatter.selectionModel.getNewLabel(target);
            ReScatter.selectionModel.putSelection(
                label,
                originator,
                selectionIndices,
                color,
                description,
                target,
                undefined, // no source props
                true // add in background for speed
            );
            //ReScatter.selectionModel.showSelection(label);

        }
        catch(error) {
            console.log('Could not process query:' + error);
        }
    }

    static sendReadyMessageToOpener() {
        if (!window.opener) {
            return;
        }
        window.opener.postMessage('BrainScope ready', '*');
    }

    registerSelectionMessageListener() {
        window.addEventListener('message', StartupSelection.receiveSelectionMessage, {capture: true});
    }

    static receiveSelectionMessage(event) {
        if (typeof(event.data) !== 'string') {
            return;
        }

        let selMessage;
        try {
            selMessage = JSON.parse(event.data);
        } catch(e) {
            return;
        }
        if (!selMessage.display || !selMessage.group || !selMessage.property || !selMessage.selections) {
            return;
        }
        event.stopPropagation();
        window.removeEventListener('message', StartupSelection.receiveSelectionMessage);

        ReScatter.viewController.loadLayoutByIndex(selMessage.display, () => {
            ReScatter.controlEventModel.putControlEventModel('showProgress', {});
            ReScatter.controlEventModel.putControlEventModel('selectionsProgress', {
                selectionState: 'Loading additional selections'
            });
            //console.log("started: " + startTime);
            ReScatter.selectionDataWidget.expand();
            function addSelection(i, selections) {
                let sel = selections[i];
                let nameAndValues = sel.split(':');
                let newSelection = {
                    description: nameAndValues[0],
                    selection: nameAndValues[2],
                    group: selMessage.group,
                    property: selMessage.property,
                    display: selMessage.display,
                    color: parseInt(nameAndValues[1]),
                };
                ReScatter.controlEventModel.putControlEventModel('selectionsProgress', {
                    selectionState: 'Loading selection: ' + newSelection.description
                });
                //console.log("add selection time: " + (Date.now() - startTime));
                StartupSelection.addSelection(newSelection);
                if ((i + 1) < selections.length) {
                    setTimeout(addSelection(i+1, selections), 100);
                } else {
                    ReScatter.controlEventModel.putControlEventModel('hideProgress', {});
                }
            }
            addSelection(0, selMessage.selections.split(';'));
        });


        //console.log(event.data);
    }
}
