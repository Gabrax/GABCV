import { build, defineConfig } from "vite";
import path from 'path';

export default {
    build: {
        assetsInlineLimit: 0,
        assetsInclude: ['**/*.mp3', '**/*.jpg', '**/*.png'],
        rollupOptions: {
            input: {
                main: path.resolve(__dirname,'index.html'),
                home: path.resolve(__dirname,'pages/home/home.html'),
                viewer: path.resolve(__dirname,'pages/model_viewer/model_viewer.html'),
                visualizer: path.resolve(__dirname,'pages/music_visualizer/music_visualizer.html'),
                tetris: path.resolve(__dirname,'pages/tetris/tetrisGame.html'),
            },
        }
    },
  }
