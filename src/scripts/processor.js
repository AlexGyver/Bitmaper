function make1bit(m) {
    return [...m.matrix];
}
function make8horiz(m) {
    let data = [];
    let chunk = Math.ceil(m.W / 8);
    for (let y = 0; y < m.H; y++) {
        for (let xx = 0; xx < chunk; xx++) {
            let byte = 0;
            for (let b = 0; b < 8; b++) {
                byte <<= 1;
                byte |= m.get(xx * 8 + b, y);
            }
            data.push(byte);
        }
    }
    return data;
}
function make8vert(m) {
    let data = [];
    let chunk = Math.ceil(m.H / 8);
    for (let x = 0; x < m.W; x++) {
        for (let yy = 0; yy < chunk; yy++) {
            let byte = 0;
            for (let b = 0; b < 8; b++) {
                byte >>= 1;
                byte |= (m.get(x, yy * 8 + b) << 7);
            }
            data.push(byte);
        }
    }
    return data;
}
function make8vert_row(m) {
    let data = [];
    let chunk = Math.ceil(m.H / 8);
    for (let yy = 0; yy < chunk; yy++) {
        for (let x = 0; x < m.W; x++) {
            let byte = 0;
            for (let b = 0; b < 8; b++) {
                byte >>= 1;
                byte |= (m.get(x, yy * 8 + b) << 7);
            }
            data.push(byte);
        }
    }
    return data;
}
function makeBitpack(m) {
    let data = [(m.H & 0xff), (m.H >> 8) & 0xff, 0, 0];
    let i = 0, value = 0, shift = 0;

    let push = () => {
        let chunk = (i << 1) | value;
        switch ((shift++) & 0b11) {
            case 0:
                data.push(chunk << 2);
                break;
            case 1:
                data[data.length - 1] |= chunk >> 4;
                data.push((chunk << 4) & 0b11110000);
                break;
            case 2:
                data[data.length - 1] |= chunk >> 2;
                data.push((chunk << 6) & 0b11000000);
                break;
            case 3:
                data[data.length - 1] |= chunk;
                break;
        }
    }

    for (let x = 0; x < m.W; x++) {
        for (let y = 0; y < m.H; y++) {
            let v = m.get(x, y);
            if (!i) {
                i = 1;
                value = v;
            } else {
                if (value == v) {
                    i++;
                    if (i == 31) {
                        push();
                        i = 0;
                    }
                } else {
                    push();
                    value = v;
                    i = 1;
                }
            }
        }
    }
    if (i) push();

    let len = data.length - 4;
    data[2] = len & 0xff;
    data[3] = (len >> 8) & 0xff;
    return data;
}
function makeBitmap(m) {
    return [(m.W & 0xff), ((m.W >> 8) & 0xff), (m.H & 0xff), ((m.H >> 8) & 0xff)].concat(make8vert_row(m));
}
function makeCodeArray(data, width = 16) {
    let code = '';
    let i = 0;
    for (let byte of data) {
        if (!i) code += '\n\t';
        code += `0x${byte.toString(16).padStart(2, 0)}, `;
        if (++i == width) i = 0;
    }
    return code;
}

function makeData(m, type) {
    switch (type) {
        case 0: return make1bit(m);
        case 1: return make8horiz(m);
        case 2: return make8vert(m);
        case 3: {
            let mapsize = Math.ceil(m.H / 8) * m.W + 4;
            let pack = makeBitpack(m);
            return (mapsize <= pack.length) ? [0].concat(makeBitmap(m)) : [1].concat(pack)
        }
        case 4: return makeBitmap(m);
        case 5: return makeBitpack(m);
    }
}

export const processNames = [
    '1x pix/byte',
    '8x Horizontal',
    '8x Vertical',
    'GyverGFX Image',
    'GyverGFX BitMap',
    'GyverGFX BitPack',
];

export function makeBlob(m, type) {
    let data = makeData(m, type);
    let bytes = Int8Array.from(data);
    return new Blob([bytes], { type: "application/octet-stream" });
}

export function downloadBin(m, type, name) {
    let blob = makeBlob(m, type);
    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    switch (type) {
        case 0:
        case 1:
        case 2: name += '.bin'; break;
        case 3: name += '.img'; break;
        case 4: name += '.map'; break;
        case 5: name += '.pack'; break;
    }
    link.download = name;
    link.click();
}

export function downloadCode(m, type, name) {
    let code = makeCode(m, type, name);
    let str = '#pragma once\n' +
        '#include <Arduino.h>\n' +
        '#include <GyverGFX.h>\n\n' +
        `// ${name} (${code.size} bytes)\n` +
        `// ${processNames[type]}\n\n` +
        code.code;

    let enc = new TextEncoder();
    let bytes = enc.encode(str);
    let blob = new Blob([bytes], { type: "text/plain" });
    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);

    link.download = name + '.h';
    link.click();
}

export function makeCode(m, type, name) {
    let code = '';

    switch (type) {
        case 0:  // '1x pix/byte'
            code += `const uint8_t ${name}_${m.W}x${m.H}[] PROGMEM = {`;
            break;

        case 1:  // '8x Horizontal (MSB left)'
            code += `const uint8_t ${name}_${m.W}x${m.H}[] PROGMEM = {`;
            break;

        case 2:  // '8x Vertical (MSB bottom)'
            code += `const uint8_t ${name}_${m.W}x${m.H}[] PROGMEM = {`;
            break;

        case 3:  // 'GyverGFX Image'
            code += `gfximage_t ${name}_${m.W}x${m.H}[] PROGMEM = {`;
            break;

        case 4:  // 'GyverGFX BitMap'
            code += `gfxmap_t ${name}_${m.W}x${m.H}[] PROGMEM = {`;
            break;

        case 5:  // 'GyverGFX BitPack'
            code += `gfxpack_t ${name}_${m.W}x${m.H}[] PROGMEM = {`;
            break;
    }

    let data = makeData(m, type);
    code += makeCodeArray(data, 24);
    code += '\n};'
    return { code: code, size: data.length };
}