'use strict';
require('babel-polyfill');
const _ = require('lodash');
const EventEmitter2 = require('eventemitter2');

// polyfill
if (!navigator.mediaDevices && (navigator.mozGetUserMedia || navigator.webkitGetUserMedia)) {
    navigator.mediaDevices = {
        getUserMedia: (c) => {
            return new Promise((resolve, reject) => {
                (navigator.mozGetUserMedia || navigator.webkitGetUserMedia).call(navigator, c, resolve, reject);
            });
        }
    };
}

class MyQRReader extends EventEmitter2 {
    constructor ({lastQRsSize = 20, binThreshold = 125} = {}, {eventEmitter2Options = {}} = {}) {
        super(eventEmitter2Options);
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.canvas = document.createElement('canvas');
        this.width = 0;
        this.height = 0;
        this.ctx = null;
        this.snapshot = null;
        this.lastQRs = [];
        this.lastQRsSize = lastQRsSize;
        this.binThreshold = binThreshold;
    }

    createHdConstraints ({width = 640, height = 480, frameRate = 10, optional = []} = {}) {
        return {
            audio: false,
            video: {
                mandatory: {
                    maxWidth: width,
                    maxHeight: height,
                    maxFrameRate: frameRate
                },
                optional
            }
        };
    }

    start (mediaOpts) {
        return this.startVideoStream(mediaOpts)
            .then(stream => this.onGetUserMedia(stream));
    }

    startVideoStream (mediaOpts = {}) {
        if (!navigator.mediaDevices) {
            return Promise.reject('Your browser do not support MediaDevices or MediaStreamTrack');
        }

        return navigator.mediaDevices.enumerateDevices()
            .then(data => {
                const cameras = data.filter(x => /video/.test(x.kind));
                if (!cameras.length) { return Promise.reject('camera devices is not found'); }

                const backCamera = cameras.find(x => /back/.test(x.label));
                const optional = [{sourceId: backCamera ? backCamera.deviceId : cameras[0].deviceId}];
                const hdConstraints = this.createHdConstraints(Object.assign({optional}, mediaOpts));
                return navigator.mediaDevices.getUserMedia(hdConstraints);
            });
    }

    onGetUserMedia (stream) {
        this.video.src = window.URL.createObjectURL(stream);
        this.video.onclick = () => this.video.play();
        setTimeout(() => {
            this.video.play();
            this.onFrame();
        }, 500);
    }

    onFrame () {
        this.emit('frame', {});
        requestAnimationFrame(() => this.onFrame());

        if (!this.video.videoWidth) { return; }
        if (!this.ctx) {
            this.width = this.video.videoWidth;
            this.height = this.video.videoHeight;

            this.canvas.width = this.width;
            this.canvas.height = this.height;

            this.ctx = this.canvas.getContext('2d');
            this.snapshot = new Uint8ClampedArray(this.width * this.height);
        }

        const {width: w, height: h} = this;

        this.ctx.drawImage(this.video, 0, 0, w, h);
        const imageData = this.ctx.getImageData(0, 0, w, h);
        this.emit('capture', {imageData});

        binarize(imageData.data, this.snapshot, w, h, {binThreshold: this.binThreshold});
        compressAndDecompress(this.snapshot, this.snapshot, w, h);

        // {num, x, y, w, h}
        const qrs = findQRCode(this.snapshot, w, h);

        const centerQR = _.minBy(qrs.map(qr => {
            const dx = qr.x + qr.w / 2 - w;
            const dy = qr.y + qr.w / 2 - w;
            const dist = dx * dx + dy * dy;
            return {dist, qr};
        }), 'dist');
        const qr = centerQR ? centerQR.qr : null;
        this.lastQRs.unshift(qr);
        while (this.lastQRs.length > this.lastQRsSize) { this.lastQRs.pop(); }
        const lastNum = _.chain(this.lastQRs)
            .compact()
            .map('num')
            .countBy()
            .toPairs()
            .maxBy(x => x[1])
            .value();

        this.emit('recognized', {qrs, qr, lastNum: lastNum ? lastNum[0] : null});
    }
}

function binarize (src, dist, width, height, {binThreshold = 125} = {}) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pos = (y * width + x) * 4;
            const gray = 0.2989 * src[pos] + 0.5870 * src[pos + 1] + 0.1140 * src[pos + 2];
            dist[y * width + x] = gray < binThreshold ? 0 : 255;
        }
    }
}

function compressAndDecompress (src, dist, width, height) {
    const n = 2;
    const w = Math.ceil(width / n);
    const h = Math.ceil(height / n);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let b = 0;
            let w = 0;

            for (let yi = 0; yi < n && y * n + yi < height; yi++) {
                for (let xi = 0; xi < n && x * n + xi < width; xi++) {
                    const pos = (y * n + yi) * width + x * n + xi;
                    if (src[pos] === 255) {
                        ++w;
                    } else {
                        ++b;
                    }
                }
            }

            const v = b >= w ? 0 : 255;
            for (let yi = 0; yi < n && y * n + yi < height; yi++) {
                for (let xi = 0; xi < n && x * n + xi < width; xi++) {
                    const pos = (y * n + yi) * width + x * n + xi;
                    dist[pos] = v;
                }
            }
        }
    }
}

