import { PaperTradingService } from '@/services/paper-trading';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    const bal = await PaperTradingService.getBalance();
    setBalance(bal);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 PolyPaper</Text>
        <Text style={styles.subtitle}>Paper Trading for Polymarket</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
        <Text style={styles.balanceHint}>Virtual money for practice trading</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/markets')}
        >
          <Text style={styles.primaryButtonText}>Browse Markets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/portfolio')}
        >
          <Text style={styles.secondaryButtonText}>View Portfolio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0066FF',
    padding: 40,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 4,
  },
  balanceHint: {
    fontSize: 12,
    color: '#999',
  },
  buttons: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#0066FF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0066FF',
  },
  secondaryButtonText: {
    color: '#0066FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
