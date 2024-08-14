import CyrillicToTranslit from 'cyrillic-to-translit-js';
import { RGBtoHEX } from './utils';

export default class ImageLoader {
    name = '';
    image;
    first = false;
    offset = { x: 0, y: 0, dx: 0, dy: 0, w: 0 };

    async load(img) {
        return new Promise((res, rej) => {
            const image = new Image();
            image.crossOrigin = "Anonymous";

            image.addEventListener('load', () => {
                if (image.width && image.height) {
                    this.image = image;
                    this.first = true;
                    res();
                } else {
                    rej("Image error");
                }
            });
            image.addEventListener('error', () => {
                rej("Image load error");
            });

            switch (typeof img) {
                case 'object':
                    if (!img.type.toString().includes('image')) {
                        rej("Not an image");
                    }
                    image.src = URL.createObjectURL(img);
                    this.name = this._getName(img.name);
                    break;

                case 'string':
                    if (!img.startsWith('http')) {
                        rej("Not a link");
                    }
                    image.src = img;
                    this.name = this._getName(img);
                    break;

                default:
                    rej("Image error");
                    break;
            }
        });
    }

    scale(dir) {
        if (!this.image) return;
        this.offset.w += dir * this.offset.w / 64;
    }

    pan(dx, dy, stop) {
        if (!this.image) return;
        this.offset.dx = dx;
        this.offset.dy = dy;
        if (stop) {
            this.offset.x -= this.offset.dx;
            this.offset.dx = 0;
            this.offset.y -= this.offset.dy;
            this.offset.dy = 0;
        }
    }

    show(cvbase, angle, background, filters) {
        if (!this.image) return;
        this._render(cvbase.cv, angle, background, filters);
        cvbase.grid();
    }

    fit(cvbase) {
        this.offset = { x: 0, y: 0, dx: 0, dy: 0, w: 0 };
        let w = cvbase.cv.width;
        let h = w * this.image.height / this.image.width;
        if (h > cvbase.cv.height) {
            w *= cvbase.cv.height / h;
            h = cvbase.cv.height;
        }
        this.offset.w = w / cvbase.cv.width;
    }

    setOffset(offset) {
        this.first = false;
        this.offset = offset;
    }

    render(cvbase, angle, background, filters) {
        if (!this.image) return;
        if (this.first) {
            this.first = false;
            this.fit(cvbase);
        }

        // copy of display canvas
        let cv = document.createElement("canvas");
        cv.width = cvbase.cv.width;
        cv.height = cvbase.cv.height;
        let cx = cv.getContext("2d");
        cx.fillStyle = background ? 'white' : 'black';
        cx.fillRect(0, 0, cv.width, cv.height);
        this._render(cv, angle, background, filters);

        // pixel to pixel output
        let cv2 = document.createElement("canvas");
        cv2.width = cvbase.W;
        cv2.height = cvbase.H;
        let cx2 = cv2.getContext("2d");

        cx2.drawImage(cv, 0, 0, cv2.width, cv2.height);

        cvbase.clear();
        let data = cx2.getImageData(0, 0, cvbase.W, cvbase.H).data;
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            if (data[i + 3]) { // alpha
                cvbase.matrix[j] = RGBtoHEX(data[i], data[i + 1], data[i + 2]);
            }
        }
    }

    _render(dest, angle, background, filters) {
        let cv = document.createElement("canvas");
        let w = dest.width * this.offset.w;
        let h = w * this.image.height / this.image.width;
        let hypot = Math.sqrt(w ** 2 + h ** 2);
        cv.width = hypot;
        cv.height = hypot;
        let cx = cv.getContext("2d");

        cx.save();
        cx.translate(hypot / 2, hypot / 2);
        cx.rotate(-angle * 0.0174533);
        cx.filter = `invert(${filters.invert ?? 0}) brightness(${filters.brightness ?? 0}%) contrast(${filters.contrast ?? 0}%) saturate(${filters.saturate ?? 0}%) grayscale(${filters.grayscale ?? 0}%) blur(${(filters.blur ?? 0) * hypot / 64}px)`;
        cx.drawImage(this.image, -w / 2, -h / 2, w, h);
        cx.restore();

        let cxd = dest.getContext("2d");
        cxd.fillStyle = background ? 'white' : 'black';
        cxd.fillRect(0, 0, dest.width, dest.height);
        cxd.drawImage(
            cv,
            (this.offset.x - this.offset.dx) + (hypot - dest.width) / 2,
            (this.offset.y - this.offset.dy) + (hypot - dest.height) / 2,
            dest.width, dest.height,
            0, 0, dest.width, dest.height
        );
    }

    _getName(str) {
        const translit = new CyrillicToTranslit();
        str = translit.transform(str, '_');
        str = str.substring(str.lastIndexOf('/') + 1, str.lastIndexOf('.')).replaceAll('-', '_').substring(0, 10);
        if (!str.length) str = 'bitmap';
        else if (str[0] >= '0' && str[0] <= '9') str = 'b' + str;
        return str;
    }
}