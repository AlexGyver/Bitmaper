export default class Matrix {
    matrix = new Int8Array();
    width = 0;
    height = 0;

    get W() { return width; }
    get H() { return height; }

    constructor(width, height) {
        if (width && height) this.resize(width, height);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.matrix = new Int8Array(width * height);
    }

    merge(other) {
        if (this.matrix.length != other.matrix.length) return;
        for (let i = 0; i < this.matrix.length; i++) {
            let v = other.matrix[i];
            if (v) this.matrix[i] = (v == 1) ? 1 : 0;
        }
    }

    clone() {
        let m = new Matrix();
        m.width = this.width;
        m.width = this.width;
        m.matrix = new Int8Array(this.matrix);
        return m;
    }

    set(x, y, v) {
        this.matrix[y * this.width + x] = v;
    }

    get(x, y) {
        return this.matrix[y * this.width + x];
    }

    clear() {
        this.matrix.fill(0);
    }
}
