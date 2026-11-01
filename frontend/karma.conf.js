// Karma configuration of "ng test" (referenced by angular.json, test > options > karmaConfig).
// Same as the Angular default, plus what the Jenkins pipeline needs:
//  - ChromeHeadlessCI: Chrome without a screen, able to start inside a Docker container
//  - a JUnit XML report (reports/junit), read by Jenkins like the Surefire/Failsafe reports of the back
//  - an lcov coverage report (reports/coverage), usable later by SonarQube
const path = require('path');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-junit-reporter')
    ],
    client: {
      jasmine: {},
      clearContext: false // keep the Jasmine results visible in the browser
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    reporters: ['progress', 'kjhtml', 'junit'],
    junitReporter: {
      outputDir: path.join(__dirname, 'reports/junit'),
      outputFile: 'front-tests.xml',
      useBrowserName: false
    },
    coverageReporter: {
      dir: path.join(__dirname, 'reports/coverage'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'lcovonly' }, { type: 'text-summary' }]
    },
    browsers: ['Chrome'],
    customLaunchers: {
      // A container has no sandbox for Chrome and a very small /dev/shm
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
      }
    },
    restartOnFileChange: true
  });
};
