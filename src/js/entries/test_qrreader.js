'use strict';
require('babel-polyfill');
const MyQRReader = require('../models/myqrreader');

const myQRReader = new MyQRReader({lastQRsSize: 20, binThreshold: 125});

myQRReader.on('recognized', ({qrs, qr, lastNum}) => {
    const nums = qrs.map(x => x.num);
    const num = qr ? qr.num : 'null';
    document.getElementById('result').innerHTML = `*${lastNum}* , *${num}* , ${nums.join(',')}`;

    qrs.forEach(({x, y, w, h}) => {
        myQRReader.ctx.strokeStyle = '#f00';
        myQRReader.ctx.strokeRect(x, y, w, h);
    });
});

// preview
document.body.appendChild(myQRReader.canvas);

myQRReader.start();
