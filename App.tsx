import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { NativeModules, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

const formatRemaining = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function App() {
  const [coordinates, setCoordinates] = useState<string[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [interval, setIntervalSeconds] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [expanded, setExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [xValue, setXValue] = useState('');
  const [yValue, setYValue] = useState('');
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [events, setEvents] = useState<string[]>(['Overlay ready. Test actions stay inside this app.']);
  const target = coordinates[targetIndex] ?? 'No target';

  const addEvent = (event: string) => setEvents((current) => [`${new Date().toLocaleTimeString()}  ${event}`, ...current].slice(0, 5));
  const advance = () => {
    if (!coordinates.length) return;
    const nextIndex = (targetIndex + 1) % coordinates.length;
    setTargetIndex(nextIndex);
    addEvent(`Advanced to ${coordinates[nextIndex]}`);
    setRemaining(interval);
  };

  useEffect(() => {
    setRemaining(interval);
  }, [interval]);

  useEffect(() => {
    const overlay = NativeModules.TestOverlay;
    if (Platform.OS === 'android' && overlay) {
      overlay.configureTargets(coordinates, interval * 1000);
    }
  }, [coordinates, interval]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setRemaining((current) => {
        if (current > 1) return current - 1;
        if (autoAdvance && coordinates.length) {
          setTargetIndex((index) => (index + 1) % coordinates.length);
          addEvent('Interval complete. Advanced to the next test target.');
        }
        return interval;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoAdvance, coordinates.length, interval, running]);

  const toggleRun = () => {
    setRunning((current) => {
      addEvent(current ? 'Test run paused.' : `Test run started at ${target}.`);
      return !current;
    });
  };

  const addCoordinate = () => {
    const x = xValue.trim();
    const y = yValue.trim();
    if (!/^\d+$/.test(x) || !/^\d+$/.test(y)) {
      addEvent('Enter numeric X and Y values.');
      return;
    }
    setCoordinates((current) => [...current, `${x}:${y}`]);
    setXValue('');
    setYValue('');
    addEvent(`Added ${x}:${y}.`);
  };

  const removeCoordinate = (index: number) => {
    const removed = coordinates[index];
    setCoordinates((current) => current.filter((_, coordinateIndex) => coordinateIndex !== index));
    setTargetIndex((current) => Math.max(0, Math.min(current, coordinates.length - 2)));
    if (coordinates.length === 1) setRunning(false);
    addEvent(`Removed ${removed}.`);
  };

  const clearCoordinates = () => {
    setCoordinates([]);
    setTargetIndex(0);
    setRunning(false);
    addEvent('Cleared all test targets.');
  };

  const toggleSystemOverlay = () => {
    const overlay = NativeModules.TestOverlay;
    if (Platform.OS !== 'android' || !overlay) {
      addEvent('System overlay needs the installed Android build.');
      return;
    }
    if (overlayVisible) {
      overlay.hide();
      setOverlayVisible(false);
      addEvent('Floating overlay hidden.');
    } else {
      overlay.show();
      setOverlayVisible(true);
      addEvent('Opening overlay permission or showing floating panel.');
    }
  };

  const openAccessibilitySettings = () => {
    const overlay = NativeModules.TestOverlay;
    if (Platform.OS !== 'android' || !overlay) {
      addEvent('Accessibility setup needs the installed Android app.');
      return;
    }
    overlay.openAccessibilitySettings();
  };
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.testSurface}>
        <Text style={styles.surfaceLabel}>YOUR APP TEST SURFACE</Text>
        <View style={styles.targetRing}>
          <View style={styles.targetDot} />
        </View>
        <Text style={styles.surfaceTarget}>{target}</Text>
        <Text style={styles.surfaceHint}>The overlay controls this test session only.</Text>
      </View>

      <View style={[styles.overlay, !expanded && styles.overlayCollapsed]}>
        <Pressable style={styles.overlayHeader} onPress={() => setExpanded((value) => !value)}>
          <View>
            <Text style={styles.brand}>GGEAttackBot</Text>
            <Text style={styles.mode}>{running ? 'TEST RUN ACTIVE' : 'TEST MODE'}</Text>
          </View>
          <Text style={styles.collapse}>{expanded ? '−' : '+'}</Text>
        </Pressable>

        {expanded && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.overlayContent}>
            <View style={styles.targetRow}>
              <View>
                <Text style={styles.label}>NEXT TARGET</Text>
                <Text style={styles.coordinate}>{target}</Text>
                <Text style={styles.counter}>{coordinates.length ? `#${targetIndex + 1} of ${coordinates.length}` : 'No test targets configured'}</Text>
              </View>
              <View style={styles.clock}>
                <Text style={styles.clockValue}>{formatRemaining(remaining)}</Text>
                <Text style={styles.clockLabel}>NEXT STEP</Text>
              </View>
            </View>

            <View style={styles.controls}>
              <Pressable onPress={toggleRun} style={[styles.primaryButton, running && styles.stopButton]}>
                <Text style={styles.primaryButtonText}>{running ? 'STOP' : 'START'}</Text>
              </Pressable>
              <Pressable onPress={advance} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>NEXT</Text>
              </Pressable>
              <Pressable onPress={() => setShowSettings((value) => !value)} style={styles.iconButton}>
                <Text style={styles.iconText}>SET</Text>
              </Pressable>
            </View>

            {showSettings && (
              <View style={styles.settings}>
                <Text style={styles.label}>INTERVAL (SECONDS)</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={String(interval)}
                  onChangeText={(value) => setIntervalSeconds(Math.max(1, Number(value.replace(/\D/g, '')) || 1))}
                  style={styles.intervalInput}
                />
                <View style={styles.switchRow}>
                  <Text style={styles.settingText}>Auto-advance targets</Text>
                  <Switch value={autoAdvance} onValueChange={setAutoAdvance} trackColor={{ false: '#7a7f87', true: '#0a9f73' }} />
                </View>
                <Pressable style={styles.overlayToggle} onPress={toggleSystemOverlay}>
                  <Text style={styles.overlayToggleText}>{overlayVisible ? 'HIDE FLOATING OVERLAY' : 'SHOW FLOATING OVERLAY'}</Text>
                </Pressable>
                <Pressable style={styles.accessibilityButton} onPress={openAccessibilitySettings}>
                  <Text style={styles.accessibilityButtonText}>ENABLE TEST TAPS</Text>
                </Pressable>
                <Text style={styles.label}>ADD TEST TARGET</Text>
                <View style={styles.addRow}>
                  <TextInput placeholder="X" placeholderTextColor="#78808a" keyboardType="number-pad" value={xValue} onChangeText={setXValue} style={styles.coordInput} />
                  <TextInput placeholder="Y" placeholderTextColor="#78808a" keyboardType="number-pad" value={yValue} onChangeText={setYValue} style={styles.coordInput} />
                  <Pressable style={styles.addButton} onPress={addCoordinate}><Text style={styles.addButtonText}>ADD</Text></Pressable>
                </View>
                <View style={styles.savedTargetsHeader}>
                  <Text style={styles.label}>SAVED TEST TARGETS</Text>
                  <Pressable onPress={clearCoordinates}><Text style={styles.clearText}>CLEAR ALL</Text></Pressable>
                </View>
                {coordinates.length === 0 ? (
                  <Text style={styles.emptyTargets}>Add an X:Y point to create your test sequence.</Text>
                ) : coordinates.map((coordinate, index) => (
                  <View key={`${coordinate}-${index}`} style={[styles.savedTarget, targetIndex === index && styles.selectedTarget]}>
                    <Pressable style={styles.targetSelect} onPress={() => setTargetIndex(index)}>
                      <Text style={styles.savedTargetText}>{coordinate}</Text>
                    </Pressable>
                    <Pressable style={styles.removeButton} onPress={() => removeCoordinate(index)}>
                      <Text style={styles.removeButtonText}>REMOVE</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.logSection}>
              <Text style={styles.label}>TEST LOG</Text>
              {events.map((event) => <Text key={event} style={styles.logEntry}>{event}</Text>)}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10151a' },
  testSurface: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#234737' },
  surfaceLabel: { color: '#b8d1c2', fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  targetRing: { width: 172, height: 172, marginTop: 28, borderRadius: 86, borderWidth: 2, borderColor: '#d8ad45', alignItems: 'center', justifyContent: 'center' },
  targetDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#f7ce5c' },
  surfaceTarget: { color: '#fff7e1', fontSize: 30, fontWeight: '800', marginTop: 20 },
  surfaceHint: { color: '#c4dbc9', fontSize: 14, marginTop: 8 },
  overlay: { maxHeight: '72%', backgroundColor: '#f1f4ee', borderTopWidth: 4, borderColor: '#d3a840', borderTopLeftRadius: 8, borderTopRightRadius: 8, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, elevation: 12 },
  overlayCollapsed: { maxHeight: 66 },
  overlayHeader: { minHeight: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#172329' },
  brand: { color: '#f5c852', fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  mode: { color: '#a8c1b0', fontSize: 10, fontWeight: '700', letterSpacing: 1.1, marginTop: 2 },
  collapse: { color: '#f5c852', fontSize: 30, fontWeight: '300' },
  overlayContent: { padding: 16, paddingBottom: 24 },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#d6ddd4' },
  label: { color: '#626b68', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  coordinate: { color: '#14242a', fontSize: 27, fontWeight: '800', marginTop: 3 },
  counter: { color: '#6e7772', fontSize: 12, marginTop: 2 },
  clock: { minWidth: 82, padding: 9, backgroundColor: '#e1e8df', alignItems: 'center', borderRadius: 6 },
  clockValue: { color: '#0c7c5a', fontSize: 22, fontWeight: '800' },
  clockLabel: { color: '#5f6d63', fontSize: 8, fontWeight: '800', marginTop: 2 },
  controls: { flexDirection: 'row', gap: 8, marginTop: 14 },
  primaryButton: { flex: 1, height: 46, backgroundColor: '#0b946a', borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  stopButton: { backgroundColor: '#c94841' },
  primaryButtonText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  secondaryButton: { width: 84, height: 46, borderWidth: 1, borderColor: '#769185', borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: '#29483b', fontWeight: '800', letterSpacing: 0.7 },
  iconButton: { width: 52, height: 46, backgroundColor: '#dfb242', borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  iconText: { color: '#272513', fontSize: 11, fontWeight: '900' },
  settings: { marginTop: 15, padding: 12, backgroundColor: '#e2e8e0', borderRadius: 6 },
  intervalInput: { height: 37, width: 90, marginTop: 5, paddingHorizontal: 10, backgroundColor: '#fff', borderColor: '#c4cec3', borderWidth: 1, borderRadius: 4, color: '#172329', fontWeight: '700' },
  switchRow: { marginVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingText: { color: '#2f4137', fontSize: 14, fontWeight: '600' },
  overlayToggle: { height: 40, marginBottom: 13, backgroundColor: '#294b3c', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  overlayToggleText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  accessibilityButton: { height: 40, marginBottom: 13, borderWidth: 1, borderColor: '#a98022', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  accessibilityButtonText: { color: '#6f5114', fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  addRow: { marginTop: 5, flexDirection: 'row', gap: 7 },
  coordInput: { flex: 1, height: 39, paddingHorizontal: 9, backgroundColor: '#fff', borderColor: '#c4cec3', borderWidth: 1, borderRadius: 4, color: '#172329' },
  addButton: { width: 55, backgroundColor: '#294b3c', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  savedTargetsHeader: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearText: { color: '#a54138', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  emptyTargets: { marginTop: 8, color: '#69736d', fontSize: 12, lineHeight: 18 },
  savedTarget: { height: 39, marginTop: 7, paddingLeft: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderColor: '#c4cec3', borderWidth: 1, borderRadius: 4 },
  selectedTarget: { borderColor: '#0b946a', borderWidth: 2 },
  targetSelect: { flex: 1, height: '100%', justifyContent: 'center' },
  savedTargetText: { color: '#172329', fontSize: 14, fontWeight: '700' },
  removeButton: { alignSelf: 'stretch', paddingHorizontal: 10, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#d6ddd4' },
  removeButtonText: { color: '#b13e36', fontSize: 10, fontWeight: '800' },
  logSection: { marginTop: 16 },
  logEntry: { color: '#4d5c55', fontFamily: 'monospace', fontSize: 11, lineHeight: 18, marginTop: 3 },
});
