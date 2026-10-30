module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const plugins = [...(config.plugins || [])];
  if (iosClientId)
    plugins.push([
      "@react-native-google-signin/google-signin",
      { iosUrlScheme: iosClientId.split(".").reverse().join(".") },
    ]);
  return { ...config, plugins };
};
