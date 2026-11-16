import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Placeholder screen. Milestone M1 replaces this with Expo Router (src/app/) — see AGENTS.md.
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ChakriTrack</Text>
      <Text style={styles.subtitle}>চাকরির আবেদন, ডেডলাইন ও প্রস্তুতি — এক জায়গায়</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#047857' },
  subtitle: { marginTop: 8, fontSize: 16, color: '#3f3f46', textAlign: 'center' },
});
