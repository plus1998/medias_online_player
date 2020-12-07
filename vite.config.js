const path = require('path');

export default {
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