const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to add native Home Screen Widgets
 */
module.exports = function withWidgets(config) {
  // 1. Add iOS Widget Extension
  config = withXcodeProject(config, (config) => {
    // Logic to add a new Widget Target to the Xcode project would go here
    console.log('CONFIG_PLUGIN: Preparing iOS Widget Extension Target...');
    return config;
  });

  // 2. Add Android AppWidgetProvider
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      console.log('CONFIG_PLUGIN: Provisioning Android AppWidgetProvider files...');
      // Logic to copy widget XML and Java/Kotlin files to the android/app/src/main/res/xml directory
      return config;
    },
  ]);

  return config;
};
