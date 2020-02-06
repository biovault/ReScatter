/**
 * Created by bvanlew on 24-7-17.
 */
/**
 * Created by baldur on 10/13/15.
 */

//</Class definition for the ObserverList/>
//ObjectList and Observable stolen from Addy Osmani
//http://addyosmani.com/resources/essentialjsdesignpatterns/book/#observerpatternjavascript

class ObserverList{
    constructor ()
    {
        'use strict';
        this.observerList = [];
    }

    add ( obj ){
        'use strict';
        return this.observerList.push( obj );
    }

    count (){
        'use strict';
        return this.observerList.length;
    }

    get ( index ){
        'use strict';
        if( index > -1 && index < this.observerList.length ){
            return this.observerList[ index ];
        }
    }

    indexOf ( obj, startIndex ){
        'use strict';
        let i = startIndex;

        while( i < this.observerList.length ){
            if( this.observerList[i] === obj ){
                return i;
            }
            i++;
        }
        return -1;
    }

    removeAt ( index ){
        'use strict';
        this.observerList.splice( index, 1 );
    }
}


//</Class definition for the ObserverList/>

//<Class definition for the Observable/>
export default class Observable{
    constructor(notifyName){
        'use strict';
        this.observers = new ObserverList();
        this.notifyName = notifyName;
    }

    addObserver ( observer ){
        'use strict';
        this.observers.add( observer );
    }

    removeObserver ( observer ){
        'use strict';
        this.observers.removeAt( this.observers.indexOf( observer, 0 ) );
    }

    removeAllObservers () {
        'use strict';
        let numObservers = this.observers.count();
        for (let i=0; i<numObservers; i++) {
            this.observers.removeAt(0);
        }
    }

    notify ( context ) {
        'use strict';
        let observerCount = this.observers.count();
        for (let i = 0; i < observerCount; i++) {
            let observer = this.observers.get(i);
            let notifyFn = observer[this.notifyName];
            if (notifyFn !== undefined) {
                notifyFn.call(observer, context);
            }
        }
    }
}
//</Class definition for the Observable/>
