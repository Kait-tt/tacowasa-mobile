'use strict';
const io = require('socket.io-client');

class Socket {
    constructor (url = null, opts = null) {
        this.io = io.connect(url, opts);
    }
}

module.exports = Socket;
