/**
 * Created by bvanlew on 28-5-18.
 */
import * as protocol from 'protoduck';

/**
 * To be used to export selections can be exported to external tools
 */
const ExportSelectionProtocol = protocol.define(['menuName', 'symbol', 'selectionList', 'selectionDescription' ], {
    getMenuName: [], // string: the name displayed in the menu
    getPropertySymbol: [], // string: the symbol used to choose point meta data or export (for a gene the gene id)
    getSupportedSelectionIds: [], // list of strings - the selectionIds supported by this export plugin
    exportSelection: ['selectionList', 'selectionDescription'] // export the meta data list with the given description string
});

export default ExportSelectionProtocol;
