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
import { saveAcademic } from '../services/userRepo';

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
      return Alert.alert('Uyarı', 'Lütfen tüm alanları hatasız doldurun. (E-posta @erciyes.edu.tr, Şifre min. 6 karakter)');
    }
    try {
      setBusy(true);
      const E = email.trim().toLowerCase();
      const F = firstName.trim();
      const L = lastName.trim();
      const T = title.trim();

      const cred = await createUserWithEmailAndPassword(auth, E, pass);
      const uid  = cred.user.uid;
      await saveAcademic(user.uid, {
  firstName: F,
  lastName: L,
  department: dept,
  email: E,
});
     /* await setDoc(doc(db, 'users_academics', uid), {
        uid,
        role: 'academic',
        firstName: F,
        lastName: L,
        fullName: `${F} ${L}`,
        academicTitle: T,
        department: dept,
        email: E,
        createdAt: serverTimestamp(),
      });*/

      Alert.alert('Başarılı', 'Akademisyen kaydı oluşturuldu.');
      navigation.replace('LoginAcademic');
    } catch (e) {
      Alert.alert('Hata', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{flex:1}}>
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
              <Text style={styles.btnTxt}>{busy ? '...' : 'Kaydol'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24 },
  wrap:   { flex: 1, justifyContent:'center', padding:24 },
  title:  { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input:  { backgroundColor:'#fff', borderRadius:10, padding:12, marginTop:8 },
  pickerBox: { backgroundColor:'#fff', borderRadius:10, marginTop:8, overflow:'hidden' },
  btn:    { backgroundColor:'#0782F9', padding:14, borderRadius:10, marginTop:14, alignItems:'center' },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color:'#fff', fontWeight:'700' },
});
