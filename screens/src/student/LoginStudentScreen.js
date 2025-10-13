// screens/academic/LoginStudentScreen.js  (yolunu kendi yapına göre ayarla)
import React, { useState } from 'react';
import {
  Alert, Platform, StyleSheet, Text, TouchableOpacity, View,
  KeyboardAvoidingView, TextInput
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { fetchRole } from '../services/userRepo';

export default function LoginStudentScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [pass,  setPass ] = useState('');
  const [busy,  setBusy ] = useState(false);

  const mapAuthError = (code) => {
    switch (code) {
      case 'auth/invalid-email': return 'E-posta geçersiz.';
      case 'auth/user-not-found':
      case 'auth/wrong-password': return 'E-posta veya şifre hatalı.';
      case 'auth/network-request-failed': return 'Ağ hatası. İnterneti kontrol et.';
      default: return 'Giriş yapılamadı.';
    }
  };

  const handleLogin = async () => {
    if (!email || !pass) return Alert.alert('Uyarı', 'Öğrenci e-postanızı ve şifrenizi girin.');
    try {
      setBusy(true);

      // 1) Auth
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const uid = user.uid;

      // 2) Rol tespiti (önce repo, olmazsa koleksiyon kontrolü)
      let role = null;
      try {
        role = await fetchRole(uid);   // 'student' | 'academic' | null
      } catch (_) {
        // yedek kontrol (opsiyonel)
       const snap = await getDoc(doc(db, 'students', uid));
        role = snap.exists() ? 'student' : null;
      }

      // 3) Yönlendirme
      if (role === 'student') {
        navigation.replace('HomeScreen');
      } else {
        // profil yoksa rol seçimine / kayıt tamamlamaya yönlendir
        navigation.replace('RoleSelect');
      }
    } catch (e) {
      const msg = e?.code ? `${mapAuthError(e.code)} [${e.code}]` : (e?.message ?? String(e));
      Alert.alert('Hata', msg);
      console.log('Student login error:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Öğrenci Girişi</Text>

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Şifre"
          secureTextEntry
          value={pass}
          onChangeText={setPass}
        />

        <TouchableOpacity style={[styles.btn, busy && { opacity: 0.6 }]} onPress={handleLogin} disabled={busy}>
          <Text style={styles.btnTxt}>{busy ? '...' : 'Giriş Yap'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignupStudent')} style={styles.linkBtn}>
          <Text style={styles.linkTxt}>Hesabın yok mu? Kayıt Ol</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  btn: {
    width: '85%',
    backgroundColor: '#0782F9',
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  btnTxt: {
    color: '#fff',
    fontWeight: '700',
  },
  linkBtn: { marginTop: 14, alignItems: 'center' },
  linkTxt: { color: '#0782F9', fontWeight: '700' },
});
