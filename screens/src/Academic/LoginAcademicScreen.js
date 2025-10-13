// screens/academic/LoginAcademicScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { fetchRole } from '../services/userRepo';

export default function LoginAcademicScreen({ navigation }) {
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
    if (!email || !pass) return Alert.alert('Uyarı', 'E-posta ve şifre girin.');
    try {
      setBusy(true);

      // 1) Auth
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const uid = user.uid;

      // 2) Rol tespiti: userRepo.fetchRole() -> 'academic' | 'student' | null
      let role = null;
      try {
        role = await fetchRole(uid);
      } catch (_) {
        // fetchRole yoksa Firestore'dan kontrol edelim (opsiyonel)
        const snap = await getDoc(doc(db, 'academics', uid));
        role = snap.exists() ? 'academic' : null;
      }

      // 3) Yönlendirme
      if (role === 'academic') {
        navigation.replace('HomeScreen');
      } else {
        // profil yoksa ya da öğrenci ise
        navigation.replace('RoleSelect');
      }
    } catch (e) {
      const msg = e?.code ? mapAuthError(e.code) + ` [${e.code}]` : (e?.message ?? String(e));
      Alert.alert('Hata', msg);
      console.log('Academic login error:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Akademisyen Giriş</Text>

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

        <TouchableOpacity style={[styles.btn, busy && {opacity:0.6}]} onPress={handleLogin} disabled={busy}>
          <Text style={styles.btnTxt}>{busy ? '...' : 'Giriş Yap'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignupAcademic')} style={styles.linkBtn}>
          <Text style={styles.linkTxt}>Hesabınız yok mu? Kayıt Ol</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap:{ flex:1, justifyContent:'center', padding:24 },
  title:{ fontSize:22, fontWeight:'700', marginBottom:12 },
  input:{ backgroundColor:'#fff', borderRadius:10, padding:12, marginTop:8 },
  btn:{ backgroundColor:'#0782F9', padding:14, borderRadius:10, marginTop:12, alignItems:'center' },
  btnTxt:{ color:'#fff', fontWeight:'700' },
  linkBtn:{ marginTop:14, alignItems:'center' },
  linkTxt:{ color:'#0782F9', fontWeight:'700' },
});
