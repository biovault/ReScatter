/**
 * Created by bvanlew on 26-7-17.
 */
/**
 *
 */
export default class LookupEnum {
    /**
     * Call new LookupEnum with an object comprising keys and strings
     * e.g.:
     * var ThreeBlokesEnum = new LookupEnum({
     *      TOM: 'Tom',
     *      DICK: 'Dick',
     *      HARRY: 'Harry'
     * };
     *
     * @param enumObj - an object comprising keys and strings
     */
    constructor(enumObj) {
        this.enum = {};
        this.revEnum = {};
        Object.keys(enumObj).forEach(function (val) {
            this.enum[val] = enumObj[val];
            this.revEnum[enumObj[val]] = val;
        }, this);
    }
}
