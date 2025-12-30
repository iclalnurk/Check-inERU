import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Image,
  Animated, Keyboard, Easing, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { saveStudent } from '../services/userRepo'; // ← yolunu doğru tut

const { width } = Dimensions.get('window');
const NAVY = '#0b1f3b';

const CARD_SIZE      = Math.min(width * 0.73, 380);
const FIELD_WIDTH    = Math.min(width * 0.80, 360);
const TOP_BIG_H      = CARD_SIZE + 28;
const TOP_SMALL_H    = 140;
const LOGO_MIN_SCALE = 0.52;

const DEPARTMENTS = [
  'Seçiniz…',
  'Bilgisayar Mühendisliği',
  'Elektrik-Elektronik Mühendisliği',
  'Makine Mühendisliği',
  'Endüstri Mühendisliği',
  'İnşaat Mühendisliği',
  'Mekatronik Mühendisliği',
  'Havacılık ve Uzay Mühendisliği',
  'Biyomedikal Mühendisliği',
  'Matematik',
  'Fizik',
];

export default function SignupStudentScreen({ navigation }) {
  // 1) STATE/REF — her zaman aynı sırada
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [dept,      setDept]      = useState(DEPARTMENTS[0]);
  const [email,     setEmail]     = useState('');
  const [pass,      setPass]      = useState('');
  const [busy,      setBusy]      = useState(false);

  const anim = useRef(new Animated.Value(0)).current;

  // 2) FONTS — erken return YOK; UI’ı koşullu çizeceğiz
  const [fontsLoaded] = useFonts({
    Helvetica: require('../../../assets/fonts/helvetica.ttf'),
  });

  
  // 4) KLAVYE ANİMASYONU — hook sabit, sadece içeride koşul
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

  const topHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [TOP_BIG_H, TOP_SMALL_H] });
  const logoScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, LOGO_MIN_SCALE] });

  // 5) FORM DOĞRULAMALARI
  const isErciyesMail = (m) => m?.trim().toLowerCase().endsWith('@erciyes.edu.tr');
  const is10Digits    = (s) => /^\d{10}$/.test(s);

  const formValid = useMemo(() => {
    const F = firstName.trim();
    const L = lastName.trim();
    const S = studentNo.trim();
    const E = email.trim().toLowerCase();
    const D = dept;
    return (
      F.length > 0 &&
      L.length > 0 &&
      is10Digits(S) &&
      D !== 'Seçiniz…' &&
      isErciyesMail(E) &&
      pass.length >= 6
    );
  }, [firstName, lastName, studentNo, dept, email, pass]);

  const mapAuthError = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':   return 'Bu e-posta ile zaten bir hesap var.';
      case 'auth/invalid-email':          return 'E-posta geçersiz.';
      case 'auth/weak-password':          return 'Şifre zayıf (min 6).';
      case 'auth/network-request-failed': return 'Ağ hatası. İnterneti kontrol et.';
      default:                            return 'Beklenmeyen bir hata oluştu.';
    }
  };

  const handleSignup = async () => {
    if (!formValid) {
      return Alert.alert('Uyarı', 'Lütfen tüm alanları hatasız doldurun. (@erciyes.edu.tr, şifre ≥ 6, No 10 hane)');
    }
    try {
      setBusy(true);
      const E = email.trim().toLowerCase();
      const F = firstName.trim();
      const L = lastName.trim();
      const S = studentNo.trim();

      // 1) Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, E, pass);
      const uid = user.uid;

      // 2) Firestore — students/{uid}
      await saveStudent(uid, {
        firstName: F,
        lastName: L,
        fullName: `${F} ${L}`,
        studentNo: S,
        department: dept,
        email: E,
      });

      // 3) users/{uid} özet
      await setDoc(doc(db, 'users', uid), {
        uid,
        role: 'student',
        email: E,
        fullName: `${F} ${L}`,
        createdAt: serverTimestamp(),
      }, { merge: true });

      Alert.alert('Başarılı', 'Öğrenci kaydı oluşturuldu.');
      navigation.replace('LoginStudent');
    } catch (e) {
      const msg = mapAuthError(e?.code) + (e?.code ? ` [${e.code}]` : '');
      Alert.alert('Hata', msg);
      console.log('Signup error:', e);
    } finally {
      setBusy(false);
    }
  };

  // 6) ERKEN RETURN YOK — sadece UI’ı koşullu çiz
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Sol üst rozet */}
      <Image source={require('../../../assets/Logo1.png')} style={styles.cornerBadge} resizeMode="contain" />

      {/* Üst beyaz alan */}
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.wrap}>
              <Text style={styles.title}>Öğrenci Kayıt</Text>

              <TextInput
                style={styles.input}
                placeholder="Ad *"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Soyad *"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Öğrenci No (10 hane) *"
                value={studentNo}
                onChangeText={(t) => setStudentNo((t || '').replace(/[^\d]/g, ''))}
                keyboardType="number-pad"
                maxLength={10}
              />

              <View style={styles.pickerBox}>
                <Picker selectedValue={dept} onValueChange={setDept}>
                  {DEPARTMENTS.map((d) => (<Picker.Item key={d} label={d} value={d} />))}
                </Picker>
              </View>

              <TextInput
                style={styles.input}
                placeholder="E-posta (@erciyes.edu.tr) *"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Şifre (min 6 karakter) *"
                value={pass}
                onChangeText={setPass}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.btn, (!formValid || busy) && styles.btnDisabled]}
                onPress={handleSignup}
                disabled={!formValid || busy}
              >
                <Text style={styles.btnText}>{busy ? '...' : 'Kaydol'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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

  circleTitle:    { fontFamily: 'Helvetica', fontSize: 22, color: NAVY, marginTop: -14 },
  circleSubtitle: { fontFamily: 'Helvetica', fontSize: 16, color: NAVY, marginTop: -8 },

  title: {
    fontFamily: 'Helvetica',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    alignSelf: 'center',
  },

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

  scroll: { flexGrow: 1, padding: 24 },
  wrap:   { alignItems: 'center' },

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

  pickerBox: {
    width: FIELD_WIDTH,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
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
    fontSize: 16
  },
  btnDisabled: { opacity: 0.5 },

  rememberTxt: { fontFamily: 'Helvetica', marginLeft: 8, color: '#fff' },
  resetTxt:    { fontFamily: 'Helvetica', color: '#fff', fontWeight: '700' },
  row: {
    width: FIELD_WIDTH,
    marginTop: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
