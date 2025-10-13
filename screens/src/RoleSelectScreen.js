import React, { useCallback, useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; // ← konumuna göre yol doğru

export default function RoleSelectScreen({ navigation }) {
  const [checking, setChecking] = useState(true);

  // Ekran odağa geldiğinde kullanıcı varsa rolünü kontrol et
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const run = async () => {
        try {
          const user = auth.currentUser;
          if (!user) {
            // Oturum yok → butonları göster
            if (mounted) setChecking(false);
            return;
          }

          const uid = user.uid;

          // 1) Öğrenci profili var mı?
          const sSnap = await getDoc(doc(db, 'students', uid));
          if (sSnap.exists()) {
            // İstersen role alanını doğrulayabilirsin: sSnap.data().role === 'student'
            navigation.replace('StudentHome');
            return;
          }

          // 2) Akademisyen profili var mı?
          const aSnap = await getDoc(doc(db, 'academics', uid));
          if (aSnap.exists()) {
            navigation.replace('AcademicHome');
            return;
          }

          // 3) Hiçbiri yok → profil yok, rol seçtirelim
          if (mounted) setChecking(false);
        } catch (err) {
          console.error('Role check error:', err);
          Alert.alert('Hata', 'Profil kontrolü yapılırken bir sorun oluştu.');
          if (mounted) setChecking(false);
        }
      };

      run();
      return () => { mounted = false; };
    }, [navigation])
  );

  if (checking) {
    return (
      <View style={[styles.wrap, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: '#003366' }}>Profil kontrol ediliyor…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {/* Logo */}
      <Image source={require('../../assets/Logo1.png')} style={styles.logo} />

      {/* Başlık */}
      <Text style={styles.title}>Yoklama Sistemi</Text>

      {/* Öğrenci Giriş */}
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('LoginStudent')}>
        <Text style={styles.txt}>Öğrenci</Text>
      </TouchableOpacity>

      {/* Akademik Giriş */}
      <TouchableOpacity style={styles.btnOutLine} onPress={() => navigation.navigate('LoginAcademic')}>
        <Text style={styles.txtOutLine}>Akademik Personel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#c2dcffCC',
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
    color: '#003366',
    fontFamily: 'serif',
  },
  btn: {
    width: '80%',
    backgroundColor: '#0782F9',
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  btnOutLine: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0782F9',
  },
  txt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  txtOutLine: {
    color: '#0782F9',
    fontSize: 16,
    fontWeight: '700',
  },
});
