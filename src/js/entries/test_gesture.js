'use strict';
require('babel-polyfill');
const EventEmitter2 = require('eventemitter2');
const event = new EventEmitter2();

const $acValue = document.getElementById('ac-value');
const $acMinMaxValue = document.getElementById('ac-min-max-value');
const $result = document.getElementById('result');

const maxValue = {x: 0, y: 0, z: 0};
const minValue = {x: 0, y: 0, z: 0};

function updateMinMaxValue (vs) {
    ['x', 'y', 'z'].forEach(k => {
        maxValue[k] = Math.max(maxValue[k], vs[k]);
        minValue[k] = Math.min(minValue[k], vs[k]);
    });
    const params = {max: maxValue, min: minValue};
    $acMinMaxValue.innerText = JSON.stringify(params, null, '  ');
}

['right', 'left', 'up', 'down', 'front', 'back'].forEach(dir => {
    event.on(dir, () => {
        $result.innerText = `${dir} , ${new Date()}`
    });
});

///

window.addEventListener("devicemotion", onDeviceMotion, false);

let isMotion = false;
function onDeviceMotion (e) {
    if (isMotion) { return; }

    const {x, y, z} = e.acceleration;
    $acValue.innerText = JSON.stringify({x, y, z});
    updateMinMaxValue({x, y, z});

    const l = 7;
    if (x > l) {
        event.emit('right', {});
    } else if (x < -l) {
        event.emit('left', {});
    } else if (y > l) {
        event.emit('up', {});
    } else if (y < -l) {
        event.emit('down', {});
    } else if (z > l) {
        event.emit('front', {});
    } else if (z < -l) {
        event.emit('back', {});
    } else {
        return;
    }

    isMotion = true;

    setTimeout(() => {
        isMotion = false;
    }, 1000);
}
