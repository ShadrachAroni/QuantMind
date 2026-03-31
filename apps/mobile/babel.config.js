module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo', 'nativewind/babel'],
        plugins: [
            [
                'module-resolver',
                {
                    alias: {
                        '@': './src',
                        '@quantmind/shared-types': '../../packages/shared-types/src/index.ts',
                        '@quantmind/ai': '../../packages/ai/src/index.ts',
                        '@quantmind/analytics': '../../packages/analytics/src/index.ts',
                        '@quantmind/ui': '../../packages/ui/src/index.ts',
                    },
                },
            ],
            // Custom plugin to transpile import.meta.env
            function () {
                return {
                    name: 'transform-import-meta',
                    visitor: {
                        MetaProperty(path) {
                            if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
                                path.replaceWithSourceString('({ env: process.env })');
                            }
                        },
                    },
                };
            },
            'react-native-reanimated/plugin',
        ],
    };
};
