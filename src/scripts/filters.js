import { constrain, round } from "./utils";

export function threshold(arr, val) {
    for (let i = 0; i < arr.length; i++) {
        arr[i] = (arr[i] < val) ? 0 : 255;
    }
    return arr;
}

export function dither(arr, w, h) {
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let idx = y * w + x;
            let col = (arr[idx] < 128 ? 0 : 255);
            let err = arr[idx] - col;
            arr[idx] = col;
            if (x + 1 < w) arr[idx + 1] += (err * 7) >> 4;
            if (y + 1 == h) continue;

            if (x > 0) arr[idx + w - 1] += (err * 3) >> 4;
            arr[idx + w] += (err * 5) >> 4;
            if (x + 1 < w) arr[idx + w + 1] += (err * 1) >> 4;
        }
    }
}

export function edges_simple(arr, w, h) {
    const kernel = [[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]];
    let t = [...arr];

    for (let x = 1; x < w - 1; x++) {
        for (let y = 1; y < h - 1; y++) {
            let sum = 0;
            for (let kx = -1; kx <= 1; kx++) {
                for (let ky = -1; ky <= 1; ky++) {
                    let val = t[(x + kx) + (y + ky) * w];
                    sum += kernel[ky + 1][kx + 1] * val;
                }
            }
            arr[x + y * w] = round(constrain(sum, 0, 255));
        }
    }
}

export function edges_median(arr, w, h) {
    // let kernel = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]];
    let kernel = [[0, 0], [0, 1], [1, 0]];
    let t = [...arr];

    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            if (!((x == 0) || (x == w - 1) || (y == 0) || (y == h - 1))) {
                let sum = [];
                for (let i = 0; i < kernel.length; i++) {
                    sum.push(t[(x + kernel[i][0]) + (y + kernel[i][1]) * w]);
                }
                sum.sort();
                let v = sum[sum.length - 1] - sum[0];
                arr[x + y * w] = round(constrain(v, 0, 255));
            }
        }
    }
}

export function edges_sobel(arr, w, h, k) {
    const kernel_x = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const kernel_y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    let t = [...arr];

    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            let sum_x = 0;
            let sum_y = 0;

            if (!((x == 0) || (x == w - 1) || (y == 0) || (y == h - 1))) {
                for (let kx = -1; kx <= 1; kx++) {
                    for (let ky = -1; ky <= 1; ky++) {
                        let val = arr[(x + kx) + (y + ky) * w];
                        sum_x += kernel_x[ky + 1][kx + 1] * val;
                        sum_y += kernel_y[ky + 1][kx + 1] * val;
                    }
                }
            }

            let sum = Math.sqrt(sum_x ** 2 + sum_y ** 2);
            t[x + y * w] = constrain(sum, 0, 255);
        }
    }

    for (let i = 0; i < arr.length; i++) {
        let val = arr[i] * (1 - k) + t[i] * k;
        arr[i] = round(val);
    }
}