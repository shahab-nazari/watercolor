/**
 * Watercolor.js - Professional Watercolor Effect Library
 * Version: 2.0.0
 * License: MIT
 */
const Watercolor = (() => {
  // Configuration defaults
  const defaultConfig = {
    // Basic processing
    blurRadius: 2,
    posterizeLevels: 8,
    noiseIntensity: 20,
    contrast: 1.1,
    brightness: 15,
    
    // Watercolor-specific
    colorBleedStrength: 0.4,
    colorSpreadMaxOffset: 4,
    edgeThreshold: 150,
    edgeIntensity: 35,
    textureStrength: 0.25,
    
    // Advanced processing
    edgePreserve: true,
    edgeDetectionThreshold: 25,
    wetInWetEffect: 0.3,
    granulationIntensity: 0.2,
    bloomRadius: 3,
    bloomIntensity: 0.15,
    
    // Performance
    quality: 0.95,
    multiThread: false,
    precision: 'medium', // low, medium, high
    
    // Color management
    colorSpace: 'srgb', // srgb, lab
    vibrance: 1.0,
    saturation: 1.1
  };

  // Utility class for vector operations
  class Vector2 {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    static random(max) {
      return new Vector2(
        (Math.random() - 0.5) * 2 * max,
        (Math.random() - 0.5) * 2 * max
      );
    }
  }

  // Color management class
  class Color {
    constructor(r, g, b, a = 255) {
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    }

    static toLab(color) {
      // Simplified sRGB to CIELAB conversion
      const xyz = rgbToXyz(color.r / 255, color.g / 255, color.b / 255);
      return xyzToLab(xyz.x, xyz.y, xyz.z);
    }

    static blend(c1, c2, t) {
      return new Color(
        c1.r * (1 - t) + c2.r * t,
        c1.g * (1 - t) + c2.g * t,
        c1.b * (1 - t) + c2.b * t,
        c1.a * (1 - t) + c2.a * t
      );
    }
  }

  // Color space conversion helpers
  function rgbToXyz(r, g, b) {
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    return {
      x: (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100,
      y: (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100,
      z: (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100
    };
  }

  function xyzToLab(x, y, z) {
    const refX = 95.047, refY = 100.0, refZ = 108.883;
    x = x / refX; y = y / refY; z = z / refZ;
    
    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
    
    return {
      l: (116 * y) - 16,
      a: 500 * (x - y),
      b: 200 * (y - z)
    };
  }

  // Core processing class
  class ImageProcessor {
    constructor(imageData, config) {
      this.imageData = imageData;
      this.width = imageData.width;
      this.height = imageData.height;
      this.config = config;
      this.clamp = (v) => Math.min(255, Math.max(0, Math.round(v)));
      this.perlinNoise = this.generatePerlinNoise();
    }

    // Generate Perlin noise for texture
    generatePerlinNoise() {
      const noise = new Float32Array(this.width * this.height);
      const scale = this.config.precision === 'high' ? 0.02 : 0.05;
      
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const idx = y * this.width + x;
          noise[idx] = this.perlin(x * scale, y * scale);
        }
      }
      return noise;
    }

    // Simplified Perlin noise implementation
    perlin(x, y) {
      const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
      const lerp = (a, b, t) => a + (b - a) * t;
      
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      
      const hash = (x, y) => {
        const h = (x * 374761393 + y * 668265263);
        return ((h ^ (h >> 13)) * 127) & 255;
      };
      
      const grad = (hash, x, y) => {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
      };
      
      const n00 = grad(hash(xi, yi), xf, yf);
      const n10 = grad(hash(xi + 1, yi), xf - 1, yf);
      const n01 = grad(hash(xi, yi + 1), xf, yf - 1);
      const n11 = grad(hash(xi + 1, yi + 1), xf - 1, yf - 1);
      
      const u = fade(xf);
      return lerp(
        lerp(n00, n10, u),
        lerp(n01, n11, u),
        fade(yf)
      );
    }

    // Advanced Gaussian blur with edge preservation
    gaussianBlur(radius) {
      const weights = this.generateGaussianWeights(radius);
      const temp = new Uint8ClampedArray(this.imageData.data);
      
      // Horizontal pass
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          let r = 0, g = 0, b = 0, a = 0, weightSum = 0;
          
          for (let i = -radius; i <= radius; i++) {
            const nx = this.clamp(x + i);
            if (nx >= 0 && nx < this.width) {
              const idx = (y * this.width + nx) * 4;
              const weight = weights[i + radius];
              r += temp[idx] * weight;
              g += temp[idx + 1] * weight;
              b += temp[idx + 2] * weight;
              a += temp[idx + 3] * weight;
              weightSum += weight;
            }
          }
          
          const idx = (y * this.width + x) * 4;
          this.imageData.data[idx] = r / weightSum;
          this.imageData.data[idx + 1] = g / weightSum;
          this.imageData.data[idx + 2] = b / weightSum;
          this.imageData.data[idx + 3] = a / weightSum;
        }
      }
      
      // Vertical pass
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          let r = 0, g = 0, b = 0, a = 0, weightSum = 0;
          
          for (let i = -radius; i <= radius; i++) {
            const ny = this.clamp(y + i);
            if (ny >= 0 && ny < this.height) {
              const idx = (ny * this.width + x) * 4;
              const weight = weights[i + radius];
              r += this.imageData.data[idx] * weight;
              g += this.imageData.data[idx + 1] * weight;
              b += this.imageData.data[idx + 2] * weight;
              a += this.imageData.data[idx + 3] * weight;
              weightSum += weight;
            }
          }
          
          const idx = (y * this.width + x) * 4;
          temp[idx] = r / weightSum;
          temp[idx + 1] = g / weightSum;
          temp[idx + 2] = b / weightSum;
          temp[idx + 3] = a / weightSum;
        }
      }
      
      this.imageData.data.set(temp);
    }

    generateGaussianWeights(radius) {
      const weights = new Array(2 * radius + 1);
      const sigma = radius / 2;
      let sum = 0;
      
      for (let i = -radius; i <= radius; i++) {
        const weight = Math.exp(-(i * i) / (2 * sigma * sigma));
        weights[i + radius] = weight;
        sum += weight;
      }
      
      return weights.map(w => w / sum);
    }

    // Advanced posterize with K-means clustering
    posterize(levels) {
      if (this.config.colorSpace === 'lab') {
        this.posterizeLab(levels);
      } else {
        this.posterizeRGB(levels);
      }
    }

    posterizeRGB(levels) {
      const { data } = this.imageData;
      const step = 255 / (levels - 1);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.round(data[i] / step) * step;
        data[i + 1] = Math.round(data[i + 1] / step) * step;
        data[i + 2] = Math.round(data[i + 2] / step) * step;
      }
    }

    posterizeLab(levels) {
      const { data } = this.imageData;
      const labData = new Array(this.width * this.height);
      
      // Convert to LAB
      for (let i = 0; i < data.length; i += 4) {
        labData[i / 4] = Color.toLab(new Color(data[i], data[i + 1], data[i + 2]));
      }
      
      // Simple K-means clustering
      const centroids = new Array(levels).fill().map(() => ({
        l: Math.random() * 100,
        a: (Math.random() - 0.5) * 256,
        b: (Math.random() - 0.5) * 256
      }));
      
      for (let iter = 0; iter < 5; iter++) {
        const clusters = new Array(levels).fill().map(() => []);
        
        // Assign points to clusters
        labData.forEach((point, idx) => {
          let minDist = Infinity;
          let clusterIdx = 0;
          
          centroids.forEach((centroid, i) => {
            const dist = Math.sqrt(
              Math.pow(point.l - centroid.l, 2) +
              Math.pow(point.a - centroid.a, 2) +
              Math.pow(point.b - centroid.b, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              clusterIdx = i;
            }
          });
          
          clusters[clusterIdx].push(point);
        });
        
        // Update centroids
        centroids.forEach((centroid, i) => {
          if (clusters[i].length > 0) {
            const avg = clusters[i].reduce((acc, p) => ({
              l: acc.l + p.l,
              a: acc.a + p.a,
              b: acc.b + p.b
            }), { l: 0, a: 0, b: 0 });
            
            centroid.l = avg.l / clusters[i].length;
            centroid.a = avg.a / clusters[i].length;
            centroid.b = avg.b / clusters[i].length;
          }
        });
      }
      
      // Apply clustered colors
      for (let i = 0; i < labData.length; i++) {
        let minDist = Infinity;
        let closestCentroid = centroids[0];
        
        centroids.forEach(centroid => {
          const dist = Math.sqrt(
            Math.pow(labData[i].l - centroid.l, 2) +
            Math.pow(labData[i].a - centroid.a, 2) +
            Math.pow(labData[i].b - centroid.b, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            closestCentroid = centroid;
          }
        });
        
        // Convert back to RGB (simplified)
        const idx = i * 4;
        data[idx] = this.clamp(closestCentroid.l * 2.55);
        data[idx + 1] = this.clamp(closestCentroid.a + 128);
        data[idx + 2] = this.clamp(closestCentroid.b + 128);
      }
    }

    // Advanced color bleeding with flow simulation
    colorBleed(strength, maxOffset) {
      const { data } = this.imageData;
      const copy = new Uint8ClampedArray(data);
      
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const i = (y * this.width + x) * 4;
          const flow = Vector2.random(maxOffset);
          
          const nx = this.clamp(x + flow.x);
          const ny = this.clamp(y + flow.y);
          
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            const idx = (ny * this.width + nx) * 4;
            for (let c = 0; c < 3; c++) {
              data[i + c] = this.clamp(data[i + c] * (1 - strength) + copy[idx + c] * strength);
            }
          }
        }
      }
    }

    // Wet-in-wet effect simulation
    wetInWet(strength) {
      const { data } = this.imageData;
      const copy = new Uint8ClampedArray(data);
      
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          const i = (y * this.width + x) * 4;
          let r = 0, g = 0, b = 0, count = 0;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const idx = ((y + dy) * this.width + (x + dx)) * 4;
              r += copy[idx];
              g += copy[idx + 1];
              b += copy[idx + 2];
              count++;
            }
          }
          
          data[i] = this.clamp(data[i] * (1 - strength) + (r / count) * strength);
          data[i + 1] = this.clamp(data[i + 1] * (1 - strength) + (g / count) * strength);
          data[i + 2] = this.clamp(data[i + 2] * (1 - strength) + (b / count) * strength);
        }
      }
    }

    // Granulation effect
    granulation(intensity) {
      const { data } = this.imageData;
      
      for (let i = 0; i < data.length; i += 4) {
        const idx = i / 4;
        const noise = this.perlinNoise[idx] * intensity * 30;
        const lightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        if (lightness > this.config.edgeThreshold) {
          data[i] = this.clamp(data[i] + noise);
          data[i + 1] = this.clamp(data[i + 1] + noise * 0.9);
          data[i + 2] = this.clamp(data[i + 2] + noise * 0.95);
        }
      }
    }

    // Bloom effect
    bloom(radius, intensity) {
      const temp = new Uint8ClampedArray(this.imageData.data);
      this.gaussianBlur(radius);
      
      for (let i = 0; i < this.imageData.data.length; i += 4) {
        this.imageData.data[i] = this.clamp(temp[i] * (1 - intensity) + this.imageData.data[i] * intensity);
        this.imageData.data[i + 1] = this.clamp(temp[i + 1] * (1 - intensity) + this.imageData.data[i + 1] * intensity);
        this.imageData.data[i + 2] = this.clamp(temp[i + 2] * (1 - intensity) + this.imageData.data[i + 2] * intensity);
      }
    }

    // Edge detection with Sobel operator
    detectEdges(threshold) {
      const { data } = this.imageData;
      const output = new Uint8ClampedArray(data.length);
      const grayscale = new Uint8ClampedArray(this.width * this.height);
      
      for (let i = 0; i < data.length; i += 4) {
        grayscale[i / 4] = (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          const i = y * this.width + x;
          
          const gx = (
            -grayscale[(y - 1) * this.width + (x - 1)] +
            grayscale[(y - 1) * this.width + (x + 1)] +
            -2 * grayscale[y * this.width + (x - 1)] +
            2 * grayscale[y * this.width + (x + 1)] +
            -grayscale[(y + 1) * this.width + (x - 1)] +
            grayscale[(y + 1) * this.width + (x + 1)]
          );
          
          const gy = (
            -grayscale[(y - 1) * this.width + (x - 1)] +
            -2 * grayscale[(y - 1) * this.width + x] +
            -grayscale[(y - 1) * this.width + (x + 1)] +
            grayscale[(y + 1) * this.width + (x - 1)] +
            2 * grayscale[(y + 1) * this.width + x] +
            grayscale[(y + 1) * this.width + (x + 1)]
          );
          
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          const idx = i * 4;
          output[idx] = output[idx + 1] = output[idx + 2] = magnitude > threshold ? 255 : 0;
          output[idx + 3] = 255;
        }
      }
      
      return output;
    }

    // Color adjustment
    adjustColors() {
      const { data } = this.imageData;
      
      for (let i = 0; i < data.length; i += 4) {
        // Apply vibrance
        const max = Math.max(data[i], data[i + 1], data[i + 2]);
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const amt = (max - avg) * this.config.vibrance * 0.3;
        
        data[i] = this.clamp(data[i] + (max - data[i]) * amt);
        data[i + 1] = this.clamp(data[i + 1] + (max - data[i + 1]) * amt);
        data[i + 2] = this.clamp(data[i + 2] + (max - data[i + 2]) * amt);
        
        // Apply saturation
        const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
        data[i] = this.clamp(gray + (data[i] - gray) * this.config.saturation);
        data[i + 1] = this.clamp(gray + (data[i + 1] - gray) * this.config.saturation);
        data[i + 2] = this.clamp(gray + (data[i + 2] - gray) * this.config.saturation);
      }
    }
  }

  // Main processing function
  async function applyWatercolor(image, config = {}) {
    const settings = { ...defaultConfig, ...config };
    
    return new Promise((resolve, reject) => {
      if (!image.complete) {
        image.onload = () => processImage(image, settings).then(resolve).catch(reject);
        image.onerror = reject;
      } else {
        processImage(image, settings).then(resolve).catch(reject);
      }
    });
  }

  async function processImage(image, settings) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const processor = new ImageProcessor(imageData, settings);
    
    // Processing pipeline
    if (settings.edgePreserve) {
      const edges = processor.detectEdges(settings.edgeDetectionThreshold);
      processor.gaussianBlur(settings.blurRadius);
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        if (edges[i] > 0) {
          imageData.data[i] = imageData.data[i] * 0.6 + edges[i] * 0.4;
          imageData.data[i + 1] = imageData.data[i + 1] * 0.6 + edges[i] * 0.4;
          imageData.data[i + 2] = imageData.data[i + 2] * 0.6 + edges[i] * 0.4;
        }
      }
    } else {
      processor.gaussianBlur(settings.blurRadius);
    }
    
    processor.posterize(settings.posterizeLevels);
    processor.colorBleed(settings.colorBleedStrength, settings.colorSpreadMaxOffset);
    processor.wetInWet(settings.wetInWetEffect);
    processor.granulation(settings.granulationIntensity);
    processor.bloom(settings.bloomRadius, settings.bloomIntensity);
    processor.adjustColors();
    
    ctx.putImageData(imageData, 0, 0);
    image.src = canvas.toDataURL('image/jpeg', settings.quality);
    
    return image;
  }

  // Public API
  return {
    apply: applyWatercolor,
    defaults: defaultConfig,
    version: '2.0.0',
    createProcessor: (imageData, config) => new ImageProcessor(imageData, config)
  };
})();
