import React, { useMemo, useState,useEffect,useRef,useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,Dimensions,Image,
  Animated,Keyboard,Easing,StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { saveAcademic } from '../services/userRepo';

const { width, height } = Dimensions.get('window');
const NAVY = '#0b1f3b';

// Görsel/Animasyon — ⬇️ BEYAZ ALAN KISALDI
const CARD_SIZE      = Math.min(width * 0.73, 380);  // önce 0.80 / 360'tı
const FIELD_WIDTH    = Math.min(width * 0.80, 360);
const TOP_BIG_H      = CARD_SIZE+28 ;  // önce çok yüksekti
const TOP_SMALL_H    = 140;                           // klavyede daha da küçül
const LOGO_MIN_SCALE = 0.52;                          // küçülürken orantı koru

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

export default function SignupAcademicScreen({ navigation }) {
const [fontsLoaded] = useFonts({
    Helvetica: require('../../../assets/fonts/helvetica.ttf'),
  });
  if (!fontsLoaded) return null;


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


  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [title,     setTitle]     = useState(''); // artık zorunlu
  const [dept,      setDept]      = useState(DEPARTMENTS[0]);
  const [email,     setEmail]     = useState('');
  const [pass,      setPass]      = useState('');
  const [busy,      setBusy]      = useState(false);

  const isErciyesMail = (m) => m?.trim().toLowerCase().endsWith('@erciyes.edu.tr');

  const formValid = useMemo(() => {
    const F = firstName.trim();
    const L = lastName.trim();
    const T = title.trim();
    const D = dept;
    const E = email.trim().toLowerCase();
    return (
      F.length > 0 &&
      L.length > 0 &&
      T.length > 0 &&              // zorunlu oldu
      D !== 'Seçiniz…' &&
      isErciyesMail(E) &&
      pass.length >= 6
    );
  }, [firstName, lastName, title, dept, email, pass]);

  const handleSignup = async () => {
  if (!formValid) {
    return Alert.alert(
      'Uyarı',
      'Lütfen tüm alanları hatasız doldurun. (E-posta @erciyes.edu.tr, Şifre min. 6 karakter)'
    );
  }

  try {
    setBusy(true);

    const E = email.trim().toLowerCase();
    const F = firstName.trim();
    const L = lastName.trim();
    const T = title.trim();
    const D = dept;

    // 1) AUTH — TEK KERE çağır
    const cred = await createUserWithEmailAndPassword(auth, E, pass);
    const uid  = cred.user.uid;           // <- UID BURADAN

    // 2) PROFİL — Repo kullanıyorsan:
    // saveAcademic(uid, data) imzası doğruysa:
    await saveAcademic(uid, {
      uid,
      role: 'academic',
      firstName: F,
      lastName: L,
      fullName: `${F} ${L}`,
      academicTitle: T,
      department: D,
      email: E,
      createdAt: serverTimestamp(),
    });

    // Eğer saveAcademic kullanmak istemezsen Firestore'a direkt yaz:
    // await setDoc(doc(db, 'academics', uid), {
    //   uid, role:'academic', firstName:F, lastName:L,
    //   fullName:`${F} ${L}`, academicTitle:T, department:D,
    //   email:E, createdAt: serverTimestamp()
    // });

    Alert.alert('Başarılı', 'Akademisyen kaydı oluşturuldu.');
    navigation.replace('LoginAcademic');
  } catch (e) {
    // Sık karşılaşılan hata: auth/email-already-in-use
    Alert.alert('Hata', e?.message ?? String(e));
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
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.wrap}>
            <Text style={styles.title}>Akademisyen Kayıt</Text>

            <TextInput
              style={styles.input} placeholder="Ad *"
              value={firstName} onChangeText={setFirstName} autoCapitalize="words"
            />
            <TextInput
              style={styles.input} placeholder="Soyad *"
              value={lastName} onChangeText={setLastName} autoCapitalize="words"
            />
            <TextInput
              style={styles.input} placeholder="Akademik Ünvan * (örn: Dr. Öğr. Üyesi, Doç. Dr.)"
              value={title} onChangeText={setTitle}
            />

            <View style={styles.pickerBox}>
              <Picker selectedValue={dept} onValueChange={setDept}>
                {DEPARTMENTS.map((d)=> (<Picker.Item key={d} label={d} value={d}/>))}
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


title: {
    fontFamily: 'Helvetica',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',     // ← metni ortalar
    alignSelf: 'center',     // ← Text bileşenini ortalar
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

  formScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
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



 // 4) Picker kutusu — genişlik ve merkez
  pickerBox: {
    width: FIELD_WIDTH,        // ← kritik
    alignSelf: 'center',       // ← ortada kalsın
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    
  },
    
    
    scroll: { flexGrow: 1, padding: 24 },
  wrap:   {  alignItems:'center'},
  //title:  { fontSize: 22, fontWeight: '700', marginBottom: 12 },
 // input:  { backgroundColor:'#fff', borderRadius:10, padding:12, marginTop:8 },
  //btn:    { backgroundColor:'#0782F9', padding:14, borderRadius:10, marginTop:14, alignItems:'center' },
  btnDisabled: { opacity: 0.5 },
  //btnTxt: { color:'#fff', fontWeight:'700' },
});
