// ...existing code...
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, StatusBar, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const NAVY = '#0b1f3b';
const MINI_CARD = Math.min(width * 0.38, 160);

export default function AttandanceScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ Helvetica: require('../../../assets/fonts/helvetica.ttf') });
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const snap = await getDoc(doc(db, 'students', user.uid));
          if (snap.exists()) {
            const d = snap.data();
            setName(d.name || d.fullName || 'Öğrenci');
          }
        }
      } catch (e) {
        console.log('Firestore hatası:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.center, { backgroundColor: NAVY }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBox}>
        <Image source={require('../../../assets/Logo1.png')} style={styles.cornerBadge} resizeMode="contain" />
        <TouchableOpacity style={styles.settingsIcon} onPress={() => navigation.navigate('SettingsScreen')}>
          <Ionicons name="settings-outline" size={35} color={NAVY} />
        </TouchableOpacity>

        <View style={styles.logoCard}>
          <Image source={require('../../../assets/checkLogo.jpg')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.circleTitle}>Erciyes Üniversitesi</Text>
          <Text style={styles.circleSubtitle}>Dijital Yoklama</Text>
        </View>

        <View style={styles.shadowEdge} />
      </View>

      <View style={styles.bottomBox}>
        <Text style={styles.greeting}>Merhaba, {name} 👋</Text>
        <Text style={styles.subText}>Devamsızlık bilgilerin aşağıda.</Text>

        <ScrollView style={{ width: '100%', marginTop: 20, paddingHorizontal: 24 }}>
          {/* Buraya gerçek devamsızlık verilerini ekleyin */}
          <View style={{ backgroundColor: '#fff', padding: 18, borderRadius: 12 }}>
            <Text style={{ fontFamily: 'Helvetica', fontSize: 16, color: NAVY, fontWeight: '700' }}>Genel Devamsızlık</Text>
            <Text style={{ fontFamily: 'Helvetica', marginTop: 8, color: '#475569' }}>Bu alanı backend'den gelen verilerle doldurun.</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  topBox: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 12,
  },
  cornerBadge: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 70,
    height: 70,
    zIndex: 5,
  },
  settingsIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 6,
  },
  logoCard: {
    width: MINI_CARD,
    height: MINI_CARD,
    borderRadius: MINI_CARD / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  logo: { width: '65%', height: '65%', marginBottom: 0 },
  circleTitle: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: NAVY,
    marginTop: -10,
  },
  circleSubtitle: {
    fontFamily: 'Helvetica',
    fontSize: 13,
    color: NAVY,
    marginTop: -10,
  },
  shadowEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -8,
    height: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bottomBox: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  greeting: {
    fontFamily: 'Helvetica',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  subText: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: '#dbe3f0',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});