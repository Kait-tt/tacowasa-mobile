'use strict';
require('babel-polyfill');
const MyQRReader = require('../models/myqrreader');

const myQRReader = new MyQRReader();

myQRReader.on('recognized', ({qrs}) => {
    const nums = qrs.map(x => x.num);
    document.getElementById('result').innerHTML = nums.join(',');
    console.log(nums);

    qrs.forEach(({x1, y1, w, h}) => {
        myQRReader.ctx.strokeStyle = '#f00';
        myQRReader.ctx.strokeRect(x1, y1, w, h);
    });
});

// preview
document.body.appendChild(myQRReader.canvas);

myQRReader.start();
