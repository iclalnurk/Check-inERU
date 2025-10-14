import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { saveStudent } from '../services/userRepo'; // ← yolunu ayarla
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
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [dept,      setDept]      = useState(DEPARTMENTS[0]);
  const [email,     setEmail]     = useState('');
  const [pass,      setPass]      = useState('');
  const [busy,      setBusy]      = useState(false);

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
      case 'auth/email-already-in-use': return 'Bu e-posta ile zaten bir hesap var.';
      case 'auth/invalid-email':        return 'E-posta geçersiz.';
      case 'auth/weak-password':        return 'Şifre zayıf (min 6).';
      case 'auth/network-request-failed': return 'Ağ hatası. İnterneti kontrol et.';
      default: return 'Beklenmeyen bir hata oluştu.';
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

      // 1) Firebase Auth hesabını oluştur
      const { user } = await createUserWithEmailAndPassword(auth, E, pass);
      const uid = user.uid;

      // 2) Firestore — DOĞRU PATH: students/{uid}
      /*const studentDoc = {
        uid,
        role: 'student',
        firstName: F,
        lastName: L,
        fullName: `${F} ${L}`,
        studentNo: S,            // string, baştaki 0'lar korunur
        department: dept,
        email: E,
        createdAt: serverTimestamp(),
      };*/
     // await setDoc(doc(db, 'students', uid), studentDoc);
          await saveStudent(user.uid, {
      firstName: F,
      lastName: L,
      fullName: `${F} ${L}`,
      studentNo: S,
      department: dept,
      email: E,
    });
      // (Opsiyonel) genel users/{uid} koleksiyonuna özet yaz
      await setDoc(doc(db, 'users', uid), {
        uid,
        role: 'student',
        email: E,
        fullName: `${F} ${L}`,
        createdAt: serverTimestamp(),
      }, { merge: true });
      
      Alert.alert('Başarılı', 'Öğrenci kaydı oluşturuldu.');
      // RoleSelectScreen zaten students/{uid} varlığını kontrol edip StudentHome’a alacak
      navigation.replace('LoginStudent');
    } catch (e) {
      const msg = mapAuthError(e?.code) + (e?.code ? ` [${e.code}]` : '');
      Alert.alert('Hata', msg);
      console.log('Signup error:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{flex:1}}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.wrap}>
            <Text style={styles.title}>Öğrenci Kayıt</Text>

            <TextInput style={styles.input} placeholder="Ad *"
              value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
            <TextInput style={styles.input} placeholder="Soyad *"
              value={lastName} onChangeText={setLastName} autoCapitalize="words" />
            <TextInput style={styles.input} placeholder="Öğrenci No (10 hane) *"
              value={studentNo}
              onChangeText={(t)=> setStudentNo((t||'').replace(/[^\d]/g,''))}
              keyboardType="number-pad" maxLength={10} />

            <View style={styles.pickerBox}>
              <Picker selectedValue={dept} onValueChange={setDept}>
                {DEPARTMENTS.map((d)=> (<Picker.Item key={d} label={d} value={d}/>))}
              </Picker>
            </View>

            <TextInput style={styles.input} placeholder="E-posta (@erciyes.edu.tr) *"
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Şifre (min 6 karakter) *"
              value={pass} onChangeText={setPass} secureTextEntry />

            <TouchableOpacity style={[styles.btn, (!formValid || busy) && styles.btnDisabled]}
              onPress={handleSignup} disabled={!formValid || busy}>
              <Text style={styles.btnTxt}>{busy ? '...' : 'Kaydol'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { 
    flexGrow: 1, 
    padding: 24 },
  wrap:   { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 24 },
  title:  { 
    fontSize: 22, 
    fontWeight: '700', 
    marginBottom: 12 },
  input:  { 
    backgroundColor:'#fff', 
    borderRadius:10, 
    padding:12, 
    marginTop:8 },
  pickerBox: { 
    backgroundColor:'#fff', 
    borderRadius:10, 
    marginTop:8, 
    overflow:'hidden' },
  btn:    { 
    backgroundColor:'#0782F9', 
    padding:14, 
    borderRadius:10, 
    marginTop:14, 
    alignItems:'center' },
  btnDisabled: { 
    opacity: 0.5 },
  btnTxt: { 
    color:'#fff', 
    fontWeight:'700' },
});
