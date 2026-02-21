import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page not found</Text>
        <Link href="/(tabs)/(home)" style={styles.link}>
          <Text style={styles.linkText}>Go to home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
});
