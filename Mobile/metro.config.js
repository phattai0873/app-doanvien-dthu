const { getDefaultConfig } = require('expo/metro-config');

/**
 * Standard Metro Config for Expo SDK 54
 * Adding this explicitly helps resolve module resolution issues on Windows
 * when the default config fails to follow imports.
 */
const config = getDefaultConfig(__dirname);

module.exports = config;
