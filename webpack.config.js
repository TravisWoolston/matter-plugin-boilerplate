"use strict";

const webpack = require('webpack');
const replace = require('replace-in-file');
const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');
const Case = require('case');
const name = Case.kebab(pkg.name);
const date = new Date().toISOString().slice(0, 10);
const author = pkg.author.slice(0, pkg.author.indexOf(' <'));
const banner = `${name} ${pkg.version} by ${author} ${date}
${pkg.homepage}
License ${pkg.license}`;

var postBuildTasks = { 
  apply: function(compiler) {
    compiler.plugin('after-emit', function(compiler, callback) {
      var matterToolsPath = path.dirname(require.resolve('matter-tools')) + '/build/matter-tools.demo.js';

      // replace constants
      replace.sync({
        files: ['index.js', 'docs/examples/*.js', 'docs/demo/index.html'],
        replace: [
          /(['"])(.*)(['"][;,\s]*\/\/\s*PLUGIN_NAME)/g,
          /(['"])(.*)(['"][;,\s]*\/\/\s*PLUGIN_VERSION)/g,
          /(['"])(.*)(['"][;,\s]*\/\/\s*PLUGIN_REPO_URL)/g
        ],
        with: [
          "$1" + name + "$3", 
          "$1" + pkg.version + "$3",
          "$1" + pkg.repository.url.replace('.git', '') + "$3"
        ]
      });

      // copy libs to demo
      copySync(require.resolve('matter-js'), 'docs/demo/matter.js');
      copySync(matterToolsPath, 'docs/demo/matter-tools.demo.js');
      copySync('build/' + name + '.js', 'docs/demo/bundle.js');

      // done
      callback();
    });
  }
};

var copySync = function(src, dest) {
  fs.writeFileSync(dest, fs.readFileSync(src));
  console.info('copied', path.basename(dest));
};

module.exports = {
  entry: {
    [name]: './index.js',
    [name + '.min']: './index.js'
  },
  output: {
    library: Case.pascal(name),
    path: './build',
    publicPath: '/demo',
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  externals: {
    'matter-js': 'Matter'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true
    }),
    new webpack.BannerPlugin(banner),
    postBuildTasks
  ]
};