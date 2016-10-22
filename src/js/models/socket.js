'use strict';
const io = require('socket.io-client');

class Socket {
    constructor () {
        this.io = io.connect();
    }

    on (name, callback) {
        this.io.on(name, callback);
    }

    emit (name, params) {
        this.io.emit(name, params);
    }

    join (projectId) {
        let joined = false;
        this.io.on('connect', () => {
            if (!joined) {
                joined = true;
                this.io.emit('joinProjectRoom', {projectId: projectId});
            }
        });

        if (this.io.connected) {
            if (!joined) {
                joined = true;
                this.io.emit('joinProjectRoom', {projectId: projectId});
            }
        }

        this.io.on('disconnect', () => {
            joined = false;
        });
    }
}

module.exports = Socket;
