// screens/academic/LoginStudentScreen.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Alert, Platform, StyleSheet, Text, TouchableOpacity, View,
  KeyboardAvoidingView, TextInput, Switch, Dimensions, Image,
  Animated, Keyboard, Easing, ScrollView, StatusBar
} from 'react-native';
import { SafeAreaView , useSafeAreaInsets} from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');
const NAVY = '#0b1f3b';

const AS_EMAIL_KEY = 'login_email';
const AS_REMEMBER_KEY = 'remember_me';
const SEC_PASS_KEY = 'login_password';

// Görsel/Animasyon ayarları
const CARD_SIZE     = Math.min(width * 0.73, 380);
const FIELD_WIDTH   = Math.min(width * 0.80, 360);
const TOP_BIG_H     = CARD_SIZE+28 ;  // klavye kapalıyken üst beyaz alan
const TOP_SMALL_H   = 140;              // ↑ artırıldı: klavyede logo kesilmesin
const LOGO_MIN_SCALE = 0.52;            // ↑ küçültme oranı artırıldı

export default function LoginStudentScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [pass,  setPass ] = useState('');
  const [busy,  setBusy ] = useState(false);
  const [remember, setRemember] = useState(false);

  const [fontsLoaded] = useFonts({
    Helvetica: require('../../../assets/fonts/helvetica.ttf'),
  });
  if (!fontsLoaded) return null;

    const insets = useSafeAreaInsets();
 
  // Açılışta kayıtlı bilgileri yükle
  useEffect(() => {
    (async () => {
      try {
        const rem = await AsyncStorage.getItem(AS_REMEMBER_KEY);
        const remembered = rem === 'true';
        setRemember(remembered);

        const savedEmail = await AsyncStorage.getItem(AS_EMAIL_KEY);
        if (savedEmail) setEmail(savedEmail);

        if (remembered) {
          const savedPass = await SecureStore.getItemAsync(SEC_PASS_KEY);
          if (savedPass) setPass(savedPass);
        }
      } catch (e) {
        console.log('Prefill load error:', e);
      }
    })();
  }, []);

  // --- Klavye aç/kapa → üst alan ve logo animasyonu ---
  const anim = useRef(new Animated.Value(0)).current; // 0: kapalı, 1: açık

  const animateTo = useCallback((to) => {
    Animated.timing(anim, {
      toValue: to,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [anim]);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const sh = Keyboard.addListener(showEvt, () => animateTo(1));
    const hd = Keyboard.addListener(hideEvt, () => animateTo(0));
    return () => { sh.remove(); hd.remove(); };
  }, [animateTo]);

  const topHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [TOP_BIG_H, TOP_SMALL_H],
  });
  const logoScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, LOGO_MIN_SCALE],
  });
 // 1) titleOpacity yerine sabit değer kullanın
