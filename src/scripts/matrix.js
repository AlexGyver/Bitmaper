export default class Matrix {
    matrix = [];
    W = 0;
    H = 0;

    constructor(w, h) {
        this.resize(w, h);
    }

    resize(w, h) {
        if (w && h) {
            this.W = w;
            this.H = h;
            this.matrix = new Array(w * h).fill(0);
        }
    }

    merge(mx) {
        if (this.matrix.length != mx.matrix.length) return;
        for (let i = 0; i < this.matrix.length; i++) {
            let v = mx.matrix[i];
            if (v) this.matrix[i] = (v == 1) ? 1 : 0;
        }
    }

    clone() {
        let m = new Matrix();
        m.W = this.W;
        m.H = this.H;
        m.matrix = [...this.matrix];
        return m;
    }

    set(x, y, v) {
        if (x >= 0 && x < this.W && y >= 0 && y < this.H) {
            this.matrix[y * this.W + x] = v;
        }
    }

    get(x, y) {
        if (x >= 0 && x < this.W && y >= 0 && y < this.H) {
            return this.matrix[y * this.W + x];
        }
        return 0;
    }

    clear() {
        if (this.matrix) this.matrix.fill(0);
    }
}