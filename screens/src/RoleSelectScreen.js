// screens/RoleSelectScreen.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const NAVY = '#0b1f3b';

const CARD_SIZE = Math.min(width * 0.73, 380);
const FIELD_WIDTH = Math.min(width * 0.80, 360);

export default function RoleSelectScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    Helvetica: require('../../assets/fonts/helvetica.ttf'),
  });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* ÜST KISIM TAMAMEN BEYAZ — lacivert şerit kaldırıldı */}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffffff" />

      {/* Sol üst Erciyes rozeti */}
      <Image
        source={require('../../assets/Logo1.png')}
        style={styles.cornerBadge}
        resizeMode="contain"
      />

      {/* Üst beyaz alan */}
      <View style={styles.topBox}>
        <View style={styles.logoCard}>
          <Image
            source={require('../../assets/checkLogo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.circleTitle}>Erciyes Üniversitesi</Text>
          <Text style={styles.circleSubtitle}>Dijital Yoklama Sistemi</Text>
        </View>
        <View style={styles.shadowEdge} />
      </View>

      {/* Alt lacivert alan */}
      <View style={styles.bottomBox}>
        <TouchableOpacity
          style={[styles.btn, styles.shadow]}
          onPress={() => navigation.navigate('LoginStudent')}
        >
          <Text style={styles.btnText}>Öğrenci</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.shadow]}
          onPress={() => navigation.navigate('LoginAcademic')}
        >
          <Text style={styles.btnText}>Akademik personel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, // artık tam beyaz, üstte lacivert yok

  cornerBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 80,
    height: 80,
    zIndex: 5,
  },

  topBox: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 15,
  },

  logoCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: CARD_SIZE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  logo: { width: '63%', height: '63%', marginBottom: 0 },

  circleTitle: {
    fontFamily: 'Helvetica',
    fontSize: 25,
    color: NAVY,
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
    left: 0,
    right: 0,
    bottom: -10,
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
