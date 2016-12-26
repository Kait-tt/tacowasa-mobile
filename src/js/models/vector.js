'use strict';

class Vector {
    constructor (x, y) {
        this.x = x;
        this.y = y;
    }

    static sub (v1, v2) {
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    static dot (v1, v2){
        return v1.x * v2.x + v1.y * v2.y;
    }

    static cross (v1, v2) {
        return v1.x * v2.y - v1.y * v2.x;
    }

    get norm() {
        return Math.sqrt(Vector.dot(this, this));
    }

    // pcを中心としてp1からp2への回転距離
    // sign(asin(a x b) / |a| / |b|)) * √|c|
    //   a = p1 - pc
    //   b = p2 - pc
    //   c = p1 - p2
    static calcMoveAngle (p1, p2, pc) {
        const a = Vector.sub(p1, pc);
        const b = Vector.sub(p2, pc);
        const c = Vector.sub(p1, p2);
        const theta = Vector.cross(a, b) / a.norm / b.norm;
        const sign = Math.sign(theta);
        const dist = Math.sqrt(c.norm);
        return sign * dist;
    }
}


module.exports = Vector;
