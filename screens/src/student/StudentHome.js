// screens/src/student/StudentHome.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons'; 

const { width } = Dimensions.get('window');
const NAVY = '#0b1f3b';
const MINI_CARD = Math.min(width * 0.38, 160);

export default function StudentHome({ navigation }) {
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('RoleSelect');
    } catch (e) {
      console.log('Çıkış hatası:', e);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ---- ÜST BEYAZ ALAN ---- */}
      <View style={styles.topBox}>
        {/* Sol üst logo */}
        <Image source={require('../../../assets/Logo1.png')} style={styles.cornerBadge} resizeMode="contain" />

        {/* Sağ üst ayarlar simgesi */}
        <TouchableOpacity
          style={styles.settingsIcon}
          onPress={() => navigation.navigate('SettingsScreen')}
        >
          <Ionicons name="settings-outline" size={35} color={NAVY} />
        </TouchableOpacity>

        {/* Orta logoCard */}
        <View style={styles.logoCard}>
          <Image source={require('../../../assets/checkLogo.jpg')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.circleTitle}>Erciyes Üniversitesi</Text>
          <Text style={styles.circleSubtitle}>Dijital Yoklama</Text>
        </View>

        <View style={styles.shadowEdge} />
      </View>

      {/* ---- ALT LACİVERT ALAN ---- */}
      <View style={styles.bottomBox}>
        <Text style={styles.greeting}>Merhaba, {name} 👋</Text>
        <Text style={styles.subText}>Check-inERU’ya hoş geldin.</Text>
        <View style = {styles.cardRow}>
          <TouchableOpacity
            style ={styles.squareCard}
            onPress ={()=> navigation.navigate ('ScheduleScreen')}>
          
          <Ionicons name="calendar-outline" size ={40} color={NAVY}/>
          <Text style ={styles.cardText}> Ders Programı</Text>
          </TouchableOpacity>
          <TouchableOpacity
          style ={styles.squareCard}
          onPress={()=> navigation.navigate('AttandanceScreen')}>
            <Ionicons name="clipboard-outline" size={40} color={NAVY} />
            <Text style = {styles.cardText}>Devamsızlık Bilgisi</Text>
          </TouchableOpacity>
        </View>

      



        
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
  // ✅ Sağ üstte ayarlar simgesi
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
  primaryBtn: {
    marginTop: 18,
    width: Math.min(width * 0.82, 360),
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: 'Helvetica',
    color: NAVY,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    marginTop: 12,
    width: Math.min(width * 0.82, 360),
    borderWidth: 1,
    borderColor: '#c9d2e3',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Helvetica',
    color: '#e8eef9',
    fontSize: 14,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

 // 🔹 Kare kartlar
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 25,
    marginTop: 40,   
    marginBottom: 25,
  },
  squareCard: {
    backgroundColor: '#f3f4f6',
    width: '46%',
    aspectRatio: 1, // kare
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardText: {
    fontFamily: 'Helvetica',
    color: NAVY,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },


});
