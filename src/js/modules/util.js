'use strict';
const _ = require('lodash');

class Util {
    static parseURLQuery (_str = location.search) {
        const str = _.isString(_str) ? _str.trim() : null;
        if (!str) { return {}; }
        return _.fromPairs(str.slice(1).split('&').map(q => q.split('=')));
    }
}

module.exports = Util;
