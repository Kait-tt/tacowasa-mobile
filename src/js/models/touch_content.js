'use strict';
const EventEmitter2 = require('eventemitter2');
const Vector = require('../models/vector');

class TouchContent extends EventEmitter2 {
    constructor (context, {sleepFirstTocuh = 350} = {}, eventEmitterOptions = {}) {
        super(eventEmitterOptions);
        this.context = context;
        this.moveBeforeX = null;
        this.moveBeforeY = null;
        this.firstTouch = true;
        this.sleepFirstTocuh = sleepFirstTocuh;
        this.initEvents();
    }

    initEvents () {
        this.context.addEventListener('touchstart', e => this.onTouchStart(e));
        this.context.addEventListener('touchend', e => this.onTouchEnd(e));
        this.context.addEventListener('touchmove', e => this.onTouchMove(e));
    }

    onTouchStart (e) {
        e.preventDefault();
        this.emit('touchStart', {e});

        this.moveBeforeX = null;
        this.moveBeforeY = null;

        if (this.firstTouch) {
            this.firstTouch = false;
            setTimeout(() => { this.firstTouch = true; }, this.sleepFirstTocuh);
        } else {
            this.emit('touchDouble', {e});
            this.firstTouch = true;
        }
    }

    onTouchEnd (e) {
        e.preventDefault();
        this.emit('touchEnd', {e});
    }

    onTouchMove (e) {
        e.preventDefault();
        this.emit('touchMove', {e});

        const {pageX: x, pageY: y} = e.changedTouches[0];

        if (this.moveBeforeX && this.moveBeforeY) {
            const centerP = new Vector(270, 470); // TODO: fix position
            const beforeP = new Vector(this.moveBeforeX, this.moveBeforeY);
            const afterP = new Vector(x, y);
            const dist = Vector.calcMoveAngle(beforeP, afterP, centerP);

            this.emit('moveCircle', {dist});
        }

        ([this.moveBeforeX, this.moveBeforeY] = [x, y]);
    }
}

module.exports = TouchContent;