const titleOpacity = 1; // <-- eklendi




  const mapAuthError = (code) => {
    switch (code) {
      case 'auth/invalid-email': return 'E-posta geçersiz.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'E-posta veya şifre hatalı.';
      case 'auth/network-request-failed': return 'Ağ hatası. İnterneti kontrol et.';
      default: return 'Giriş yapılamadı.';
    }
  };

  const persistCreds = async (shouldRemember, eml, pwd) => {
    try {
      await AsyncStorage.setItem(AS_REMEMBER_KEY, shouldRemember ? 'true' : 'false');
      if (shouldRemember) {
        await AsyncStorage.setItem(AS_EMAIL_KEY, eml);
        if (pwd) await SecureStore.setItemAsync(SEC_PASS_KEY, pwd, { requireAuthentication: false });
      } else {
        await AsyncStorage.removeItem(AS_EMAIL_KEY);
        await SecureStore.deleteItemAsync(SEC_PASS_KEY);
      }
    } catch (e) {
      console.log('Persist creds error:', e);
    }
  };

  const handleLogin = async () => {
    if (!email || !pass) return Alert.alert('Uyarı', 'Öğrenci e-postanızı ve şifrenizi girin.');
    try {
      setBusy(true);
      const { user } = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
      const uid = user.uid;

      const snap = await getDoc(doc(db, 'students', uid));
      if (!snap.exists()) {
        Alert.alert('Uyarı', 'Bu hesap öğrenci profili içermiyor. Akademisyen girişi mi denemelisin?');
        return;
      }

      await persistCreds(remember, email.trim().toLowerCase(), pass);
      navigation.replace('StudentHome');
    } catch (e) {
      const msg = e?.code ? `${mapAuthError(e.code)} [${e.code}]` : (e?.message ?? String(e));
      Alert.alert('Hata', msg);
      console.log('Student login error:', e);
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    const eml = email.trim().toLowerCase();
    if (!eml) return Alert.alert('Uyarı', 'Lütfen e-posta adresinizi yazın.');
    try {
      setBusy(true);
      await sendPasswordResetEmail(auth, eml);
      Alert.alert('E-posta gönderildi', 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi. Spam klasörünü de kontrol edin.');
    } catch (e) {
      const msg = e?.code === 'auth/too-many-requests'
        ? 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.'
        : (e?.message ?? String(e));
      Alert.alert('Gönderilemedi', msg);
      console.log('reset error:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
  // KÖK NAVY: alttaki tüm boşluklar da lacivert kalsın
  <View style={{ flex: 1, backgroundColor: NAVY }}>
    {/* ÜSTTEKİ BEYAZ BÖLÜM: sadece top-edge güvenli alan */}
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Sol üst rozet */}
      <Image
        source={require('../../../assets/Logo1.png')}
        style={styles.cornerBadge}
        resizeMode="contain"
      />

      {/* ÜST BEYAZ ALAN — yükseklik animasyonlu */}
      <Animated.View style={[styles.topBox, { height: topHeight }]}>
        <Animated.View
          style={[
            styles.logoCard,
            { transform: [{ scale: logoScale }], zIndex: 2 }
          ]}
        >
          <Image
            source={require('../../../assets/checkLogo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Animated.Text style={styles.circleTitle}>
            Erciyes Üniversitesi
          </Animated.Text>
          <Animated.Text style={styles.circleSubtitle}>
            Dijital Yoklama Sistemi
          </Animated.Text>
        </Animated.View>

        {/* Beyaz alt kenar gölge */}
        <View style={styles.shadowEdge} />
      </Animated.View>
    </SafeAreaView>

    {/* ALT BÖLÜM: NAVY arka plan + bottom-edge güvenli alan */}
    <SafeAreaView style={styles.safeBottomNavy} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formScroll}>
          <View style={styles.wrap}>
            <Text style={styles.title}>Öğrenci Girişi</Text>

            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor="#9aa4b2"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
            />

            <TextInput
              style={styles.input}
              placeholder="Şifre"
              placeholderTextColor="#9aa4b2"
              secureTextEntry
              value={pass}
              onChangeText={setPass}
              returnKeyType="done"
            />

            <View style={styles.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Switch
                  value={remember}
                  onValueChange={setRemember}
                  thumbColor="#fff"
                  trackColor={{ false: '#cbd5e1', true: '#2f7bff' }}
                />
                <Text style={styles.rememberTxt}>Beni hatırla</Text>
              </View>

              <TouchableOpacity onPress={handleResetPassword}>
                <Text style={styles.resetTxt}>Şifreyi unuttum?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btn, busy && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={busy}
            >
              <Text style={styles.btnText}>{busy ? '...' : 'Giriş Yap'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('SignupStudent')} style={styles.linkBtn}>
              <Text style={styles.linkTxt}>Hesabın yok mu? Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>
);
}

const styles = StyleSheet.create({
 // KÖK: tam ekran NAVY — alttaki boşluklar NAVY olsun
  rootNavy: {
    flex: 1,
    backgroundColor: NAVY,
  },

  // Üst beyaz güvenli alan (sadece TOP)
  safeTopWhite: {
    backgroundColor: '#fff',
  },

  // Alt NAVY güvenli alan (sadece BOTTOM)
  safeBottomNavy: {
    flex: 1,
    backgroundColor: NAVY,
  },

  // Form arka planını lacivert başlat
  formBackground: { flex: 1, backgroundColor: NAVY },

  cornerBadge: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 72,
    height: 72,
    zIndex: 5,
  },

  // Üst beyaz alan
  topBox: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },

  // Dairesel kart
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

  // Beyaz şerit — zIndex düşük: logonun altında kalır
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
    elevation: 6,
    zIndex: 1,
  },

  formScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },

  wrap: { alignItems: 'center' },

  title: {
    fontFamily: 'Helvetica',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },

  input: {
    width: FIELD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    fontFamily: 'Helvetica',
    fontSize: 15,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  row: {
    width: FIELD_WIDTH,
    marginTop: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rememberTxt: {
    fontFamily: 'Helvetica',
    marginLeft: 8,
    color: '#fff',
  },

  resetTxt: {
    fontFamily: 'Helvetica',
    color: '#fff',
    fontWeight: '700',
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

  linkBtn: { marginTop: 14, alignItems: 'center' },
  linkTxt: { fontFamily: 'Helvetica', color: '#fff', fontWeight: '700' },
});
