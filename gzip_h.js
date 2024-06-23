const p = require('./package.json');
const in_folder = './dist/host';
const out_folder = './dist/gzip';

const fs = require('node:fs');
const { promisify } = require('node:util');
const { createGzip } = require('node:zlib');
const { pipeline } = require('node:stream');
const pipe = promisify(pipeline);

async function gzip(input, output) {
    const gzip = createGzip();
    const source = fs.createReadStream(input);
    const destination = fs.createWriteStream(output);
    await pipe(source, gzip, destination);
}

async function compile() {
    const index_gz = out_folder + '/index.html.gz';
    const script_gz = out_folder + '/script.js.gz';
    const style_gz = out_folder + '/style.css.gz';

    try {
        if (!fs.existsSync(out_folder)) fs.mkdirSync(out_folder);
        await gzip(in_folder + '/index.html', index_gz);
        await gzip(in_folder + '/script.js', script_gz);
        await gzip(in_folder + '/style.css', style_gz);
    } catch (err) {
        console.error(err);
        return;
    }

    let index_len = fs.statSync(index_gz).size;
    let script_len = fs.statSync(script_gz).size;
    let style_len = fs.statSync(style_gz).size;

    let code = `#pragma once
#include <Arduino.h>

/*
    ${p.name}.h
    index: ${index_len} bytes
    script: ${script_len} bytes
    style: ${style_len} bytes
    total: ${index_len + script_len + style_len} bytes
    
    Build: ${new Date()}
*/
`;

    function addBin(fname, gzip) {
        let code = `\r\nconst uint8_t ${p.name}_${fname}[] PROGMEM = {`;
        let data = fs.readFileSync(gzip).toString('hex');
        for (let i = 0; i < data.length; i += 2) {
            code += '0x' + data[i] + data[i + 1] + ', ';
        }
        code += '};\r\n'
        return code;
    }

    code += addBin('index', index_gz);
    code += addBin('script', script_gz);
    code += addBin('style', style_gz);

    fs.writeFile(`${out_folder}/${p.name}.h`, code, err => {
        if (err) console.error(err);
        else console.log('Done!');
    });
}

compile();