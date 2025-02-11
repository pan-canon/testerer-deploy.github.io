export class ImageUtils {
  /**
   * Преобразует изображение на canvas в оттенки серого и возвращает dataURL результата.
   * @param {HTMLCanvasElement} canvas 
   * @returns {string} dataURL с изображением в формате PNG.
   */
  static convertToGrayscale(canvas) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Для каждого пикселя вычисляем среднее значение яркости и присваиваем его каналам R, G и B.
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
   * Пиксельная корреляция (сравниваем бинарные байты двух base64‑картинок).
   * @param {string} img1 base64‑строка первого изображения
   * @param {string} img2 base64‑строка второго изображения
   * @returns {number} коэффициент совпадения (от 0 до 1)
   */
  static pixelWiseComparison(img1, img2) {
    const decodeBase64 = img => atob(img.split(',')[1]);
    const image1 = decodeBase64(img1);
    const image2 = decodeBase64(img2);

    let matchCount = 0;
    const len = Math.min(image1.length, image2.length);
    for (let i = 0; i < len; i++) {
      if (Math.abs(image1.charCodeAt(i) - image2.charCodeAt(i)) < 100) {
        matchCount++;
      }
    }
    return matchCount / len;
  }

  /**
   * Гистограммная корреляция (сравниваем распределение яркостей двух base64‑картинок).
   * @param {string} img1 base64‑строка первого изображения
   * @param {string} img2 base64‑строка второго изображения
   * @returns {number} коэффициент совпадения (от 0 до 1)
   */
  static histogramComparison(img1, img2) {
    const hist1 = this.createHistogram(img1);
    const hist2 = this.createHistogram(img2);

    const diff = hist1.reduce((acc, val, i) => acc + Math.abs(val - hist2[i]), 0);
    const totalPixels = hist1.reduce((sum, val) => sum + val, 0);
    return 1 - (diff / (totalPixels * 1.2));
  }

  /**
   * Создаёт гистограмму (256 уровней) для изображения в формате base64.
   * @param {string} img base64‑строка изображения
   * @returns {number[]} массив длины 256 с количеством пикселей для каждого уровня яркости.
   */
  static createHistogram(img) {
    const hist = new Array(256).fill(0);
    const imgData = atob(img.split(',')[1]);
    for (let i = 0; i < imgData.length; i++) {
      hist[imgData.charCodeAt(i)]++;
    }
    return hist;
  }

  /**
   * Сравнивает два изображения (в формате base64) на основе ИИ с использованием face-api.js.
   * Модели загружаются из папки "/models". Функция обнаруживает лицо на каждом изображении и
   * вычисляет евклидову дистанцию между дескрипторами лиц.
   *
   * @param {string} imgBase64_1 base64‑строка первого изображения.
   * @param {string} imgBase64_2 base64‑строка второго изображения.
   * @returns {Promise<number|null>} возвращает число (чем меньше, тем ближе лица) или null, если лицо не найдено.
   */
  static async compareFacesUsingAI(imgBase64_1, imgBase64_2) {
    // Вспомогательная функция для загрузки изображения из base64.
    const loadImage = (base64) => new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
    
    try {
      const image1 = await loadImage(imgBase64_1);
      const image2 = await loadImage(imgBase64_2);

      // Проверяем, загружены ли модели; если нет — загружаем их из папки "/models".
      if (!faceapi.nets.faceRecognitionNet.params) {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
      }

      // Выполняем обнаружение лица и получение дескрипторов.
      const detection1 = await faceapi.detectSingleFace(image1).withFaceLandmarks().withFaceDescriptor();
      const detection2 = await faceapi.detectSingleFace(image2).withFaceLandmarks().withFaceDescriptor();

      if (!detection1 || !detection2) {
        console.error("Лицо не обнаружено на одном или обоих изображениях.");
        return null;
      }

      // Вычисляем евклидову дистанцию между дескрипторами (чем меньше, тем больше схожесть).
      const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
      return distance;
    } catch (error) {
      console.error("Ошибка при сравнении лиц:", error);
      return null;
    }
  }
}
