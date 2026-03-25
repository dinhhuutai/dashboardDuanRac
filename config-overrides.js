// const { override, useBabelRc } = require('customize-cra');

// module.exports = override(
//   // eslint-disable-next-line react-hooks/rules-of-hooks
//   useBabelRc(),
// );




const { override, useBabelRc } = require('customize-cra');
const fs = require('fs');
const path = require('path');

module.exports = override(
  useBabelRc(),

  (config, env) => {
    if (env === 'production') {
      const version = new Date().getTime();

      const manifestPath = path.resolve(__dirname, 'public/manifest.json');
      const buildManifestPath = path.resolve(__dirname, 'build/manifest.json');

      let manifest = fs.readFileSync(manifestPath, 'utf8');

      // thay version vào start_url
      manifest = manifest.replace(
        '"start_url": "/"',
        `"start_url": "/?v=${version}"`
      );

      // đảm bảo build folder tồn tại
      if (!fs.existsSync('build')) {
        fs.mkdirSync('build');
      }

      fs.writeFileSync(buildManifestPath, manifest);
    }

    return config;
  }
);