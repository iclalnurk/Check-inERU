// screens/academic/LoginAcademicScreen.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Alert, Platform, StyleSheet, Text, TouchableOpacity, View,
  KeyboardAvoidingView, TextInput, Switch, Dimensions, Image,
  Animated, Keyboard, Easing, ScrollView, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';            
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');
const NAVY = '#0b1f3b';

// Storage keys (academic)
const AS_EMAIL_KEY    = 'login_email_ac';
const AS_REMEMBER_KEY = 'remember_me_ac';
const SEC_PASS_KEY    = 'login_password_ac';

// Görsel/Animasyon — ⬇️ BEYAZ ALAN KISALDI
const CARD_SIZE      = Math.min(width * 0.73, 380);  // önce 0.80 / 360'tı
const FIELD_WIDTH    = Math.min(width * 0.80, 360);
const TOP_BIG_H      = CARD_SIZE+28 ;  // önce çok yüksekti
const TOP_SMALL_H    = 140;                           // klavyede daha da küçül
const LOGO_MIN_SCALE = 0.52;                          // küçülürken orantı koru

// ---- Yardımcılar ----
const normalizeEmail = (raw) => (raw || '')
  .normalize('NFKC')
  .replace(/[\u200B-\u200D\uFEFF]/g, '')
  .replace(/[\u202A-\u202E]/g, '')
  .replace(/\u00A0/g, ' ')
  .replace(/["“”'‘’]/g, '')
  .replace(/[^\x20-\x7E]/g, '')
  .replace(/\s+/g, '')
  .toLowerCase();

const mapAuthError = (code) => {
  switch (code) {
    case 'auth/invalid-email':        return 'E-posta geçersiz.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':   return 'E-posta veya şifre hatalı.';
    case 'auth/network-request-failed': return 'Ağ hatası. İnterneti kontrol et.';
    default: return 'Giriş yapılamadı.';
  }
};

export default function LoginAcademicScreen({ navigation }) {
  const [email, setEmail]      = useState('');
  const [pass,  setPass ]      = useState('');
  const [busy,  setBusy ]      = useState(false);
  const [remember, setRemember]= useState(false);

  const [fontsLoaded] = useFonts({
    Helvetica: require('../../../assets/fonts/helvetica.ttf'),
  });
  if (!fontsLoaded) return null;

  // Prefill
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
      } catch (e) { console.log('Prefill load error (academic):', e); }
    })();
  }, []);

  // **ALT GEZİNME ÇUBUĞU** NAVY olsun (Android)
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync('light').catch(()=>{});
    }
  }, []);

  // Klavye animasyonu
  const anim = useRef(new Animated.Value(0)).current;
  const animateTo = useCallback((to) => {
    Animated.timing(anim, {
      toValue: to, duration: 220,
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

  const topHeight = anim.interpolate({ inputRange: [0,1], outputRange: [TOP_BIG_H, TOP_SMALL_H] });
  const logoScale = anim.interpolate({ inputRange: [0,1], outputRange: [1, LOGO_MIN_SCALE] });

  // Persist
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
    } catch (e) { console.log('Persist creds error (academic):', e); }
  };

  // ---- Giriş ----
  const handleLogin = async () => {
    const E = normalizeEmail(email);
    if (!E || !pass) return Alert.alert('Uyarı', 'Akademisyen e-postanızı ve şifrenizi girin.');

    try {
      setBusy(true);
      const cred = await signInWithEmailAndPassword(auth, E, pass);
      const uid  = cred.user.uid;

      // academics/{uid} profili var mı?
      const snap = await getDoc(doc(db, 'academics', uid));
      if (!snap.exists()) {
        Alert.alert('Uyarı', 'Bu hesapta akademik personel profili bulunamadı.');
        return;
      }

      await persistCreds(remember, E, pass);
      navigation.replace('AcademicHome');
    } catch (e) {
      const msg = e?.code ? `${mapAuthError(e.code)} [${e.code}]` : (e?.message ?? String(e));
      Alert.alert('Hata', msg);
      console.log('Academic login error:', e);
    } finally {
      setBusy(false);
    }
  };

  // ---- Şifre sıfırlama ----
  const handleResetPassword = async () => {
    const E = normalizeEmail(email);
    if (!E) return Alert.alert('Uyarı', 'Lütfen e-posta adresinizi yazın.');
    try {
      setBusy(true);
      console.log('[RESET] projectId:', auth.app?.options?.projectId);
      console.log('[RESET] email    :', E);

      await sendPasswordResetEmail(auth, E);
      Alert.alert(
        'E-posta gönderildi',
        'Şifre sıfırlama bağlantısı (kayıtlıysa) e-postanıza gönderildi. Spam/Junk klasörünü de kontrol edin.'
      );
    } catch (e) {
      if (e?.code === 'auth/invalid-email') {
        return Alert.alert('E-posta hatalı', 'Geçerli bir e-posta adresi girin.');
      }
      Alert.alert('Gönderilemedi', e?.message ?? String(e));
      console.log('[RESET] error:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ÜST status bar beyaz — ikonlar koyu */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Sol üst rozet */}
      <Image source={require('../../../assets/Logo1.png')} style={styles.cornerBadge} resizeMode="contain" />

      {/* Üst beyaz alan — KISALTILDI */}
      <Animated.View style={[styles.topBox, { height: topHeight }]}>
        <Animated.View style={[styles.logoCard, { transform: [{ scale: logoScale }], zIndex: 2 }]}>
          <Image source={require('../../../assets/checkLogo.jpg')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.circleTitle}>Erciyes Üniversitesi</Text>
          <Text style={styles.circleSubtitle}>Dijital Yoklama Sistemi</Text>
        </Animated.View>
        <View style={styles.shadowEdge} />
      </Animated.View>

      {/* Form alanı (NAVY) */}
      <View style={styles.formBackground}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS==='ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS==='ios' ? 8 : 0}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formScroll}>
            <View style={styles.wrap}>
              <Text style={styles.title}>Akademisyen Girişi</Text>

              <TextInput
                style={styles.input}
                placeholder="E-posta"
                placeholderTextColor="#9aa4b2"
                keyboardType="email-address"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                onEndEditing={() => setEmail((t) => normalizeEmail(t))}
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

              <TouchableOpacity style={[styles.btn, busy && { opacity: 0.6 }]} onPress={handleLogin} disabled={busy}>
                <Text style={styles.btnText}>{busy ? '...' : 'Giriş Yap'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('SignupAcademic')} style={styles.linkBtn}>
                <Text style={styles.linkTxt}>Hesabınız yok mu? Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
    
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  // Üst alan beyaz, alt NAVY
  safe: { flex: 1, backgroundColor: '#fff' },

  formBackground: { flex: 1, backgroundColor: NAVY },

  cornerBadge: {
    position: 'absolute', top: 8, left: 10, width: 72, height: 72, zIndex: 5,
  },

  topBox: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },

  // Logo kartı biraz küçültüldü
  logoCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: CARD_SIZE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  logo: { width: '60%', height: '60%', marginBottom: 0 },

  circleTitle:   { fontFamily: 'Helvetica', fontSize: 22, color: NAVY, marginTop: -14 },
  circleSubtitle:{ fontFamily: 'Helvetica', fontSize: 16, color: NAVY, marginTop: -8 },

  shadowEdge: {
    position: 'absolute',
    left: 0, right: 0, bottom: -10,
    height: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
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

  title: { fontFamily: 'Helvetica', fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },

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

  rememberTxt: { fontFamily: 'Helvetica', marginLeft: 8, color: '#fff' },
  resetTxt:    { fontFamily: 'Helvetica', color: '#fff', fontWeight: '700' },

  btn: {
    width: Math.min(width * 0.80, 360),
    backgroundColor: '#f3f4f6',
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    marginVertical: 13,
  },
  btnText: { fontFamily: 'Helvetica', color: NAVY, fontWeight: '700', fontSize: 16 },

  linkBtn: { marginTop: 14, alignItems: 'center' },
  linkTxt: { fontFamily: 'Helvetica', color: '#fff', fontWeight: '700' },
});
