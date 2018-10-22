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
const SIG_DIGS = 5; // significant digits
const MS_PER_S = 1000;

const colorState = {
    state: {
        EMPTY: 0,
        WAITING: 1,
        MULTIPLE_WAITING: 2,
        RECEIVED: 3,
        MULTIPLE_RECEIVED: 4,
        REJECTED: 5,
        MULTIPLE_REJECTED: 6,
        MIXED: 7
    },
    text: {
        EMPTY: '',
        WAITING: 'waiting',
        MULTIPLE_WAITING: 'waiting++',
        RECEIVED: 'received',
        MULTIPLE_RECEIVED: 'received++',
        REJECTED: 'rejected',
        MULTIPLE_REJECTED: 'rejected++',
        MIXED: 'received / rejected'
    },
    class : {
        EMPTY: 'empty',
        WAITING: 'waiting',
        MULTIPLE_WAITING: 'multipleWaiting',
        RECEIVED: 'received',
        MULTIPLE_RECEIVED: 'multipleReceived',
        REJECTED: 'rejected',
        MULTIPLE_REJECTED: 'multipleRejected',
        MIXED: 'mixed'
    }
};

// used to halt the app (including async calls)
let bAppStopped = false;
// track timing
let timer;

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
                className={`colorItem ${colorStore[(`colorItem${this.state.itemNumber}`)].class}`}
                id={'color_item_' + this.state.itemNumber}
            >
                {colorStore[(`colorItem${this.state.itemNumber}`)].text}
            </div>
        );
    }
} // end class ColorItem

@observer
class Control extends React.Component {

    controlProgram() {


        if(colorStore.controlButton.isStart) {
            bAppStopped = false; // starting the app, so allow responses to be applied
            timer = new Date() / MS_PER_S;
            console.log("%cAwaiting colors app starting...", "color: green");
            setTimeout(() => {
                if(!bAppStopped) {
                    console.log("%cAwaiting colors app stopping...", "color: orange");
                }
            }, (RESPONSE_TIME_MAX * MS_PER_S)); // will stop slightly before the last possible responses because of program execution time
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
            bAppStopped = true; // stop the app so we don't keep applying responses
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

// TODO refactor apply success response / failure response into one function?
function applyResponse(responseNumber) {
    if(bAppStopped) return; // don't apply success responses if app is stopped
    if(colorStore[(`colorItem${responseNumber}`)].state === colorState.state.RECEIVED) {
        console.log(`multi-response num: ${responseNumber} at time since start: ${(new Date()/MS_PER_S - timer).toFixed(SIG_DIGS)} secs`);
        colorStore[(`colorItem${responseNumber}`)].text = colorState.text.MULTIPLE_RECEIVED;
        colorStore[(`colorItem${responseNumber}`)].state = colorState.state.MULTIPLE_RECEIVED;
        colorStore[(`colorItem${responseNumber}`)].class = colorState.class.MULTIPLE_RECEIVED;
    } else if (colorStore[(`colorItem${responseNumber}`)].state === colorState.state.MULTIPLE_RECEIVED) {
        // multiple received getting another success response stays as multiple received for now
    } else {
        console.log(`response num: ${responseNumber} at time since start: ${(new Date()/MS_PER_S - timer).toFixed(SIG_DIGS)} secs`);
        colorStore[(`colorItem${responseNumber}`)].text = colorState.text.RECEIVED;
        colorStore[(`colorItem${responseNumber}`)].state = colorState.state.RECEIVED;
        colorStore[(`colorItem${responseNumber}`)].class = colorState.class.RECEIVED;
    }
}

function applyWaiting(waitingNumber) {
    console.log(`waiting num: ${waitingNumber} at time since start: ${(new Date()/MS_PER_S - timer).toFixed(SIG_DIGS)} secs`);
    // TODO multiple waiting
    if(colorStore[(`colorItem${waitingNumber}`)].state === colorState.state.WAITING) {
        colorStore[(`colorItem${waitingNumber}`)].text = colorState.text.MULTIPLE_WAITING;
        colorStore[(`colorItem${waitingNumber}`)].state = colorState.state.MULTIPLE_WAITING;
        colorStore[(`colorItem${waitingNumber}`)].class = colorState.class.MULTIPLE_WAITING;
    } else if (colorStore[(`colorItem${waitingNumber}`)].state === colorState.state.MULTIPLE_WAITING) {
        // multiple waiting getting another waiting stays as multiple waiting for now
    } else {
        colorStore[(`colorItem${waitingNumber}`)].text = colorState.text.WAITING;
        colorStore[(`colorItem${waitingNumber}`)].state = colorState.state.WAITING;
        colorStore[(`colorItem${waitingNumber}`)].class = colorState.class.WAITING;
    }
}

function applyReject(rejectNumber) {
    if(bAppStopped) return; // don't apply rejection responses if app is stopped
    if(colorStore[(`colorItem${rejectNumber}`)].state === colorState.state.REJECTED) {
        console.log(`multi-reject num: ${rejectNumber} at time since start: ${(new Date()/MS_PER_S - timer).toFixed(SIG_DIGS)} secs`);
        colorStore[(`colorItem${rejectNumber}`)].text = colorState.text.MULTIPLE_REJECTED;
        colorStore[(`colorItem${rejectNumber}`)].state = colorState.state.MULTIPLE_REJECTED;
        colorStore[(`colorItem${rejectNumber}`)].class = colorState.class.MULTIPLE_REJECTED;
    } else if (colorStore[('colorItem' + rejectNumber)].state === colorState.state.MULTIPLE_REJECTED) {
        // multiple rejected receiving another reject response stays as multiple rejected for now
    } else {
        console.log(`reject num: ${rejectNumber} at time since start: ${(new Date()/MS_PER_S - timer).toFixed(SIG_DIGS)} secs`);
        colorStore[(`colorItem${rejectNumber}`)].text = colorState.text.REJECTED;
        colorStore[(`colorItem${rejectNumber}`)].state = colorState.state.REJECTED;
        colorStore[(`colorItem${rejectNumber}`)].class = colorState.class.REJECTED;
    }
}

async function colorEndPoint(colorNumber) {
    let responseTime = (Math.random() * RESPONSE_TIME_MAX + RESPONSE_TIME_MIN) * MS_PER_S; // between min and max seconds, inclusive (in milliseconds)
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
            const ERROR_INCIDENCE = 50; // percent of color items
            if(rollForError(ERROR_INCIDENCE) > 0) {
                reject({num: colorNumber, error: `oops...failed for ${colorNumber} at time since start: ${(new Date()/MS_PER_S - timer).toFixed(SIG_DIGS)} secs`});
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