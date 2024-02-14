module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'nativewind/babel',
    'react-native-reanimated/plugin',
    'module:react-native-dotenv',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.json'],
      },
    ]
  ]
};
