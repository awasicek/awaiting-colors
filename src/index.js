import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import registerServiceWorker from './registerServiceWorker';
import {computed, observable} from "mobx";
import * as mobx from "mobx";
import {observer} from "mobx-react";

const NUM_COLOR_ITEMS = 20;
const RESPONSE_TIME_MIN = 1; // in seconds
const RESPONSE_TIME_MAX = 10; // in seconds

const colorState = {
    state: {
        EMPTY: 0,
        WAITING: 1,
        MULTIPLE_WAITING: 2,
        RECEIVED: 3,
        MULTIPLE_RECEIVED: 4,
        REJECTED: 5
    },
    text: {
        EMPTY: '',
        WAITING: 'waiting',
        MULTIPLE_WAITING: 'more than one waiting',
        RECEIVED: 'received',
        MULTIPLE_RECEIVED: 'received++',
        REJECTED: 'rejected'
    },
    class : {
        EMPTY: 'empty',
        WAITING: 'waiting',
        MULTIPLE_WAITING: 'multipleWaiting',
        RECEIVED: 'received',
        MULTIPLE_RECEIVED: 'multipleReceived',
        REJECTED: 'rejected'
    }
}



class ColorContainer extends React.Component {

    render() {

        let colorItemNums = [];
        for(let i = 0; i < NUM_COLOR_ITEMS; i++) {
            colorItemNums.push(i);
        }
        const colorItems = colorItemNums.map(function(i) {
            return(
                <ColorItem
                    itemNumber={i}
                    key={i}
                />
            );
        });

        return (
            <div
                className="colorContainer"
            >
                {colorItems}
                <Control />
            </div>
        );
    }
} // end class ColorContainer

function App() {
    return(
        <div
            className="app"
            id="app"
        >
            <ColorContainer />
        </div>
    );
}

@observer
class ColorItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            itemNumber : this.props.itemNumber
        }
    }

    render() {
        return(
            <div
                className={'colorItem' + ' ' + colorStore[('colorItem' + this.state.itemNumber)].class}
                id={'color_item_' + this.state.itemNumber}
            >
                {colorStore[('colorItem' + this.state.itemNumber)].text}
            </div>
        );
    }
} // end class ColorItem

@observer
class Control extends React.Component {

    controlProgram() {


        if(colorStore.controlButton.isStart) {
            for(let i = 0; i < 30; i++) {
                getColors().catch(err => {
                    console.error(err.error);
                    applyReject(err.num);
                    return err;
                });
            }
            // set to button to "Clear" for next click because we just started
            colorStore.controlButton.text = 'Clear';
        } else {
            applyEmptyAll();
            // set to button to "Start" for next click because we just cleared
            colorStore.controlButton.text = 'Start';
        }

        colorStore.controlButton.isStart = !colorStore.controlButton.isStart;
        // TODO fire off several batches of get colors, syncopated
    }

    render() {
        return(
            <div
                className="controlButton"
                onClick={this.controlProgram}
            >
                {colorStore.controlButton.text}
            </div>
        );
    }
}

async function getColors() {
    let promise = new Promise((resolve, reject) => {
        let randomColor = Math.floor(Math.random() * NUM_COLOR_ITEMS);
        applyWaiting(randomColor);
        resolve(colorEndPoint(randomColor));
    });
    let result = await promise;
    applyResponse(result);
}

function applyEmptyAll() {
    for(let i = 0; i < NUM_COLOR_ITEMS; i++) {
        colorStore[('colorItem' + i)].text = colorState.text.EMPTY;
        colorStore[('colorItem' + i)].state = colorState.state.EMPTY;
        colorStore[('colorItem' + i)].class = colorState.class.EMPTY;
    }
}

function applyResponse(responseNumber) {
    console.log("response num: " + responseNumber);
    if(colorStore[('colorItem' + responseNumber)].state === colorState.state.RECEIVED) {
        colorStore[('colorItem' + responseNumber)].text = colorState.text.MULTIPLE_RECEIVED;
        colorStore[('colorItem' + responseNumber)].state = colorState.state.MULTIPLE_RECEIVED;
        colorStore[('colorItem' + responseNumber)].class = colorState.class.MULTIPLE_RECEIVED;
    } else if (colorStore[('colorItem' + responseNumber)].state === colorState.state.MULTIPLE_RECEIVED) {

    } else {
        colorStore[('colorItem' + responseNumber)].text = colorState.text.RECEIVED;
        colorStore[('colorItem' + responseNumber)].state = colorState.state.RECEIVED;
        colorStore[('colorItem' + responseNumber)].class = colorState.class.RECEIVED;
    }
}

function applyWaiting(waitingNumber) {
    console.log("waiting num: " + waitingNumber);
    // TODO multiple waiting
    colorStore[('colorItem' + waitingNumber)].text = colorState.text.WAITING;
    colorStore[('colorItem' + waitingNumber)].state = colorState.state.WAITING;
    colorStore[('colorItem' + waitingNumber)].class = colorState.class.WAITING;
}

function applyReject(rejectNumber) {
    console.log("reject num: " + rejectNumber);
    colorStore[('colorItem' + rejectNumber)].text = colorState.text.REJECTED;
    colorStore[('colorItem' + rejectNumber)].state = colorState.state.REJECTED;
    colorStore[('colorItem' + rejectNumber)].class = colorState.class.REJECTED;
}

async function colorEndPoint(colorNumber) {
    let responseTime = (Math.random() * RESPONSE_TIME_MAX + RESPONSE_TIME_MIN) * 1000; // between min and max seconds, inclusive (in milliseconds)
    let color = new Promise((resolve, reject) => {
        setTimeout(() => {
            let rollForError = function (errorRate) {
                let bIsError = false;
                const MAX_PERCENTAGE = 100;
                let roll = Math.floor(Math.random() * MAX_PERCENTAGE);
                if(roll <= errorRate) {
                    bIsError = true;
                }
                return bIsError;
            };
            const ERROR_INCIDENCE = 10; // percent of color items
            if(rollForError(ERROR_INCIDENCE) > 0) {
                reject({num: colorNumber, error: 'oops...failed for ' + colorNumber});
            } else {
                resolve(colorNumber);
            }
        }, responseTime);
    });
    return color;
}

class ColorStore {

    // TODO refactor/DRY these many observable declarations

    @observable colorItem0 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem1 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem2 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem3 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem4 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem5 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem6 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem7 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem8 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem9 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem10 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem11 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem12 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem13 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem14 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem15 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem16 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem17 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem18 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem19 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };
    @observable colorItem20 = {
        text: colorState.text.EMPTY,
        color: colorState.class.EMPTY
    };

    @observable controlButton = {
        text: 'Start',
        isStart: true
    };
}

const colorStore = new ColorStore();

ReactDOM.render(<App store={colorStore} />, document.getElementById('root'));
registerServiceWorker();