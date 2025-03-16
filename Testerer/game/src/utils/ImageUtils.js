// ImageUtils.js
export class ImageUtils {
  /**
   * Converts the canvas image to grayscale and returns the data URL.
   * @param {HTMLCanvasElement} canvas 
   * @returns {string} Data URL with PNG format.
   */
  static convertToGrayscale(canvas) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const avg = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
      pixels[i] = avg;
      pixels[i+1] = avg;
      pixels[i+2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  /**
   * Performs pixel-wise comparison between two base64 images.
   * @param {string} img1 Base64 string of the first image.
   * @param {string} img2 Base64 string of the second image.
   * @returns {number} Matching coefficient between 0 and 1.
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
   * Performs histogram comparison between two base64 images.
   * @param {string} img1 Base64 string of the first image.
   * @param {string} img2 Base64 string of the second image.
   * @returns {number} Matching coefficient between 0 and 1.
   */
  static histogramComparison(img1, img2) {
    const hist1 = this.createHistogram(img1);
    const hist2 = this.createHistogram(img2);
    const diff = hist1.reduce((acc, val, i) => acc + Math.abs(val - hist2[i]), 0);
    const totalPixels = hist1.reduce((sum, val) => sum + val, 0);
    return 1 - (diff / (totalPixels * 1.2));
  }

  /**
   * Creates a histogram (256 levels) for a base64 image.
   * @param {string} img Base64 string of the image.
   * @returns {number[]} Array of length 256 with pixel counts.
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
   * Compares two face images using AI via face-api.js.
   * Loads models from "/models" if not already loaded.
   * @param {string} imgBase64_1 Base64 string of the first image.
   * @param {string} imgBase64_2 Base64 string of the second image.
   * @returns {Promise<number|null>} Euclidean distance or null if a face is not detected.
   */
  static async compareFacesUsingAI(imgBase64_1, imgBase64_2) {
    const loadImage = (base64) => new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
    try {
      const image1 = await loadImage(imgBase64_1);
      const image2 = await loadImage(imgBase64_2);
      if (!faceapi.nets.faceRecognitionNet.params) {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
      }
      const detection1 = await faceapi.detectSingleFace(image1).withFaceLandmarks().withFaceDescriptor();
      const detection2 = await faceapi.detectSingleFace(image2).withFaceLandmarks().withFaceDescriptor();
      if (!detection1 || !detection2) {
        console.error("Face not detected in one or both images.");
        return null;
      }
      return faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
    } catch (error) {
      console.error("Error comparing faces:", error);
      return null;
    }
  }

  /**
   * applyFilterToCanvas
   * Applies a filter effect to a canvas and returns a new data URL.
   * For example, for 'nightVision' the image brightness/contrast can be adjusted.
   * @param {HTMLCanvasElement} canvas
   * @param {string} filterType - 'nightVision', 'blackWhite', or ''.
   * @returns {string} Data URL of the processed image.
   */
  static applyFilterToCanvas(canvas, filterType) {
    const ctx = canvas.getContext("2d");
    // Save current state
    ctx.save();
    if (filterType === 'nightVision') {
      // Example: increase brightness and add a green tint
      ctx.filter = 'brightness(150%) contrast(120%) sepia(100%) hue-rotate(90deg)';
    } else if (filterType === 'blackWhite') {
      ctx.filter = 'grayscale(100%)';
    } else {
      ctx.filter = 'none';
    }
    // Redraw the current canvas content with the filter applied
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);
    // Restore state and return new data URL
    ctx.restore();
    return canvas.toDataURL("image/png");
  }
}