function findQRCode (src, width, height) {
    const candidates1 = [];
    const candidatesMemo = {};

    for (let y = 0; y < height; y++) {
        const line = [];
        let b = src[y * width] === 0;
        let cnt = 1;
        let pos = 0;
        for (let x = 1; x < width; x++) {
            const _b = src[y * width + x] === 0;
            if (_b !== b) {
                line.push({c: b ? 1 : 0, cnt, pos});
                b = _b;
                pos += cnt;
                cnt = 0;
            }
            ++cnt;
        }
        if (cnt) {
            line.push({c: b ? 1 : 0, cnt, pos});
        }

        for (let i = 0; i + 5 <= line.length; i++) {
            const ts = line.slice(i, i + 5);
            if ([1, 0, 1, 0, 1].some((v, k) => ts[k].c !== v)) { continue; }
            const vs = ts.map(t => t.cnt);
            const rs = vs.map(v => v / vs[0]);

            if ([1, 3, 4].some(j => Math.abs(1 - rs[j]) > 0.5)) { continue; }
            if (Math.abs(3 - rs[2]) > 1) { continue; }

            const x1 = ts[0].pos;
            const x2 = ts[4].pos + ts[4].cnt;
            const xc = Math.round((x1 + x2) / 2);
            const key = `${Math.round(xc / (width / 10))}_${Math.round(y / (height / 10))}`;
            if (candidatesMemo[key]) { continue; }
            candidatesMemo[key] = true;
            candidates1.push({x1, x2, xc, yc: y});
        }
    }

    const candidates2 = [];
    for (let candidate of candidates1) {
        const {x1, x2, xc: x, yc} = candidate;
        const line = [];
        let b = src[x] === 0;
        let cnt = 1;
        let pos = 0;

        for (let y = 1; y < height; y++) {
            const _b = src[y * width + x] === 0;
            if (_b !== b) {
                line.push({c: b ? 1 : 0, cnt, pos});
                b = _b;
                pos += cnt;
                cnt = 0;
            }
            ++cnt;
        }
        if (cnt) {
            line.push({c: b ? 1 : 0, cnt, pos});
        }

        for (let i = 0; i + 5 <= line.length; i++) {
            const ts = line.slice(i, i + 5);

            if ([1, 0, 1, 0, 1].some((v, k) => ts[k].c !== v)) { continue; }
            const vs = ts.map(t => t.cnt);
            const rs = vs.map(v => v / vs[0]);

            if ([1, 3, 4].some(j => Math.abs(1 - rs[j]) > 0.5)) { continue; }
            if (Math.abs(3 - rs[2]) > 1) { continue; }

            if (yc < ts[2].pos || ts[3].pos < yc) { continue; }

            const y1 = ts[0].pos;
            const y2 = ts[4].pos + ts[4].cnt;
            const yc2 = Math.round((y1 + y2) / 2);
            candidates2.push({x1, y1, x2, y2, xc: x, yc: yc2});
        }
    }

    const rects = candidates2.map(({x1, y1, x2, y2}) => ({
        x1,
        y1,
        x2: x2 + x2 - x1,
        y2: y2 + y2 - y1,
        w: (x2 * 2 - x1 * 2) * 1.05,
        h: (y2 * 2 - y1 * 2) * 1.05
    }));

    return _.chain(rects)
        .map(({x1, y1, w, h}) => {
            if (x1 + w > width || y1 + h > height) { return null; }

            const dw = w / 8;
            const dh = h / 8;
            const sw = Math.ceil(dw / 4);
            const sh = Math.ceil(dh / 4);
            const nums = [];
            for (let yi = 0; yi < 4; yi++) {
                for (let xi = 0; xi < 4; xi++) {
                    if (yi < 2 && xi < 2) { continue; }
                    let cntb = 0;
                    let cntw = 0;
                    for (let yi2 = -sh; yi2 <= sh; yi2++) {
                        for (let xi2 = -sw; xi2 <= sw; xi2++) {
                            const y = Math.floor(y1 + dh + dh * yi * 2 + yi2);
                            const x = Math.floor(x1 + dw + dw * xi * 2 + yi2);
                            if (y < 0 || x < 0 || y >= height || x >= width) { continue; }
                            if (src[y * width + x]) {
                                ++cntw;
                            } else {
                                ++cntb;
                            }
                        }
                    }
                    nums.push(cntb >= cntw ? 1 : 0);
                }
            }
            const num = _.reverse(nums).reduce((res, v) => (res * 2 + v), 0);
            return {num, x: x1, y: y1, w, h};
        })
        .compact()
        .uniqBy('num')
        .sortBy('num')
        .value();
}

module.exports = MyQRReader;
