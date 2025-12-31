import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, SafeAreaView, ScrollView, Modal, FlatList } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';

// --- DATA TYPES ---
interface Tenant {
  id: string;
  name: string;
}

interface Stats {
  write_speed: number;
  read_latency_ms: number;
  total_rows: number;
}

interface LatencyPoint {
  timestamp: number;
  value: number;
}

const API_URL = 'http://192.168.3.6:8000/api'; 

const screenWidth = Dimensions.get("window").width;

export default function App() {
  // Logic State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(true);
  
  // Stress Mode State
  const [isStressRunning, setIsStressRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Metrics State
  const [stats, setStats] = useState<Stats>({ write_speed: 0, read_latency_ms: 0, total_rows: 0 });
  const [latencyHistory, setLatencyHistory] = useState<LatencyPoint[]>([]);

  // Chart State
  const [chartData, setChartData] = useState({
    labels: ["-", "-", "-", "-", "-", "-"],
    datasets: [{ data: [0, 0, 0, 0, 0, 0] }]
  });

  useEffect(() => {
    async function fetchTenants() {
      try {
        const response = await axios.get<Tenant[]>(`${API_URL}/tenants`);
        setTenants(response.data);
      } catch (error) {
        console.error("Error fetching tenants:", error);
      }
    }
    fetchTenants();
  }, []);

  useEffect(() => {
    if (!selectedTenant) return;

    let isActive = true; // Component mount status flag
    let timerId: NodeJS.Timeout;

    const fetchStats = async () => {
      if (!isActive) return;

      try {
        const response = await axios.get<Stats>(`${API_URL}/stress/stats`, {
            headers: { 'X-Tenant-ID': selectedTenant.id }
        });
        
        const data = response.data;
        const now = Date.now();

        if (isActive) {
          setStats(data);

          // Update history (Keep last 5 minutes)
          setLatencyHistory(prev => {
            const newHistory = [...prev, { timestamp: now, value: data.read_latency_ms }];
            return newHistory.filter(p => now - p.timestamp <= 300000);
          });

          // Update Chart
          setChartData(prev => {
            const oldData = prev.datasets[0].data;
            const newData = [...oldData.slice(1), data.read_latency_ms];
            return {
              labels: [".", ".", ".", ".", ".", "Now"],
              datasets: [{ data: newData }]
            };
          });
        }
      } catch (err) {
        console.log("Polling error (retrying)...");
      } finally {
        if (isActive) {
          timerId = setTimeout(fetchStats, 1000);
        }
      }
    };

    fetchStats(); // Start loop

    return () => {
      isActive = false;
      clearTimeout(timerId);
    };
  }, [selectedTenant]);

  // 3. Stress Injection Loop ("Machine Gun" Logic)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timer: NodeJS.Timeout;

    if (isStressRunning && selectedTenant) {
      // Auto-stop countdown (30 seconds)
      setTimeLeft(30);
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsStressRunning(false); // Stop attack
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Injection Loop (Fire every 1 second)
      interval = setInterval(async () => {
        try {
          await axios.post(`${API_URL}/stress/start`, { amount: 1000 }, {
            headers: { 'X-Tenant-ID': selectedTenant.id }
          });
        } catch (error) {
          console.log("Injection failed");
        }
      }, 1000); 
    }

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [isStressRunning, selectedTenant]);


  // Helper: Calculate Moving Average
  const getAverageLatency = (seconds: number): string => {
    if (latencyHistory.length === 0) return "0";
    
    const now = Date.now();
    const samples = latencyHistory.filter(p => now - p.timestamp <= (seconds * 1000));
    
    if (samples.length === 0) return "0";

    const sum = samples.reduce((acc, curr) => acc + curr.value, 0);
    return (sum / samples.length).toFixed(0);
  };

  const selectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setModalVisible(false);
    // Reset Visualization
    setStats({ write_speed: 0, read_latency_ms: 0, total_rows: 0 });
    setLatencyHistory([]); 
    setIsStressRunning(false);
    setChartData({ labels: ["-", "-", "-", "-", "-", "-"], datasets: [{ data: [0, 0, 0, 0, 0, 0] }] });
  };

  const toggleStress = () => {
    if (!selectedTenant) return;
    setIsStressRunning(!isStressRunning);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TENANT HEADER */}
      <TouchableOpacity style={styles.tenantSelector} onPress={() => setModalVisible(true)}>
        <Text style={styles.tenantLabel}>CURRENT RLS CONTEXT:</Text>
        <Text style={styles.tenantName}>
            {selectedTenant ? selectedTenant.name.toUpperCase() : "SELECT TENANT..."} ▾
        </Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* ACTION AREA */}
        <View style={styles.actionContainer}>
           <Text style={styles.timerText}>
             {isStressRunning ? `⏱ AUTO-STOP IN ${timeLeft}s` : "SYSTEM IDLE"}
           </Text>
           
           <TouchableOpacity 
            style={[styles.stressButton, isStressRunning ? styles.btnStop : styles.btnStart]} 
            onPress={toggleStress}
            disabled={!selectedTenant}
          >
            {isStressRunning ? (
              <Text style={styles.btnText}>🛑 STOP ATTACK</Text>
            ) : (
              <Text style={styles.btnText}>🔥 START STRESS TEST (1k/s)</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* METRICS GRID - LATENCY AVERAGES */}
        <Text style={styles.sectionTitle}>Latency Moving Avg</Text>
        <View style={styles.gridContainer}>
          <MetricCard label="Last 5 min" value={getAverageLatency(300)} color="#3498db" />
          <MetricCard label="Last 1 min" value={getAverageLatency(60)} color="#3498db" />
          <MetricCard label="Last 30s" value={getAverageLatency(30)} color="#f1c40f" />
          <MetricCard label="Last 10s" value={getAverageLatency(10)} color="#e67e22" />
        </View>

        {/* REAL TIME STATS */}
        <Text style={styles.sectionTitle}>Real-Time Metrics</Text>
        <View style={styles.kpiContainer}>
          <View style={[styles.card, { borderColor: '#e74c3c' }]}>
            <Text style={styles.cardTitle}>Write Speed</Text>
            <Text style={styles.cardValue}>{Math.floor(stats.write_speed)}</Text>
            <Text style={styles.cardUnit}>rows/sec</Text>
          </View>

          <View style={[styles.card, { borderColor: '#2ecc71' }]}>
            <Text style={styles.cardTitle}>Current Latency</Text>
            <Text style={styles.cardValue}>{stats.read_latency_ms}</Text>
            <Text style={styles.cardUnit}>ms</Text>
          </View>
        </View>

        {/* CHART */}
        <LineChart
          data={chartData}
          width={screenWidth - 30}
          height={180}
          yAxisSuffix="ms"
          chartConfig={{
            backgroundColor: "#1e272e",
            backgroundGradientFrom: "#1e272e",
            backgroundGradientTo: "#2d3436",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(189, 195, 199, ${opacity})`,
            propsForDots: { r: "3", strokeWidth: "1", stroke: "#2ecc71" }
          }}
          bezier
          style={styles.chart}
        />
        
        <Text style={styles.totalRows}>
          Partition Total Rows: {stats.total_rows.toLocaleString()}
        </Text>

      </ScrollView>

      {/* MODAL */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Tenant</Text>
            <FlatList
              data={tenants}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => selectTenant(item)}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  <Text style={styles.modalItemUuid}>{item.id.split('-')[0]}...</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Simple Component for Metric Cards
const MetricCard = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <View style={styles.miniCard}>
    <Text style={styles.miniCardLabel}>{label}</Text>
    <Text style={[styles.miniCardValue, { color }]}>{value} ms</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 30 },
  
  tenantSelector: { backgroundColor: '#2d3436', padding: 12, margin: 15, borderRadius: 8, borderWidth: 1, borderColor: '#3498db' },
  tenantLabel: { color: '#7f8c8d', fontSize: 10, fontWeight: 'bold' },
  tenantName: { color: '#3498db', fontSize: 18, fontWeight: 'bold' },

  actionContainer: { alignItems: 'center', marginBottom: 20 },
  timerText: { color: '#7f8c8d', fontSize: 12, marginBottom: 5, fontWeight: 'bold' },
  stressButton: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, width: '90%', alignItems: 'center' },
  btnStart: { backgroundColor: '#27ae60' },
  btnStop: { backgroundColor: '#c0392b' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  sectionTitle: { color: '#ecf0f1', fontSize: 14, marginLeft: 15, marginTop: 15, marginBottom: 10, fontWeight: 'bold', textTransform: 'uppercase' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 15 },
  miniCard: { width: '48%', backgroundColor: '#1e272e', padding: 10, borderRadius: 8, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#34495e' },
  miniCardLabel: { color: '#95a5a6', fontSize: 11 },
  miniCardValue: { fontSize: 20, fontWeight: 'bold', marginTop: 2 },

  kpiContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  card: { width: '45%', backgroundColor: '#1e272e', padding: 15, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  cardTitle: { color: '#bdc3c7', fontSize: 10, textTransform: 'uppercase' },
  cardValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  cardUnit: { color: '#7f8c8d', fontSize: 10 },

  chart: { marginVertical: 8, borderRadius: 16, alignSelf: 'center' },
  totalRows: { color: '#555', textAlign: 'center', fontSize: 12, marginTop: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxHeight: '60%', backgroundColor: '#1e272e', borderRadius: 20, padding: 20 },
  modalTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#2d3436', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalItemText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalItemUuid: { color: '#7f8c8d', fontSize: 12, fontFamily: 'monospace' }
});