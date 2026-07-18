import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logo}>
        <Text style={styles.logoText}>EP</Text>
      </View>

      {/* App Name */}
      <Text style={styles.appName}>Eaglespress</Text>

      {/* Loader */}
      <ActivityIndicator size="large" style={styles.loader} />

      {/* Subtitle */}
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // Logo (EP box)
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 2,
  },

  appName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 32,
  },

  loader: {
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
  },
});
