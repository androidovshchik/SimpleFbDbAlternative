const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: [
        './src/main.prod.ts'
    ],
    target: 'node',
    externals: [
        nodeExternals({
            whitelist: [],
        }),
    ],
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }]
    },
    mode: 'production',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    ecma: 6,
                },
            })
        ]
    },
    plugins: [],
    output: {
        path: __dirname,
        filename: 'server.min.js',
    },
};
