export default class Matrix {
    matrix = new Int32Array();
    W = 0;
    H = 0;

    constructor(w, h) {
        this.resize(w, h);
    }

    resize(w, h) {
        if (w && h) {
            this.W = w;
            this.H = h;
            this.matrix = new Int32Array(w * h).fill(0);
        }
    }

    merge(mx) {
        if (this.matrix.length != mx.matrix.length) return;
        for (let i = 0; i < this.matrix.length; i++) {
            let v = mx.matrix[i];
            if (v) this.matrix[i] = (v == 1) ? 1 : 0;
        }
    }

    set(x, y, v) {
        this.matrix[y * this.W + x] = v;
    }

    get(x, y) {
        return this.matrix[y * this.W + x];
    }

    clear() {
        this.matrix.fill(0);
    }
}