﻿'use strict';
require('babel-polyfill');
const Module = require('../models/quirc');

var last = Date.now();
var DEBUG = 0;
var ECC = {
    0: 'M',
    1: 'L',
    2: 'H',
    3: 'Q'
};

var DATA = {
    1: 'NUMERIC',
    2: 'ALPHA',
    3: 'BYTE',
    4: 'KANJI'
};

var QRCODE;

function log() {
    if (!DEBUG) return;
    var now = Date.now();
    var args = Array.prototype.slice.call(arguments);
    args.unshift('+' + (now - last) + 'ms');
    console.log.apply(console, args);
    last = now;
}

var data, image;
var ctx, width, height;

function gofill() {
    /* Fill out the image buffer here.
     * image is a pointer to a w*h bytes.
     * One byte per pixel, w pixels per line, h lines in the buffer.
     */
    log('gofill')
    for (var i = 0, j = 0; i < data.length; i += 4, j++) {
        Module.HEAPU8[image + j] = 0.2989 * data[i + 0] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
    }

    log('writing');

    var a = Module._xprocess();
    log('quirc_end', a);
}

function counted(n) {
    log('counted', n);
}

Module.events.on('decode', function ({params: [i, version, ecc_level, mask, data_type, payload, payload_len,
	x0, y0, x1, y1, x2, y2, x3, y3]}) {
    var buffer = read(payload, payload_len);
    var str = String.fromCharCode.apply(null, buffer);
    log("Data:", str);
    QRCODE =str;
    localStorage.setItem('qrcode',str);
    if (str) {
        if (str.startsWith('http')) {
            str = '<a href="' + str + '">' + str + '</a>';
        }
        // if (i == 0)
        display_data.innerHTML = str;
        // else display_data.innerHTML += '<br/>' + str;
    }

    ctx.beginPath();

    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.stroke();

    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    //alert(1)
    ctx.fillText([i, version, ECC[ecc_level], mask, DATA[data_type]].join(': ') + '  ' + str, width - (x0 + x1 + x2 + x3) / 4, (y0 + y1 + y2 + y3) / 4);

    ctx.restore();
});

function read(offset, len) {
    return new Uint8Array(Module.HEAPU8.buffer, offset, len);
}

// start
var video = document.createElement('video');
video.autoplay = true;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var tw = 640 // 320 // 640 // 1280;
var th = 480 // 240 // 480 // 720

var hdConstraints = {
    audio: false,
    video: {
        optional: [{ sourceId: "8fd5cd7889ba15ce0603b79bc187ce8f283b89dc7c992b053a0edf17589c2f45" }],
        mandatory: {
            maxWidth: tw,
            maxHeight: th
        }
    }
};

if (navigator.getUserMedia) {
    navigator.getUserMedia(hdConstraints, success, errorCallback);
} else {
    errorCallback('');
}

function errorCallback(e) {
    console.log("Can't access user media", e);
}

function success(stream) {
    console.log('success', stream);
    video.src = window.URL.createObjectURL(stream);
    video.onclick = function() { video.play(); };
    video.play();

    function getFrame() {
        requestAnimationFrame(getFrame);

        if (!video.videoWidth) return;

        if (!image) {
            width = video.videoWidth, height = video.videoHeight;
            log('video', width, height, video);

            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            ctx = canvas.getContext('2d');
            document.body.appendChild(canvas);

            log('start');
            image = Module._xsetup(width, height);
            log('_xsetup', image, 'pointer');
            return;
        }
        log('interval')
        ctx.drawImage(video, 0, 0, width, height);
        var imageData = ctx.getImageData(0, 0, width, height);
        data = imageData.data;
        gofill();
    }

    getFrame();
}
