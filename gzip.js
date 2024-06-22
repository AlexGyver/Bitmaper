const fs = require('node:fs');
const zlib = require('zlib');

const folder = './dist/gzip';

try {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);
} catch (err) {
    console.error(err);
    process.exit();
}

fs.createReadStream('./dist/host/index.html').pipe(zlib.createGzip()).pipe(fs.createWriteStream(folder + '/index.html.gz'));
fs.createReadStream('./dist/host/script.js').pipe(zlib.createGzip()).pipe(fs.createWriteStream(folder + '/script.js.gz'));
fs.createReadStream('./dist/host/style.css').pipe(zlib.createGzip()).pipe(fs.createWriteStream(folder + '/style.css.gz'));

let code = `#pragma once
#include <Arduino.h>
`;

function addBin(name, gzip) {
    let code = `\nconst uint8_t bitmaper_${name}[] PROGMEM = {`;
    let data = fs.readFileSync(gzip).toString('hex');
    for (let i = 0; i < data.length; i += 2) {
        code += '0x' + data[i] + data[i + 1] + ', ';
    }
    code += '};\n'
    return code;
}

code += addBin('index', folder + '/index.html.gz');
code += addBin('script', folder + '/script.js.gz');
code += addBin('style', folder + '/style.css.gz');

fs.writeFile(folder + '/bitmaper.h', code, err => {
    if (err) console.error(err);
    else console.log('Done!');
});