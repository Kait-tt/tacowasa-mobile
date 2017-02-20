'use strict';
require('babel-polyfill');
const DeviceMotion = require('../models/device_motion');
const deviceMotion = new DeviceMotion({threshold: 7, sleepTime: 1000});

const $acValue = document.getElementById('ac-value');
const $acMinMaxValue = document.getElementById('ac-min-max-value');
const $rrValue = document.getElementById('rr-value');
const $rrMinMaxValue = document.getElementById('rr-min-max-value');
const $result = document.getElementById('result');

const maxValue = {x: 0, y: 0, z: 0};
const minValue = {x: 0, y: 0, z: 0};
const maxValueR = {a: 0, b: 0, g: 0};
const minValueR = {a: 0, b: 0, g: 0};

function updateMinMaxValue (vs) {
    ['x', 'y', 'z'].forEach(k => {
        maxValue[k] = Math.max(maxValue[k], vs[k]);
        minValue[k] = Math.min(minValue[k], vs[k]);
    });
    const params = {max: maxValue, min: minValue};
    $acMinMaxValue.innerText = JSON.stringify(params, null, '  ');
}

function updateMinMaxValueR (vs) {
    ['a', 'b', 'g'].forEach(k => {
        maxValueR[k] = Math.max(maxValueR[k], vs[k]);
        minValueR[k] = Math.min(minValueR[k], vs[k]);
    });
    const params = {max: maxValueR, min: minValueR};
    $rrMinMaxValue.innerText = JSON.stringify(params, null, '  ');
}

['right', 'left', 'up', 'down', 'front', 'back'].forEach(dir => {
    deviceMotion.on(dir, () => {
        $result.innerText = `${dir} , ${new Date()}`;
    });
});

deviceMotion.on('deviceMotion', ({e}) => {
    const {x, y, z} = e.acceleration;
    $acValue.innerText = JSON.stringify({x, y, z});
    updateMinMaxValue({x, y, z});

    let {alpha: a, beta: b, gamma: g} = e.rotationRate;
    ([a, b, g] = [a, b, g].map(x => x.toFixed(2)));
    $rrValue.innerText = JSON.stringify({a, b, g});
    updateMinMaxValueR({a, b, g});
});
