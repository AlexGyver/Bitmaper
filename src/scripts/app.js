import QuickSettings from './quicksettings'
import CanvasMatrix from './canvas'
import Matrix from './matrix';
import ImageLoader from './imageloader';
import * as filt from './filters';
import * as proc from './processor';
import Timer from './timer';

let base_ui, filt_ui;
const preview_delay = 400;
let canvas = new CanvasMatrix();
let image = new ImageLoader();
let editor = new Matrix();
let timer = new Timer();

const displayModes = {
    labels: [
        'OLED',
        'Paper'
    ],
    values: [
        { on: '#478be6', off: 'black', inv: false },
        { on: 'black', off: 'white', inv: true }
    ]
};

async function file_h(file) {
    try {
        await image.load(file);
    } catch (e) {
        alert(e);
        return;
    }
    editor.clear();
    base_ui.setValue("Name", image.name);
    // setDefaults();
    update_h();
}
async function link_h(link) {
    if (link.length) {
        await file_h(link);
        base_ui.setValue("Image Link", "");
    }
}

function resize_h() {
    let wh = [base_ui.getValue("Width"), base_ui.getValue("Height")];
    canvas.resize(wh[0], wh[1]);
    editor.resize(wh[0], wh[1]);
    if (Math.max(wh[0], wh[1]) > 500) filt_ui.setValue("Preview", false);
    update_h();
}

function fit_h() {
    if (image.image) image.fit(canvas);
    update_h();
}

function update_h() {
    if (image.image) {
        let inv = displayModes.values[filt_ui.getValue("Display Style").index].inv ^ filt_ui.getValue("Inverse");
        image.render(canvas, base_ui.getValue("Rotate"), inv);

        let gamma = filt_ui.getValue("Gamma");
        let sobel = filt_ui.getValue("Sobel Edges");
        if (gamma != 1.0) filt.gamma(canvas, gamma);
        filt.brightContrast(canvas, filt_ui.getValue("Brightness"), filt_ui.getValue("Contrast"));
        if (filt_ui.getValue("Blur")) filt.blur(canvas);
        if (filt_ui.getValue("Edges")) filt.edges(canvas);
        if (sobel) filt.sobel(canvas, sobel);
        if (filt_ui.getValue("Dither")) filt.dither(canvas);
        filt.threshold(canvas, filt_ui.getValue("Threshold") * 2.56);
        if (filt_ui.getValue("Median Edges")) filt.edges_median(canvas);
    }
    render();
}

function render() {
    canvas.merge(editor);
    canvas.render();

    let result = proc.makeCode(canvas, base_ui.getValue("Process").index, base_ui.getValue("Name"));
    base_ui.setValue("Code", result.code);

    let info = `${canvas.W}x${canvas.H} (${result.size} bytes)<br>`;
    info += Math.round(canvas.matrix.filter(v => v == 1).length / canvas.matrix.length * 100) + '% pixels on'
    base_ui.setValue("Result", info);
}

function display_h() {
    let colors = displayModes.values[filt_ui.getValue("Display Style").index];
    canvas.setColors(colors.on, colors.off);
    update_h();
}

function reset_h() {
    base_ui.setValue("Rotate", 0);
    filt_ui.setValue("Inverse", 0);
    filt_ui.setValue("Brightness", 0);
    filt_ui.setValue("Contrast", 1);
    filt_ui.setValue("Threshold", 50);
    filt_ui.setValue("Edges", 0);
    filt_ui.setValue("Dither", 0);
    editor.clear();
}

// ============== EDITOR ==============
function btn_to_val(btn) {
    // 0 lmb, 1 mmb, 2 rmb
    return (btn == 0) ? 1 : (btn == 1 ? 0 : -1);
}
function click_h(v, button) {
    if (filt_ui.getValue("Editor")) {
        editor.set(v.x, v.y, btn_to_val(button));
        update_h();
    }
}

// ============== MOUSE ==============
function drag_h(v, button) {
    if (filt_ui.getValue("Editor")) {
        editor.set(v.block.x, v.block.y, btn_to_val(button));
        update_h();
        return;
    }

    editor.clear();
    image.pan(v.dx, v.dy, v.release);
    if (filt_ui.getValue("Preview") || v.release) {
        update_h();
    } else {
        image.show(canvas, base_ui.getValue("Rotate"));
    }
}
function wheel_h(v) {
    if (filt_ui.getValue("Editor")) {
        return;
    }
    timer.stop();
    editor.clear();
    image.scale(v);

    if (filt_ui.getValue("Preview")) {
        update_h();
    } else {
        image.show(canvas, base_ui.getValue("Rotate"));
        timer.start(update_h, preview_delay);
    }
}
function rotate_h() {
    editor.clear();

    if (filt_ui.getValue("Preview")) {
        update_h();
    } else {
        image.show(canvas, base_ui.getValue("Rotate"));
        timer.start(update_h, preview_delay);
    }
}

