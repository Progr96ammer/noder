const path = require('path');

module.exports = {
    entry: './src/javascript.js',
    mode: 'development',
    watch:true,
    output: {
        path: path.resolve(__dirname, './public/javascripts'),
        filename: 'bundle.js',
    },
};