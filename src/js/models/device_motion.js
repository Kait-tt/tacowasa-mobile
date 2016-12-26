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
        window.addEventListener("devicemotion", e => {
            this.onDeviceMotion(e);
        }, false);
    }

    onDeviceMotion (e) {
        // this.emit('deviceMotion', {e});

        if (this.isMotion) { return; }

        const {x, y, z} = e.acceleration;

        const l = this.threshold;
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

        this.isMotion = true;

        setTimeout(() => {
            this.isMotion = false;
        }, this.sleepTime);
    }
}

module.exports = DeviceMotion;
