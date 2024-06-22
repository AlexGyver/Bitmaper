# Bitmaper
Программа для преобразования изображений в bitmap

## Как запустить
- Веб-версия - https://alexgyver.github.io/Bitmaper/, можно установить как веб-приложение
- [HTML версия](https://github.com/AlexGyver/Bitmaper/releases/latest/download/bitmaper.html) - открывать в браузере
- [.h версия](https://github.com/AlexGyver/Bitmaper/releases/latest/download/bitmaper.h) - для вставки в ESP проект с сервером

https://github.com/AlexGyver/Bitmaper/releases/latest

## Как собрать из исходников
- Установить [VS Code](https://code.visualstudio.com/download)
- Установить [Node JS](https://nodejs.org/en/download/prebuilt-installer)
- Открыть папку в VS Code
- Консоль **Ctrl + `**
- `npm install`
- `npm run build`

## Описание
### Алгоритмы кодирования
- `1x pix/byte` - 1 пиксель в байте, строками слева направо сверху вниз [data_0, ...data_n]
- `8x Horizontal` - 8 пикселей в байте горизонтально (MSB слева), строками слева направо сверху вниз [data_0, ...data_n]
- `8x Vertical` - 8 пикселей в байте вертикально (MSB снизу), столбцами сверху вниз слева направо  [data_0, ...data_n]
- `GyverGFX BitMap` - 8 пикселей вертикально (MSB снизу), строками слева направо сверху вниз: [widthLSB, widthMSB, heightLSB, heightMSB, data_0, ...data_n]
- `GyverGFX BitPack` - сжатый формат*: [heightLSB, heightMSB, lenLSB, lenMSB, data_0, ...data_n]
- `GyverGFX Image` - программа выберет лёгкий между BitMap и BitPack: [0 map | 1 pack, x, x, x, x, data_0, ...data_n]

* На изображениях со сплошными участками BitPack может быть в разы эффективнее обычного BitMap. На изображениях с dithering работает неэффективно.

### Фильтры
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

### Редактор (Editor)
- Действия кнопок мыши при включенном редакторе: ЛКМ - добавить точку, ПКМ - стереть точку, СКМ - отменить изменения на слое редактора
- При изменении размера битмапа, при перемещении и масштабировании изображения слой редактора очищается

### Прочее
- Активный пиксель на выбранном стиле отображения: OLED - голубой, Paper - чёрный
- При открытии приложения с локального сервера (IP адрес в строке адреса), например с esp, появится кнопка Send - при нажатии приложение отправит битмап в выбранном формате через formData на url /bitmap с query string параметрами width и height, т.е. `<ip>/bitmap?width=N&height=N`