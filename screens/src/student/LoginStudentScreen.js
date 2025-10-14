// screens/academic/LoginStudentScreen.js (yolunu kendine göre ayarla)
import React, { useEffect, useState } from 'react';
import {
  Alert, Platform, StyleSheet, Text, TouchableOpacity, View,
  KeyboardAvoidingView, TextInput, Switch
} from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail, } from 'firebase/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';



const AS_EMAIL_KEY = 'login_email';
const AS_REMEMBER_KEY = 'remember_me';
const SEC_PASS_KEY = 'login_password'; // SecureStore anahtarı

export default function LoginStudentScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [pass,  setPass ] = useState('');
  const [busy,  setBusy ] = useState(false);
  const [remember, setRemember] = useState(false);

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

      // 1) Auth
      const { user } = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
      const uid = user.uid;

      // 2) Öğrenci profili var mı?
      const snap = await getDoc(doc(db, 'students', uid));
      if (!snap.exists()) {
        Alert.alert('Uyarı', 'Bu hesap öğrenci profili içermiyor. Akademisyen girişi mi denemelisin?');
        return;
      }

      // 3) “Beni hatırla” durumuna göre sakla / sil
      await persistCreds(remember, email.trim().toLowerCase(), pass);

      // 4) Geçiş
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
  if (!eml) {
    return Alert.alert('Uyarı', 'Lütfen e-posta adresinizi yazın.');
  }
  try {
    setBusy(true);

    // İsteğe bağlı: actionCodeSettings eklemek istersen yorumdan çıkar
    // const actionCodeSettings = {
    //   url: 'https://yourapp.example.com/reset-done',
    //   handleCodeInApp: false,
    //   // dynamicLinkDomain: 'yourapp.page.link',
    // };

    await sendPasswordResetEmail(auth, eml /*, actionCodeSettings*/);

    Alert.alert(
      'E-posta gönderildi',
      'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi. Spam/Junk klasörünü de kontrol edin.'
    );
  } catch (e) {
    // kullanıcı deneyimi için kısa/hijyenik hata mesajı
    const msg =
      e?.code === 'auth/too-many-requests'
        ? 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.'
        : (e?.message ?? String(e));
    Alert.alert('Gönderilemedi', msg);
    console.log('reset error:', e);
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

        <View style={styles.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Switch value={remember} onValueChange={setRemember} />
            <Text style={{ marginLeft: 8 }}>Beni hatırla</Text>
          </View>

          <TouchableOpacity onPress={handleResetPassword}>
            <Text style={styles.resetTxt}>Şifreyi unuttum?</Text>
          </TouchableOpacity>
        </View>

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
  row: {
    width: '85%',
    marginTop: 10,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetTxt: { color: '#0782F9', fontWeight: '700' },
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
