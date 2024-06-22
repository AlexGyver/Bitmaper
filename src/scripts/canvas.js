import Matrix from "./matrix";

export default class CanvasMatrix extends Matrix {
    constructor(cv, onclick, ondrag, onwheel, on = '#478be6', off = 'black') {
        super();

        if (!cv) return;

        this.cv = cv;
        this.cx = cv.getContext("2d");
        this.setColors(on, off);

        this._onclick = onclick;
        this._ondrag = ondrag;
        this._onwheel = onwheel;

        window.addEventListener('resize', () => this._resize());
        cv.addEventListener("mousedown", e => this._onMouseDown(e));
        cv.addEventListener("mousewheel", e => this._onMouseWheel(e));
        cv.addEventListener("contextmenu", e => e.preventDefault());
        document.addEventListener("mousemove", e => this._onMouseMove(e));
        document.addEventListener("mouseup", e => this._onMouseUp(e));
    }

    setColors(on, off) {
        this.on = on;
        this.off = off;
        this.cx.strokeStyle = off;
    }

    resize(w, h) {
        super.resize(w, h);
        this._resize();
    }

    render() {
        this.cx.fillStyle = this.off;
        this.cx.fillRect(0, 0, this.cv.width, this.cv.height);

        let b = this._blocksize;
        this.cx.fillStyle = this.on;

        for (let x = 0; x < this.W; x++) {
            for (let y = 0; y < this.H; y++) {
                if (this.get(x, y)) {
                    this.cx.fillRect(x * b, y * b, b, b);
                    if (b > 3) this.cx.strokeRect(x * b, y * b, b, b);
                }
            }
        }
        this.cx.fillStyle = this.off;
    }

    grid() {
        let b = this._blocksize;
        for (let x = 0; x < this.W; x++) {
            this.cx.beginPath();
            this.cx.moveTo(x * b, 0);
            this.cx.lineTo(x * b, this.cv.height);
            this.cx.stroke();
        }
        for (let y = 0; y < this.H; y++) {
            this.cx.beginPath();
            this.cx.moveTo(0, y * b);
            this.cx.lineTo(this.cv.width, y * b);
            this.cx.stroke();
        }
    }

    _blocksize = 0;
    _scale = /*window.devicePixelRatio*/ 1;
    _pressed = false;
    _dragged = false;
    _pressXY = [];
    realW = 0;
    realh = 0;

    _resize() {
        if (!this.cv) return;

        let w = this.cv.parentNode.clientWidth;
        w = Math.floor(w / this.W) * this.W;
        if (!w) w = this.W;
        let h = w * this.H / this.W;
        this._blocksize = w / this.W;

        this.cv.width = w;
        this.cv.height = h;
        this.cx.lineWidth = this._blocksize / 64;

        w = this.cv.parentNode.clientWidth;
        h = w * this.H / this.W;
        if (h > 800) {
            h = 800;
            w = h * this.W / this.H;
        }
        this.realW = w;
        this.realH = h;
        this.cv.style.width = w + 'px';
        this.cv.style.height = h + 'px';
        this.render();
    }
    _onMouseWheel(e) {
        this._onwheel(e.deltaY < 0 ? 1 : -1);
    }
    _onMouseDown(e) {
        this._pressed = true;
        this._dragged = false;
        this._pressXY = this._getXY(e);
    }
    _onMouseMove(e) {
        if (!this._pressed) return;
        if (!this._dragged) {
            this.cv.style.cursor = 'grab';
            document.body.style.cursor = 'grab';
        }

        this._dragged = true;
        let xy = this._getXY(e);
        this._ondrag(this._drag(xy, false), { 1: 0, 4: 1, 2: 2 }[e.buttons]);
    }
    _onMouseUp(e) {
        if (!this._pressed) return;

        this._pressed = false;
        let xy = this._getXY(e);
        if (this._dragged) {
            this.cv.style.cursor = 'pointer';
            document.body.style.cursor = 'default';
            this._ondrag(this._drag(xy, true), e.button);
        } else {
            this._onclick(this._blockXY(xy), e.button);
        }
        this._dragged = false;
    }
    _getXY(e) {
        let x = e.pageX;
        let y = e.pageY;
        if (this.cv.offsetParent.tagName.toUpperCase() === "BODY") {
            x -= this.cv.offsetLeft;
            y -= this.cv.offsetTop;
        } else {
            x -= this.cv.offsetParent.offsetLeft;
            y -= this.cv.offsetParent.offsetTop;
        }
        x *= this.cv.width / this.realW;
        y *= this.cv.height / this.realH;
        return { x: x, y: y }
    }
    _blockXY(xy) {
        return { x: Math.floor(xy.x / this.cv.width * this.W), y: Math.floor(xy.y / this.cv.height * this.H) };
    }
    _drag(xy, release) {
        return { dx: xy.x - this._pressXY.x, dy: xy.y - this._pressXY.y, block: this._blockXY(xy), release: release };
    }
};