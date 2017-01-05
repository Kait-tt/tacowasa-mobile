'use strict';
const EventEmitter2 = require('eventemitter2');

class DeviceMotion extends EventEmitter2 {
    constructor ({threshold = 7, sleepTime = 1000} = {}, eventEmitterOptions = {}) {
        super(eventEmitterOptions);
        this.threshold = threshold;
        this.sleepTime = sleepTime;
        this.isMotion = false;
        this.initEvents();
    }

    initEvents () {
        window.addEventListener('devicemotion', e => {
            this.onDeviceMotion(e);
        }, false);
    }

    onDeviceMotion (e) {
        // this.emit('deviceMotion', {e});

        if (this.isMotion) { return; }

        const {x, y, z} = e.acceleration;

        const l = this.threshold;
        if (x > l) {
            this.emit('right', {});
        } else if (x < -l) {
            this.emit('left', {});
        } else if (y > l) {
            this.emit('up', {});
        } else if (y < -l) {
            this.emit('down', {});
        } else if (z > l) {
            this.emit('front', {});
        } else if (z < -l) {
            this.emit('back', {});
        } else {
            return;
        }

        this.isMotion = true;

        setTimeout(() => {
            this.isMotion = false;
        }, this.sleepTime);
    }
}

module.exports = DeviceMotion;
