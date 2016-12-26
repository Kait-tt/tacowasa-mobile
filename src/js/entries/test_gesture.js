'use strict';
require('babel-polyfill');
const DeviceMotion = require('../models/device_motion');
const deviceMotion = new DeviceMotion({threshold: 7, sleepTime: 1000});

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
    deviceMotion.on(dir, () => {
        $result.innerText = `${dir} , ${new Date()}`
    });
});

deviceMotion.on('deviceMotion', e => {
    const {x, y, z} = e.acceleration;
    $acValue.innerText = JSON.stringify({x, y, z});
    updateMinMaxValue({x, y, z});
});
