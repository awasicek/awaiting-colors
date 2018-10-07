import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import registerServiceWorker from './registerServiceWorker';
import {computed, observable} from "mobx";
import * as mobx from "mobx";
import {observer} from "mobx-react";

const colorState = {
    state: {
        EMPTY: 0,
        WAITING: 1,
        MULTIPLE_WAITING: 2,
        RECEIVED: 3,
        MULTIPLE_RECEIVED: 4
    },
    text: {
        EMPTY: '',
        WAITING: 'waiting',
        MULTIPLE_WAITING: 'more than one waiting',
        RECEIVED: 'received',
        MULTIPLE_RECEIVED: 'more than one received',
    },
    class : {
        EMPTY: 'empty',
        WAITING: 'waiting',
        MULTIPLE_WAITING: 'multipleWaiting',
        RECEIVED: 'received',
        MULTIPLE_RECEIVED: 'multipleReceived'
    }
}

function App(props) {
    return(
        <div
            className="app"
            id="app"
        >
            <ColorContainer />
        </div>
    );
}

class ColorContainer extends React.Component {

    renderColorItem(uid) {
        return(
            <ColorItem
                itemNumber={uid}
            />
        );
    }

    render() {
        return (
            <div
                className="colorContainer"
            >
                {this.renderColorItem(1)}
                {this.renderColorItem(2)}
                {this.renderColorItem(3)}
                <Control />
            </div>
        );
    }
} // end class ColorContainer

@observer
class ColorItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            itemClass : this.props.itemClass,
            itemNumber : this.props.itemNumber
        }
    }

    render() {
        return(
            <div
                className={this.state.itemClass + ' colorItem' + ' ' + colorStore[('colorItem' + this.state.itemNumber)].class}
                id={'color_item_' + this.state.itemNumber}
            >
                {colorStore[('colorItem' + this.state.itemNumber)].text}
            </div>
        );
    }
} // end class ColorItem

class Control extends React.Component {
    constructor(props) {
        super(props);
    }

    controlProgram() {
        for(let i = 0; i < 20; i++) {
            getColors();
        }
    }

    render() {
        return(
            <div
                className="controlButton"
                onClick={this.controlProgram}
            >
                {colorStore.controlButton}
            </div>
        );
    }
}

async function getColors() {
    let promise = new Promise((resolve, reject) => {
        let randomColor = Math.floor(Math.random() * 3 + 1);
        applyWaiting(randomColor);
        resolve(colorEndPoint(randomColor));
    });
    let result = await promise;
    applyResponse(result);
}

function applyResponse(responseNumber) {
    //console.log(responseNumber);
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
    console.log(waitingNumber);
    colorStore[('colorItem' + waitingNumber)].text = colorState.text.WAITING;
    colorStore[('colorItem' + waitingNumber)].state = colorState.state.WAITING;
    colorStore[('colorItem' + waitingNumber)].class = colorState.class.WAITING;
}

async function colorEndPoint(colorNumber) {
    let responseTime = (Math.random() * 10 + 1) * 1000; // between 1 and 10 seconds, inclusive (in milliseconds)
    //console.log('response time (seconds): ' + responseTime/1000);
    //setTimeout(function, milliseconds)
    let color = new Promise((resolve, reject) => {
        setTimeout(() => {
            //console.log('color response');
            //let randomColor = Math.floor(Math.random() * 3 + 1);
            // switch(colorNumber) {
            //     case 1:
            //         resolve(1);
            //         break;
            //     case 2:
            //         resolve(2);
            //         break;
            //     case 3:
            //         resolve(3);
            //         break;
            //     default:
            //         resolve('yellow');
            // }
            resolve(colorNumber);
        }, responseTime);
    });
    return color;
}

class ColorStore {
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
    @observable controlButton = 'Start';
}

const colorStore = new ColorStore();

ReactDOM.render(<App store={colorStore} />, document.getElementById('root'));
registerServiceWorker();