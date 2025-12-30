import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Image,
  TouchableOpacity, StatusBar, Dimensions, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../../firebase';
import {
  doc, getDoc, collectionGroup, getDocs, query, where
} from 'firebase/firestore';

const { width } = Dimensions.get('window');
const NAVY = '#0b1f3b';
const MINI_CARD = Math.min(width * 0.38, 160);
const DAY_NAMES = { 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe', 5: 'Cuma', 6: 'Cumartesi', 7: 'Pazar' };

/* -------- Utils (Sıralama ve gruplama için yardımcı fonksiyonlar) -------- */
const normalizeDay = (d) => {
  if (typeof d === 'number' && d >= 1 && d <= 7) return d;
  const m = { pazartesi: 1, sali: 2, salı: 2, carsamba: 3, çarşamba: 3, persembe: 4, perşembe: 4, cuma: 5, cumartesi: 6, pazar: 7 };
  return m[String(d || '').toLowerCase()] || 0;
};
const timeToSec = (t) => {
  if (!t) return 0;
  const parts = String(t).split(':');
  return (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60;
};
const slugTerm = (v) => {
  if (!v) return null;
  return String(v).toLowerCase().replace('güz', 'guz');
};

export default function ScheduleAcademic({ navigation }) {
  const [fontsLoaded] = useFonts({ Helvetica: require('../../../assets/fonts/helvetica.ttf') });
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState({});
  const [total, setTotal] = useState(0);
  const [info, setInfo] = useState('');
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const fetchAcademicSchedule = async () => {
      setLoading(true);
      setInfo('');
      try {
        const user = auth.currentUser;
        if (!user) {
          setInfo('Lütfen giriş yapın.');
          setLoading(false);
          return;
        }

        // 1. Akademisyen profilini ve genel ayarları al
        const acRef = doc(db, 'academics', user.uid);
        const acSnap = await getDoc(acRef);
        const aData = acSnap.exists() ? acSnap.data() : {};
        setName(aData.name || user.displayName || 'Akademisyen');

        const settingsRef = doc(db, 'settings', 'global');
        const settingsSnap = await getDoc(settingsRef);
        const settings = settingsSnap.exists() ? settingsSnap.data() : {};
        const currentTerm = slugTerm(settings.currentTerm);
        const currentYear = Number(settings.currentYear) || null;
        if (currentTerm || currentYear) {
            setBanner({ term: settings.currentTerm, year: settings.currentYear });
        }

        // 2. DOĞRU YÖNTEM: Tüm 'lessons' alt koleksiyonlarını 'instructorId' alanına göre sorgula.
        // Bu, lessons.csv dosyasındaki veri yapısıyla tam uyumludur.
        const lessonsQuery = query(collectionGroup(db, 'lessons'), where('instructorId', '==', user.uid));
        const lessonsSnap = await getDocs(lessonsQuery);

        if (lessonsSnap.empty) {
          setInfo('Size atanmış ders bulunamadı.');
          setGrouped({}); setTotal(0); setLoading(false); return;
        }

        // 3. Dersleri dönem ve yıla göre filtrele (isteğe bağlı)
        const lessonPromises = lessonsSnap.docs.map(async (lessonDoc) => {
          const termRef = lessonDoc.ref.parent.parent; // program_terms/{termId} referansı
          if (termRef) {
            const ptSnap = await getDoc(termRef);
            if (ptSnap.exists()) {
              const pt = ptSnap.data();
              const termOk = !currentTerm || slugTerm(pt.term) === currentTerm;
              const yearOk = !currentYear || Number(pt.year) === currentYear;
              if (termOk && yearOk) {
                return { id: lessonDoc.id, ...lessonDoc.data() };
              }
            }
          }
          return null; // Dönem filtresine uymadı
        });

        const lessonsList = (await Promise.all(lessonPromises)).filter(Boolean);

        // 4. Dersleri güne ve saate göre sırala ve grupla
        lessonsList.sort((a, b) => {
          const da = normalizeDay(a.day), db = normalizeDay(b.day);
          if (da !== db) return da - db;
          return timeToSec(a.startTime) - timeToSec(b.startTime);
        });

        const g = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
        const unknown = [];
        for (const it of lessonsList) {
          const dn = normalizeDay(it.day);
          if (dn >= 1 && dn <= 7) g[dn].push(it); else unknown.push(it);
        }
        const out = { ...g };
        if (unknown.length) out[0] = unknown;

        setGrouped(out);
        setTotal(lessonsList.length);
        if (lessonsList.length === 0) {
          setInfo(currentTerm ? 'Bu dönem için size atanmış ders bulunamadı.' : 'Size atanmış ders bulunamadı.');
        }

      } catch (e) {
        console.error('ScheduleAcademic load err:', e);
        setInfo('Dersler yüklenirken bir hata oluştu. Lütfen internet bağlantınızı ve uygulama izinlerini kontrol edin.');
        setGrouped({}); setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAcademicSchedule();
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.center, { backgroundColor: NAVY }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const DayBlock = ({ dayNum, dayName }) => {
    const items = grouped[dayNum] || [];
    if (!items.length) return null;
    return (
      <View style={{ marginBottom: 18 }}>
        <Text style={styles.dayHeader}>{dayName}</Text>
        {items.map(item => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.title}>
              {item.title || item.courseCode || 'Ders'} {item.section ? `• ${item.section}` : ''}
            </Text>
            <Text style={styles.meta}>
              {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
            </Text>
            <Text style={styles.meta}>Salon: {item.room || '-'}</Text>
            <Text style={styles.meta}>Kod: {item.courseCode || '-'}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.topBox}>
        <Image source={require('../../../assets/Logo1.png')} style={styles.corner} resizeMode="contain" />
        <TouchableOpacity style={styles.settings} onPress={() => navigation.navigate('SettingsScreen')}>
          <Ionicons name="settings-outline" size={28} color={NAVY} />
        </TouchableOpacity>
        <View style={styles.logoCard}>
          <Image source={require('../../../assets/checkLogo.jpg')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.circleTitle}>Erciyes Üniversitesi</Text>
          <Text style={styles.circleSubtitle}>Dijital Yoklama</Text>
        </View>
        <View style={styles.shadowEdge} />
      </View>

      <View style={styles.bottomBox}>
        <Text style={styles.greeting}>Ders Programı</Text>
        <Text style={styles.subText}>
          {info
            ? info
            : `Toplam ${total} ders bulundu${banner && banner.term ? ` • Dönem: ${banner.term}${banner.year ? ' ' + banner.year : ''}` : ''}`
          }
        </Text>

        <ScrollView style={styles.listWrap} contentContainerStyle={{ paddingBottom: 40 }}>
          {total === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Bilgi</Text>
              <Text style={styles.emptySub}>{info || 'Ders bulunamadı.'}</Text>
            </View>
          ) : (
            <>
              <DayBlock dayNum={1} dayName="Pazartesi" />
              <DayBlock dayNum={2} dayName="Salı" />
              <DayBlock dayNum={3} dayName="Çarşamba" />
              <DayBlock dayNum={4} dayName="Perşembe" />
              <DayBlock dayNum={5} dayName="Cuma" />
              <DayBlock dayNum={6} dayName="Cumartesi" />
              <DayBlock dayNum={7} dayName="Pazar" />
              <DayBlock dayNum={0} dayName="Günü Belirsiz" />
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  topBox: { backgroundColor: '#fff', alignItems: 'center', paddingTop: 12, paddingBottom: 12 },
  corner: { position: 'absolute', top: 8, left: 10, width: 70, height: 70, zIndex: 5 },
  settings: { position: 'absolute', top: 12, right: 12, zIndex: 6 },
  logoCard: {
    width: MINI_CARD, height: MINI_CARD, borderRadius: MINI_CARD / 2, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6
  },
  logo: { width: '65%', height: '65%', marginBottom: 0 },
  circleTitle: { fontFamily: 'Helvetica', fontSize: 14, color: NAVY, marginTop: -8 },
  circleSubtitle: { fontFamily: 'Helvetica', fontSize: 13, color: NAVY, marginTop: -6 },
  shadowEdge: {
    position: 'absolute', left: 0, right: 0, bottom: -8, height: 16, backgroundColor: '#fff',
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4
  },
  bottomBox: { flex: 1, backgroundColor: NAVY, alignItems: 'center', paddingTop: 20, paddingHorizontal: 20 },
  greeting: { fontFamily: 'Helvetica', fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  subText: { fontFamily: 'Helvetica', fontSize: 14, color: '#dbe3f0' },
  listWrap: { width: '100%', marginTop: 18 },
  empty: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 18, borderRadius: 12 },
  emptyTitle: { fontFamily: 'Helvetica', fontSize: 16, color: '#fff', fontWeight: '700' },
  emptySub: { fontFamily: 'Helvetica', marginTop: 8, color: '#dbe3f0' },
  dayHeader: { fontFamily: 'Helvetica', fontSize: 18, color: '#e2e8f0', marginBottom: 8, fontWeight: '700' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  title: { fontFamily: 'Helvetica', fontSize: 16, color: NAVY, fontWeight: '700' },
  meta: { fontFamily: 'Helvetica', marginTop: 6, color: '#475569' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});