const { override } = require('customize-cra');

// Suppress source map warnings from html5-qrcode and other node_modules
const suppressSourceMapWarnings = () => (config) => {
  // Ignore source map warnings
  config.ignoreWarnings = [
    {
      module: /node_modules/,
    },
    {
      file: /\.map$/,
    },
    /Failed to parse source map/,
    /ENOENT: no such file or directory/,
  ];
  
  // Modify source-map-loader to exclude node_modules
  if (config.module && config.module.rules) {
    config.module.rules.forEach((rule) => {
      if (rule.enforce === 'pre' && rule.use) {
        rule.use.forEach((use) => {
          if (use.loader && use.loader.includes('source-map-loader')) {
            if (!rule.exclude) {
              rule.exclude = /node_modules/;
            }
          }
        });
      }
    });
  }
  
  return config;
};

module.exports = override(
  suppressSourceMapWarnings()
);
