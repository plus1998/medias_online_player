const path = require('path');

export default {
    base: './',
    outDir: './docker/dist',
    assetsDir: 'static',
    alias: {
        '/@/': path.resolve(__dirname, './src'),
    },
    cssPreprocessOptions: {
        scss: {
            modifyVars: {
                'preprocess-custom-color': 'green'
            }
        }
    }
}