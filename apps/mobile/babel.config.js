module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
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
            'react-native-reanimated/plugin',
        ],
    };
};
