import { build, defineConfig } from "vite";
import path from 'path';

export default {
    build: {
        assetsInlineLimit: 0,
        assetsInclude: ['**/*.mp3', '**/*.jpg', '**/*.png'],
        rollupOptions: {
            input: {
                main: path.resolve(__dirname,'index.html'),
                visualizer: path.resolve(__dirname,'music_visualizer/music_visualizer.html'),
            },
        }
    },
  }
