# Bitmaper
Программа для преобразования изображений в bitmap

## Как запустить
- Веб-версия - https://alexgyver.github.io/Bitmaper/, можно установить как веб-приложение
- Релиз [HTML версия](https://github.com/AlexGyver/Bitmaper/releases/latest/download/bitmaper.html) - открывать в браузере
- Релиз [.h версия](https://github.com/AlexGyver/Bitmaper/releases/latest/download/bitmaper.h) - для вставки в ESP проект с сервером. Смотри пример в папке arduino

## Как собрать из исходников
- Установить [VS Code](https://code.visualstudio.com/download)
- Установить [Node JS](https://nodejs.org/en/download/prebuilt-installer)
- Открыть папку в VS Code
- Консоль **Ctrl + `**
- `npm install`, дождаться установки зависимостей
- `npm run build` или запустить скрипт *build.bat*
- Проект соберётся в папку dist

## Описание
### Режимы изображения
- `Mono` - монохромный (чёрно-белый)
- `Gray` - оттенки серого
- `RGB` - полноцветное изображение

### Алгоритмы кодирования
- `1x pix/byte` - 1 пиксель в байте, строками слева направо сверху вниз [data_0, ...data_n]
- `8x Horizontal` - 8 пикселей в байте горизонтально (MSB слева), строками слева направо сверху вниз [data_0, ...data_n]
- `8x Vertical` - 8 пикселей в байте вертикально (MSB снизу), столбцами сверху вниз слева направо  [data_0, ...data_n]
- `GyverGFX BitMap` - 8 пикселей вертикально (MSB снизу), строками слева направо сверху вниз: [widthLSB, widthMSB, heightLSB, heightMSB, data_0, ...data_n]
- `GyverGFX BitPack` - сжатый формат*: [heightLSB, heightMSB, lenLSB, lenMSB, data_0, ...data_n]
- `GyverGFX Image` - программа выберет лёгкий между BitMap и BitPack: [0 map | 1 pack, x, x, x, x, data_0, ...data_n]
- `Grayscale` - 1 пиксель в байте, оттенки серого
- `RGB888` - 1 пиксель на 3 байта (24 бит RGB) [r0, g0, b0, ...]
- `RGB565` - 1 пиксель на 2 байта (16 бит RGB) [rrrrrggggggbbbbb, ...], тип uint16
- `RGB233` - 1 пиксель в байте (8 бит RGB) [rrgggbbb]

\* На изображениях со сплошными участками BitPack может быть в разы эффективнее обычного BitMap. На изображениях с dithering работает неэффективно.

> Как кодирует BitPack: младший бит - состояние пикселя, остальные - количество. Сканирование идёт столбцами сверху вниз слева направо. Один чанк - 6 бит (состояние + 5 бит количества), 4 чанка пакуются в три байта как aaaaaabb, bbbbcccc, ccdddddd

### Редактор (Editor)
- Действия кнопок мыши при включенном редакторе: ЛКМ - добавить точку, ПКМ - стереть точку, СКМ - отменить изменения на слое редактора
- При изменении размера битмапа, при перемещении и масштабировании изображения слой редактора очищается

### Прочее
- Активный пиксель на выбранном стиле отображения: `OLED` - голубой, `Paper` - чёрный
- При открытии приложения с локального сервера (IP адрес в строке адреса), например с esp, появится кнопка Send - при нажатии приложение отправит битмап в выбранном формате через formData на url /bitmap с query string параметрами width и height, т.е. `<ip>/bitmap?width=N&height=N`
