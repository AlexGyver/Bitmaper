export function constrain(x, min, max) {
    return (x < min) ? min : (x > max ? max : x);
}
export function round(x) {
    return x << 0;
}
export function RGBtoHEX(r, g, b) {
    return (r << 16) | (g << 8) | b;
}
export function HEXtoRGB(hex) {
    return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}