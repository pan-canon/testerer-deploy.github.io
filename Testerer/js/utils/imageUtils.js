export function convertToGrayscale(canvas) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Проходим по каждому пикселю (RGBA), усредняем
    for (let i = 0; i < pixels.length; i += 4) {
        let avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        pixels[i] = avg;
        pixels[i + 1] = avg;
        pixels[i + 2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL("image/png");
}

/**
 * Пиксельная корреляция (сравниваем бинарные байты двух base64-картинок)
 */
export function pixelWiseComparison(img1, img2) {
    let image1 = atob(img1.split(',')[1]);
    let image2 = atob(img2.split(',')[1]);

    let matchCount = 0;
    // Перебираем все байты
    for (let i = 0; i < image1.length && i < image2.length; i++) {
        if (Math.abs(image1.charCodeAt(i) - image2.charCodeAt(i)) < 100) {
            matchCount++;
        }
    }
    return matchCount / Math.min(image1.length, image2.length);
}

/**
 * Гистограммная корреляция (сравниваем распределение яркостей)
 */
export function histogramComparison(img1, img2) {
    let hist1 = this.createHistogram(img1);
    let hist2 = this.createHistogram(img2);

    let diff = 0;
    for (let i = 0; i < hist1.length; i++) {
        diff += Math.abs(hist1[i] - hist2[i]);
    }

    // Числитель: сумма отклонений, знаменатель: суммарное число пикселей * некий коэффициент
    let totalPixels1 = hist1.reduce((a, b) => a + b, 0);
    return 1 - (diff / (totalPixels1 * 1.2));
}

/**
 * Создаём гистограмму (256 уровней) из base64
 */
export function createHistogram(img) {
    let hist = new Array(256).fill(0);
    let imgData = atob(img.split(',')[1]);

    for (let i = 0; i < imgData.length; i++) {
        hist[imgData.charCodeAt(i)]++;
    }
    return hist;
}