﻿'use strict';
require('babel-polyfill');

let snapshot, ctx, width, height;

const video = document.createElement('video');
video.autoplay = true;

if (!navigator.mediaDevices && (navigator.mozGetUserMedia || navigator.webkitGetUserMedia)) {
    navigator.mediaDevices = {
        getUserMedia: (c) => {
            return new Promise((y, n) => (navigator.mozGetUserMedia || navigator.webkitGetUserMedia).call(navigator, c, y, n));
        }
    };
}

const hdConstraints = {
    audio: false,
    video: {
        mandatory: {
            maxWidth: 640,
            maxHeight: 480,
            maxFrameRate: 10
        }
    }
};

if (navigator.mediaDevices && MediaStreamTrack) {
    MediaStreamTrack.getSources(data => {
        const cameras = data.filter(x => x.kind === 'video');
        if (!cameras.length) { return console.error('camera devices is not found'); }
        const backCamera = cameras.find(x => x.facing === 'environment');

        hdConstraints.video.optional = [{sourceId: backCamera ? backCamera.id : cameras[0].id}];
        navigator.mediaDevices.getUserMedia(hdConstraints)
            .then(onGetUserMedia)
            .catch(e => console.error(e));
    });
} else {
    console.error('Your browser do not support MediaDevices or MediaStreamTrack');
}

function onGetUserMedia (stream) {
    video.src = window.URL.createObjectURL(stream);
    video.onclick = () => video.play();
    video.play();

    function getFrame() {
        requestAnimationFrame(getFrame);

        if (!video.videoWidth) { return; }
        if (!ctx) {
            createPreviewCanvas(video);
            snapshot = new Uint8ClampedArray(width * height);
        }

        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        binarize(imageData.data, snapshot, width, height);
        compressAndDecompress(snapshot, snapshot, width, height);

        const image2 = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pos = (y * width + x) * 4;
                const v = snapshot[y * width + x];
                image2.data[pos] = image2.data[pos + 1] = image2.data[pos + 2] = v;
                image2.data[pos + 3] = 255;
            }
        }

        ctx.putImageData(image2, 0, 0);

        findQRCode(snapshot, width, height);
    }

    getFrame();
}

function createPreviewCanvas (video) {
    width = video.videoWidth;
    height = video.videoHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);
}

function binarize (src, dist, width, height) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pos = (y * width + x) * 4;
            const gray = 0.2989 * src[pos] + 0.5870 * src[pos + 1] + 0.1140 * src[pos + 2];
            dist[y * width + x] = gray < 125 ? 0 : 255;
        }
    }
}

function compressAndDecompress (src, dist, width, height) {
    const n = 2;
    const w = Math.ceil(width / n);
    const h = Math.ceil(height / n);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let b = 0, w = 0;

            for (let yi = 0; yi < n && y * n + yi < height; yi++) {
                for (let xi = 0; xi < n && x * n + xi < width; xi++) {
                    const pos = (y * n + yi) * width + x * n + xi;
                    if (src[pos] === 255) { ++w; }
                    else { ++b; }
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

    for (let y = Math.round(height / 2); y >= 0; y--) {
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
            candidates1.push({x1, x2, xc, yc: y});
        }

        {

        }

        break;
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

    rects.forEach(({x1, y1, w, h}) => {
        ctx.strokeStyle = '#f00';
        ctx.strokeRect(x1, y1, w, h);
    });

    const res = rects.map(({x1, y1, w, h}) => {
        const dw = w / 8;
        const dh = h / 8;
        const sw = Math.ceil(dw / 4);
        const sh = Math.ceil(dh / 4);
        const nums = [];
        for (let yi = 0; yi < 4; yi++) {
            for (let xi = 0; xi < 4; xi++) {
                if (yi < 2 && xi < 2) { continue; }
                let cntb = 0, cntw = 0;
                for (let yi2 = -sh; yi2 <= sh; yi2++) {
                    for (let xi2 = -sw; xi2 <= sw; xi2++) {
                        const y = Math.floor(y1 + dh + dh * yi * 2 + yi2);
                        const x = Math.floor(x1 + dw + dw * xi * 2 + yi2);
                        if (y < 0 || x < 0 || y >= height || x >= width) { continue; }
                        if (src[y * width + x] === 0) { ++cntb; }
                        else { ++cntw; }
                    }
                }
                ctx.fillStyle = '#0f0';
                ctx.fillRect(Math.floor(x1 + dw + dw * xi * 2 - sw / 2), Math.floor(y1 + dh + dh * yi * 2 - sh / 2), sw, sh);
                nums.push(cntb >= cntw ? 1 : 0);
            }
        }
        console.log(nums);
        return nums.reduce((res, v) => (res * 2 + v), 0);
    });

}