// ============== SAVE ==============
function copy_h() {
    navigator.clipboard.writeText(base_ui.getValue("Code"));
}
function saveH_h() {
    proc.downloadCode(canvas, base_ui.getValue("Process").index, base_ui.getValue("Name"));
}
function saveBin_h() {
    proc.downloadBin(canvas, base_ui.getValue("Process").index, base_ui.getValue("Name"));
}
function send_h() {
    let blob = proc.makeBlob(canvas, base_ui.getValue("Process").index);
    let formData = new FormData();
    formData.append('bitmap', blob);

    fetch(window.location.href + `bitmap?width=${canvas.W}&height=${canvas.H}`, {
        method: 'POST',
        body: formData
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if ('serviceWorker' in navigator && typeof USE_SW !== 'undefined') {
        navigator.serviceWorker.register('sw.js');
    }

    // export
    let exp_block = document.createElement('div');
    exp_block.id = 'export';
    exp_block.className = 'export';

    // canvas
    let cv_cont = document.createElement('div');
    cv_cont.className = 'cv_cont';
    let cv_inner = document.createElement('div');
    cv_inner.className = 'cv_inner';
    let cv = document.createElement('canvas');
    cv.className = 'canvas';

    cv_inner.append(cv);
    cv_cont.append(cv_inner);
    document.body.append(exp_block, cv_cont);

    canvas = new CanvasMatrix(cv, click_h, drag_h, wheel_h, displayModes.values[0].on, displayModes.values[0].off);

    let buttons = { "Copy": copy_h, ".h": saveH_h, ".bin": saveBin_h };
    if (window.location.hostname.match(/^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$/)) {
        buttons["Send"] = send_h;
    }

    // base_ui
    base_ui = QuickSettings.create(0, 0, "Bitmaper")
        .addFileChooser("Image File", "", "", file_h)
        .addText("Image Link", "", link_h)
        .addText("Name", "", update_h)
        .addHTML("", " ")
        .addNumber("Width", 1, 10000, 128, 1, resize_h)
        .addNumber("Height", 1, 10000, 64, 1, resize_h)
        .addButton("Fit", fit_h)
        .addRange('Rotate', -180, 180, 0, 5, rotate_h)
        .addDropDown("Process", proc.processNames, update_h)
        .addHTML("Result", "")
        .addTextArea("Code")
        .addButtons(buttons)
        .addButton("Info", info_h)
        .setWidth(200)
        .setDraggable(false)
        .setCollapsible(false);

    base_ui.setValue("Process", 3);

    filt_ui = QuickSettings.create(0, 0, "Filter", exp_block)
        .addDropDown("Display Style", displayModes.labels, display_h)
        .addBoolean("Preview", 1)
        .addBoolean("Inverse", 0, update_h)
        .addRange('Gamma', 0.9, 1.2, 1.0, 0.005, update_h)
        .addRange('Brightness', -128, 128, 0, 1, update_h)
        .addRange('Contrast', 0, 5.0, 1.0, 0.1, update_h)
        .addBoolean("Blur", 0, update_h)
        .addBoolean("Edges", 0, update_h)
        .addRange('Sobel Edges', 0, 1, 0, 0.05, update_h)
        .addBoolean("Dither", 0, update_h)
        .addRange('Threshold', 0, 100, 50, 1, update_h)
        .addBoolean("Median Edges", 0, update_h)
        .addBoolean("Editor", 0)
        .addButton("Reset", reset_h)
        .setWidth(200)
        .setDraggable(false)
        .setCollapsible(false);

    resize_h();
});

function info_h() {
    let text = `Bitmaper - программа для преобразования картинок в битмапы

PROCESS
- 1x pix/byte - 1 пиксель в байте, строками слева направо сверху вниз [data_0, ...data_n]
- 8x Horizontal - 8 пикселей в байте горизонтально (MSB слева), строками слева направо сверху вниз [data_0, ...data_n]
- 8x Vertical - 8 пикселей в байте вертикально (MSB снизу), столбцами сверху вниз слева направо  [data_0, ...data_n]
- GyverGFX BitMap - 8 пикселей вертикально (MSB снизу), строками слева направо сверху вниз: [widthLSB, widthMSB, heightLSB, heightMSB, data_0, ...data_n]
- GyverGFX BitPack - сжатый формат*: [heightLSB, heightMSB, lenLSB, lenMSB, data_0, ...data_n]
- GyverGFX Image - программа выберет лёгкий между BitMap и BitPack: [0 map | 1 pack, x, x, x, x, data_0, ...data_n]
* На изображениях со сплошными участками BitPack может быть в разы эффективнее обычного BitMap. На изображениях с dithering работает неэффективно.

ФИЛЬТРЫ
- Inverse - инвертировать цвета
- Gamma - логарифмическая яркость
- Brightness - яркость
- Contrast - контраст
- Blur - размытие
- Edges - усиление краёв
- Sobel Edges - выделение краёв с настройкой интенсивности
- Dither - псевдо оттенки серого через шум
- Threshold - порог разделения оттенков серого на белый и чёрный. Не имеет смысла при включённом Dither
- Median Edges - выделение краёв в толщину 1px. Работает на ч/б изображении, поэтому зависит от Threshold

РЕДАКТОР (Editor)
- Действия кнопок мыши при включенном редакторе: ЛКМ - добавить точку, ПКМ - стереть точку, СКМ - отменить изменения на слое редактора
- При изменении размера битмапа, при перемещении и масштабировании изображения слой редактора очищается

ПРОЧЕЕ
- Активный пиксель на выбранном стиле отображения: OLED - голубой, Paper - чёрный
- При открытии приложения с локального сервера (IP адрес в строке адреса), например с esp, появится кнопка Send - при нажатии приложение отправит битмап в выбранном формате через formData на url /bitmap с query string параметрами width и height, т.е. <ip>/bitmap?width=N&height=N`;

    let info_cont = document.createElement('div');
    let info_inner = document.createElement('div');
    let info_close = document.createElement('button');
    let info_text = document.createElement('span');

    info_cont.className = 'info_cont';
    info_text.innerText = text;
    info_inner.className = 'info_inner';
    info_close.addEventListener('click', () => info_cont.remove());
    info_cont.addEventListener('click', () => info_cont.remove());
    info_inner.addEventListener('click', (e) => e.stopPropagation());
    info_close.innerText = 'x';

    info_inner.append(info_close, info_text);
    info_cont.append(info_inner);
    document.body.append(info_cont);
}