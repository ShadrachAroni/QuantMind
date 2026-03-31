const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and dependencies
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. (IMPORTANT) If using symlinks (monorepo standard)
config.resolver.disableHierarchicalLookup = false;

// 4. (OPTIONAL) Fallback mappings for shared packages to ensure resolution consistency
config.resolver.extraNodeModules = {
  '@quantmind/shared-types': path.resolve(workspaceRoot, 'packages/shared-types'),
  '@quantmind/ai': path.resolve(workspaceRoot, 'packages/ai'),
  '@quantmind/analytics': path.resolve(workspaceRoot, 'packages/analytics'),
  '@quantmind/ui': path.resolve(workspaceRoot, 'packages/ui'),
};

module.exports = config;
