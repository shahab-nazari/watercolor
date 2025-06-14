# Watercolor.js

A professional-grade JavaScript library for transforming images into realistic watercolor paintings. Watercolor.js leverages advanced image processing techniques to simulate authentic watercolor effects, including color bleeding, wet-in-wet blending, granulation, and edge preservation.

## Features

- **Realistic Watercolor Effects**: Simulates color bleeding, wet-in-wet blending, granulation, and bloom for authentic watercolor appearance.
- **Advanced Color Management**: Supports sRGB and CIELAB color spaces with K-means clustering for posterization.
- **Edge Preservation**: Uses Sobel edge detection to maintain sharp details where needed.
- **Perlin Noise**: Generates natural textures for paper grain and color variation.
- **Customizable Pipeline**: Extensive configuration options for fine-tuning effects.
- **Performance Optimized**: Asynchronous processing, separable Gaussian blur, and configurable precision levels.
- **Browser Compatible**: Works in modern browsers without external dependencies.

## Installation

You can include Watercolor.js in your project via CDN or by downloading the script locally.

### Via CDN
```html
<script src="https://cdn.jsdelivr.net/gh/shahab-nazari/watercolor/watercolor.js"></script>
```

### Via Local File
1. Download `watercolor.js` from the [releases page](https://github.com/shahab-nazari/watercolor/releases).
2. Include it in your HTML:
```html
<script src="path/to/watercolor.js"></script>
```

### Via npm (Coming Soon)
```bash
npm install watercolor-js
```
```javascript
import Watercolor from 'watercolor-js';
```

## Usage

### Basic Example
Apply the watercolor effect to an image with default settings:
```javascript
const img = new Image();
img.src = 'image.jpg';
Watercolor.apply(img).then(processedImg => {
  document.body.appendChild(processedImg);
}).catch(error => console.error('Processing failed:', error));
```

### Customized Example
Apply the effect with custom configuration:
```javascript
const img = new Image();
img.src = 'image.jpg';
Watercolor.apply(img, {
  blurRadius: 3,
  posterizeLevels: 6,
  colorSpace: 'lab',
  wetInWetEffect: 0.4,
  granulationIntensity: 0.3,
  vibrance: 1.2,
  quality: 0.98
}).then(processedImg => {
  document.body.appendChild(processedImg);
});
```

### Advanced Usage
Use the `ImageProcessor` class for fine-grained control:
```javascript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

const processor = Watercolor.createProcessor(imageData, {
  precision: 'high',
  colorSpace: 'lab'
});
processor.gaussianBlur(2);
processor.posterize(8);
processor.colorBleed(0.4, 4);
processor.wetInWet(0.3);
ctx.putImageData(imageData, 0, 0);
document.body.appendChild(canvas);
```

## Configuration Options

The following configuration options can be passed to `Watercolor.apply(image, config)`:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `blurRadius` | Number | 2 | Radius for Gaussian blur effect |
| `posterizeLevels` | Number | 8 | Number of color levels for posterization |
| `noiseIntensity` | Number | 20 | Intensity of color noise |
| `contrast` | Number | 1.1 | Contrast adjustment factor |
| `brightness` | Number | 15 | Brightness adjustment value |
| `colorBleedStrength` | Number | 0.4 | Strength of color bleeding effect |
| `colorSpreadMaxOffset` | Number | 4 | Maximum pixel offset for color spreading |
| `edgeThreshold` | Number | 150 | Lightness threshold for edge effects |
| `edgeIntensity` | Number | 35 | Intensity of edge granulation |
| `textureStrength` | Number | 0.25 | Strength of paper texture effect |
| `edgePreserve` | Boolean | true | Enable edge preservation using Sobel operator |
| `edgeDetectionThreshold` | Number | 25 | Threshold for edge detection |
| `wetInWetEffect` | Number | 0.3 | Strength of wet-in-wet blending |
| `granulationIntensity` | Number | 0.2 | Intensity of pigment granulation |
| `bloomRadius` | Number | 3 | Radius for bloom effect |
| `bloomIntensity` | Number | 0.15 | Intensity of bloom effect |
| `quality` | Number | 0.95 | JPEG output quality (0-1) |
| `multiThread` | Boolean | false | Enable experimental multi-threading (future support) |
| `precision` | String | 'medium' | Processing precision: 'low', 'medium', 'high' |
| `colorSpace` | String | 'srgb' | Color space: 'srgb' or 'lab' |
| `vibrance` | Number | 1.0 | Color vibrance adjustment |
| `saturation` | Number | 1.1 | Color saturation adjustment |

Access default configuration:
```javascript
console.log(Watercolor.defaults);
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Tips

- Use `precision: 'low'` for faster processing on low-end devices.
- Adjust `blurRadius` and `bloomRadius` to balance quality and performance.
- Use smaller images for real-time applications.
- Set `quality` to 0.8 or lower for smaller file sizes.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Make your changes and commit: `git commit -m 'Add feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by traditional watercolor painting techniques
- Built with performance optimization techniques from modern image processing literature
- Perlin noise implementation based on classic algorithms

## Contact

For issues or feature requests, please open an issue on the [GitHub repository](https://github.com/shahab-nazari/watercolor).

---
Happy painting with Watercolor.js! 🎨
