
module.exports = {
  diff: true,
  exclude: [
    './**/node_modules/**/*'
  ],
  extension: ['js'],
  recursive: true,
  reporter: 'spec',
  spec: [
    './**/*spec.js'
  ]
};
