import Matrix from "./matrix";

/**
 * @param {Matrix} mx 
 */
export function threshold(mx, val) {
    mx.matrix = mx.matrix.map(x => x < val ? 0 : 1)
}

/**
 * @param {Matrix} mx 
 */
export function inverse(mx) {
    mx.matrix = mx.matrix.map(x => 255 - x)
}

/**
 * @param {Matrix} mx 
 */
export function brightContrast(mx, bright, contr) {
    mx.matrix = mx.matrix.map(x => {
        x = (x * contr + bright);
        return (x < 0) ? 0 : ((x > 255) ? 255 : x);
    });
}

/**
 * @param {Matrix} mx 
 */
export function gamma(mx, val) {
    mx.matrix = mx.matrix.map(x => Math.min(255, Math.pow(x, val)));
}

/**
 * @param {Matrix} mx 
 */
export function dither(mx) {
    for (let y = 0; y < mx.H; y++) {
        for (let x = 0; x < mx.W; x++) {
            let idx = y * mx.W + x;
            let col = (mx.matrix[idx] < 128 ? 0 : 255);
            let err = mx.matrix[idx] - col;
            mx.matrix[idx] = col;
            if (x + 1 < mx.W) mx.matrix[idx + 1] += (err * 7) >> 4;
            if (y + 1 == mx.H) continue;

            if (x > 0) mx.matrix[idx + mx.W - 1] += (err * 3) >> 4;
            mx.matrix[idx + mx.W] += (err * 5) >> 4;
            if (x + 1 < mx.W) mx.matrix[idx + mx.W + 1] += (err * 1) >> 4;
        }
    }
}

/**
 * @param {Matrix} mx 
 */
export function edges(mx) {
    const kernel = [[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]];
    let t = mx.clone();

    for (let x = 1; x < t.W - 1; x++) {
        for (let y = 1; y < t.H - 1; y++) {
            let sum = 0;
            for (let kx = -1; kx <= 1; kx++) {
                for (let ky = -1; ky <= 1; ky++) {
                    let val = t.get(x + kx, y + ky);
                    sum += kernel[ky + 1][kx + 1] * val;
                }
            }
            sum = (sum < 0) ? 0 : (sum > 255 ? 255 : sum);
            mx.set(x, y, sum);
        }
    }
}

/**
 * @param {Matrix} mx 
 */
export function edges_median(mx) {
    // let kernel = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]];
    let kernel = [[0, 0], [0, 1], [1, 0]];
    let t = mx.clone();

    for (let x = 0; x < mx.W; x++) {
        for (let y = 0; y < mx.H; y++) {
            if (!((x == 0) || (x == mx.W - 1) || (y == 0) || (y == mx.H - 1))) {
                let sum = [];
                for (let i = 0; i < kernel.length; i++) {
                    sum.push(t.get(x + kernel[i][0], y + kernel[i][1]));
                }
                sum.sort();
                let v = sum[sum.length - 1] - sum[0];
                mx.set(x, y, v);
            }
        }
    }
}

/**
 * @param {Matrix} mx 
 */
export function sobel(mx, k) {
    const kernel_x = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const kernel_y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    let t = mx.clone();

    for (let x = 0; x < mx.W; x++) {
        for (let y = 0; y < mx.H; y++) {
            let sum_x = 0;
            let sum_y = 0;

            if (!((x == 0) || (x == mx.W - 1) || (y == 0) || (y == mx.H - 1))) {
                for (let kx = -1; kx <= 1; kx++) {
                    for (let ky = -1; ky <= 1; ky++) {
                        let val = mx.get(x + kx, y + ky);
                        sum_x += kernel_x[ky + 1][kx + 1] * val;
                        sum_y += kernel_y[ky + 1][kx + 1] * val;
                    }
                }
            }

            let sum = Math.sqrt(sum_x ** 2 + sum_y ** 2);
            sum = (sum < 0) ? 0 : (sum > 255 ? 255 : sum);
            t.set(x, y, sum);
        }
    }

    for (let i = 0; i < t.matrix.length; i++) {
        let val = mx.matrix[i] * (1 - k) + t.matrix[i] * k;
        mx.matrix[i] = val;
    }

}

/**
 * @param {Matrix} mx 
 */
export function blur(mx) {
    let t = mx.clone();

    let v = 1 / 16;
    let kernel = [[1, 2, 1], [2, 4, 2], [1, 2, 1]];

    // let v = 1 / 9;
    // let kernel = [[1, 1, 1], [1, 1, 1], [1, 1, 1]];

    kernel = kernel.map(y => y.map(x => x *= v));

    for (let y = 1; y < mx.H - 1; y++) {
        for (let x = 1; x < mx.W - 1; x++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    sum += kernel[ky + 1][kx + 1] * t.get(x + kx, y + ky);
                }
            }
            mx.set(x, y, sum);
        }
    }
}