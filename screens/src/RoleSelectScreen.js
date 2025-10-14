// screens/RoleSelectScreen.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { useFonts } from 'expo-font';

const { width } = Dimensions.get('window');
const NAVY = '#0b1f3b';

export default function RoleSelectScreen({ navigation }) {
  // Helvetica’yı yükle
  const [fontsLoaded] = useFonts({
    Helvetica: require('../../assets/fonts/helvetica.ttf'),
  });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Sol üst köşe: küçük Erciyes rozeti (yerinde kalsın) */}
      <Image
        source={require('../../assets/Logo1.png')}
        style={styles.cornerBadge}
        resizeMode="contain"
      />

      {/* Üst beyaz alan */}
      <View style={styles.topBox}>
        {/* Dairesel kart (sabit boy), içindeki GÖRSEL ve YAZI büyütüldü */}
        <View style={styles.logoCard}>
          <Image
            source={require('../../assets/checkLogo.jpg')}
            style={styles.logo}              // <- sadece görseli büyüttük
            resizeMode="contain"
          />
          {/* Dairenin içindeki metin */}
          <Text style={styles.circleTitle}>Erciyes Üniversitesi</Text>
          <Text style={styles.circleSubtitle}>Dijital Yoklama Sistemi</Text>
        </View>

        {/* Beyaz→Lacivert sınırında yumuşak gölge (düz geçiş) */}
        <View style={styles.shadowEdge} />
      </View>

      {/* Alt lacivert alan + butonlar (değişmedi) */}
      <View style={styles.bottomBox}>
        <TouchableOpacity style={[styles.btn, styles.shadow]} onPress={() => navigation.navigate('LoginStudent')}>
          <Text style={styles.btnText}>Öğrenci</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.shadow]} onPress={() => navigation.navigate('LoginAcademic')}>
          <Text style={styles.btnText}>Akademik personel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CARD_SIZE = Math.min(width * 0.78, 340); // kart boyutu sabit (önceki gibi)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },

  cornerBadge: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 80,
    height: 80,
    zIndex: 5,
  },

  topBox: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 18,
  },

  logoCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: CARD_SIZE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    // gölge
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

 
  logo: { width: '63%', height: '63%', marginBottom: 0 },

  // Dairenin içindeki metinler (Helvetica)
  circleTitle: {
    fontFamily: 'Helvetica',
    fontSize: 25,
    color: NAVY ,
    marginTop: -20,
  },
  circleSubtitle: {
    fontFamily: 'Helvetica',
    fontSize: 18,
    color: NAVY,
    marginTop: -10,
  },

  shadowEdge: {
    position: 'absolute',
    left: 0, right: 0, bottom: -10,
    height: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  bottomBox: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  btn: {
    width: Math.min(width * 0.80, 360),
    backgroundColor: '#f3f4f6',
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    marginVertical: 13,
  },
  btnText: {
    fontFamily: 'Helvetica',
    color: NAVY,
    fontWeight: '700',
    fontSize: 16,
  },

  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
