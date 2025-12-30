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
  doc, getDoc, collection, getDocs, query, where, orderBy
} from 'firebase/firestore';

const { width } = Dimensions.get('window');
const NAVY = '#0b1f3b';
const MINI_CARD = Math.min(width * 0.38, 160);

const DAY_NAMES = {
  1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe',
  5: 'Cuma', 6: 'Cumartesi', 7: 'Pazar',
};

/* ===== Utils ===== */
const normalizeDay = (d) => {
  if (typeof d === 'number') return d;
  const s = String(d || '').toLowerCase();
  const map = {
    pazartesi:1, monday:1,
    'salı':2, sali:2, tuesday:2,
    'çarşamba':3, carsamba:3, wednesday:3,
    'perşembe':4, persembe:4, thursday:4,
    cuma:5, friday:5,
    cumartesi:6, saturday:6,
    pazar:7, sunday:7
  };
  return map[s] || 0;
};

const timeToSec = (t) => {
  if (!t) return 0;
  const m = String(t).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return 0;
  const h = parseInt(m[1], 10) || 0;
  const mm = parseInt(m[2], 10) || 0;
  const ss = parseInt(m[3] || '0', 10) || 0;
  return h * 3600 + mm * 60 + ss;
};

const makeKey = (x) => {
  const code = (x.courseCode||x.course||'').trim();
  const day  = String(x.day ?? '').trim();
  const st   = String(x.startTime || x.start || '').trim();
  const room = String(x.room || x.location || '').trim();
  const ins  = String(x.instructor || '').trim();
  return `${code}|${day}|${st}|${room}|${ins}`;
};

const addUniqueSnap = (map, snap, src) => {
  const data = snap.data();
  const key = makeKey(data) || snap.ref.path;
  if (!map.has(key)) map.set(key, { id: snap.ref.path, ...data, _source: src });
};

const slugifyTerm = (v) => {
  if (!v) return '';
  const s = String(v).toLowerCase()
    .replaceAll('ü','u').replaceAll('ş','s').replaceAll('ı','i')
    .replaceAll('ğ','g').replaceAll('ö','o').replaceAll('ç','c');
  // "güz" -> "guz" gibi durumlar için:
  if (s === 'guz' || s === 'güz') return 'guz';
  if (s === 'bahar') return 'bahar';
  return s;
};

/* ===== Component ===== */
export default function ScheduleScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ Helvetica: require('../../../assets/fonts/helvetica.ttf') });
  const [name, setName] = useState('Kullanıcı');
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState({});
  const [total, setTotal] = useState(0);
  const [info, setInfo] = useState('');
  const [banner, setBanner] = useState(null); // bölüm/sınıf/dönem/yıl gösterimi

  useEffect(() => {
    (async () => {
      setLoading(true);
      setInfo('');
      try {
        const user = auth.currentUser;
        if (!user) { setLoading(false); return; }

        /* 1) Öğrenci bilgisi */
        const stRef = doc(db, 'students', user.uid);
        const stSnap = await getDoc(stRef);
        const sData = stSnap.exists() ? (stSnap.data() || {}) : {};
        setName(sData.name || sData.fullName || user.displayName || 'Öğrenci');

        const departmentId = sData.departmentId || sData.department || null; // örn: "CENG"
        const classNo = sData.classNo || sData.class || null;               // örn: 1,2,3,4
        if (!departmentId || !classNo) {
          setInfo('Öğrenci kaydında departmentId / classNo eksik.');
          setGrouped({}); setTotal(0); return;
        }

        /* 2) Department doğrula (CSV’ye göre departments/{code}) */
        const deptRef = doc(db, 'departments', String(departmentId));
        const deptSnap = await getDoc(deptRef);
        if (!deptSnap.exists()) {
          setInfo(`'${departmentId}' kodlu bölüm departments içinde bulunamadı.`);
          setGrouped({}); setTotal(0); return;
        }
        const dept = deptSnap.data();

        /* 3) Settings -> currentTerm & currentYear */
        const settingsCandidates = [doc(db, 'settings', 'app'), doc(db, 'settings', 'global')];
        let setData = {};
        for (const ref of settingsCandidates) {
          const s = await getDoc(ref);
          if (s.exists()) { setData = s.data() || {}; break; }
        }
        const currentTermRaw = setData.currentTerm || null;     // "guz" | "bahar"
        const currentYear = Number(setData.currentYear || 0);   // 2025 gibi
        const currentTerm = slugifyTerm(currentTermRaw);

        if (!currentTerm) {
          setInfo('Settings içinde currentTerm bulunamadı.');
          setGrouped({}); setTotal(0); return;
        }

        /* 4) Doğrudan ID denemesi: {dept}-{classNo}-{term}  (örn: CENG-1-guz) */
        const directId = `${departmentId}-${classNo}-${currentTerm}`;
        let termDocs = [];
        const directRef = doc(db, 'program_terms', directId);
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
          const d = directSnap.data() || {};
          // Eğer currentYear da verildiyse ve uyuşmuyorsa, yine de alternatif arayacağız
          termDocs.push({ id: directSnap.id, ...d });
        }

        /* 5) Eğer direct yoksa veya yıl uymuyorsa, program_terms filtreli arama */
        const needAlternative =
          termDocs.length === 0 ||
          (currentYear && Number(termDocs[0].year || 0) !== currentYear);

        if (needAlternative) {
          // Önce yıl eşitlikli
          if (currentYear) {
            const qYear = query(
              collection(db, 'program_terms'),
              where('departmentId', '==', departmentId),
              where('classNo', '==', classNo),
              where('term', '==', currentTerm),
              where('year', '==', currentYear)
            );
            const ySnap = await getDocs(qYear);
            const arr = [];
            ySnap.forEach(d => arr.push({ id: d.id, ...d.data() }));
            if (arr.length) {
              termDocs = arr; // yıl uydu, bunları kullan
            }
          }

          // Hâlâ yoksa yılı esnet: aynı term için en büyük year’ı seç
          if (termDocs.length === 0) {
            const qNoYear = query(
              collection(db, 'program_terms'),
              where('departmentId', '==', departmentId),
              where('classNo', '==', classNo),
              where('term', '==', currentTerm)
            );
            const nySnap = await getDocs(qNoYear);
            const arr2 = [];
            nySnap.forEach(d => arr2.push({ id: d.id, ...d.data() }));
            if (arr2.length) {
              arr2.sort((a,b)=> (Number(b.year||0) - Number(a.year||0)));
              termDocs = [arr2[0]]; // en güncel yıl
            }
          }
        }

        if (termDocs.length === 0) {
          setInfo('Seçili currentTerm + bölüm + sınıf için dönem bulunamadı.');
          setGrouped({}); setTotal(0); return;
        }

        // Görsel banner bilgisi
        const chosen = termDocs[0];
        setBanner({
          deptName: dept?.name || departmentId,
          deptCode: dept?.code || departmentId,
          classNo: String(classNo),
          term: String(chosen.term || currentTerm),
          year: Number(chosen.year || currentYear || 0) || undefined
        });

        /* 6) Dersleri getir (yalnız alt koleksiyon) */
        const acc = new Map();
        for (const tm of termDocs) {
          const lessonsCol = collection(db, 'program_terms', tm.id, 'lessons');
          // CSV’de `day` zaten sayısal, saatler "HH:MM"
          // İstersen orderBy('day') + orderBy('startTime') ekleyebilirsin (index gerektirebilir)
          const lSnap = await getDocs(lessonsCol);
          lSnap.forEach(d => addUniqueSnap(acc, d, d.ref.path));
        }

        /* 7) Sırala + Grupla */
        const list = Array.from(acc.values()).sort((a, b) => {
          const da = normalizeDay(a.day), dbv = normalizeDay(b.day);
          if (da !== dbv) return da - dbv;
          return timeToSec(a.startTime || a.start) - timeToSec(b.startTime || b.start);
        });

        const g = { 1:[],2:[],3:[],4:[],5:[],6:[],7:[] };
        const unknown = [];
        for (const it of list) {
          const d = normalizeDay(it.day);
          if (d>=1 && d<=7) g[d].push(it); else unknown.push(it);
        }
        const groupedOut = { ...g };
        if (unknown.length) groupedOut[0] = unknown;

        setGrouped(groupedOut);
        setTotal(list.length);
        if (!list.length) setInfo('Bu dönem için ders bulunamadı.');
      } catch (e) {
        console.log('Schedule load err:', e);
        setInfo('Dersler yüklenirken hata oluştu.');
        setGrouped({}); setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.center, { backgroundColor: NAVY }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const DayBlock = ({ dayNum }) => {
    const items = grouped[dayNum] || [];
    if (!items.length) return null;
    return (
      <View style={{ marginBottom: 18 }}>
        <Text style={styles.dayHeader}>{DAY_NAMES[dayNum]}</Text>
        {items.map(item => (
          <View key={item.id} style={styles.scheduleCard}>
            <Text style={styles.courseTitle}>
              {item.title || item.courseName || item.courseCode || 'Ders'}
            </Text>
            <Text style={styles.metaText}>
              {(item.startTime || item.start) ? `${item.startTime || item.start}` : ''}
              {(item.endTime || item.end) ? ` - ${item.endTime || item.end}` : ''}
            </Text>
            <Text style={styles.metaText}>Salon: {item.room || item.location || '-'}</Text>
            <Text style={styles.metaText}>Öğretim Üyesi: {item.instructor || '-'}</Text>
            <Text style={styles.codeText}>Kod: {item.courseCode || '-'}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBox}>
        <Image
          source={require('../../../assets/Logo1.png')}
          style={styles.cornerBadge}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.settingsIcon}
          onPress={() => navigation.navigate('SettingsScreen')}
        >
          <Ionicons name="settings-outline" size={28} color={NAVY} />
        </TouchableOpacity>

        <View style={styles.logoCard}>
          <Image
            source={require('../../../assets/checkLogo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.circleTitle}>Erciyes Üniversitesi</Text>
          <Text style={styles.circleSubtitle}>Dijital Yoklama</Text>
        </View>

        <View style={styles.shadowEdge} />
      </View>

      <View style={styles.bottomBox}>
        <Text style={styles.greeting}>Merhaba, {name} 👋</Text>
        <Text style={styles.subText}>
          {banner
            ? `${banner.deptName} (${banner.deptCode}) • ${banner.classNo}. sınıf • ${banner.term}${banner.year ? ' ' + banner.year : ''} — Ders sayısı: ${total}`
            : (info ? info : `Ders sayısı: ${total}`)
          }
        </Text>

        <ScrollView style={styles.listWrap} contentContainerStyle={{ paddingBottom: 40 }}>
          {(!total || !!info) ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Bilgi</Text>
              <Text style={styles.emptySubtitle}>{info || 'Ders bulunamadı.'}</Text>
            </View>
          ) : (
            <>
              <DayBlock dayNum={1} />
              <DayBlock dayNum={2} />
              <DayBlock dayNum={3} />
              <DayBlock dayNum={4} />
              <DayBlock dayNum={5} />
              <DayBlock dayNum={6} />
              <DayBlock dayNum={7} />
              {(grouped[0] && grouped[0].length > 0) && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.dayHeader}>Günü Belirsiz</Text>
                  {grouped[0].map(item => (
                    <View key={item.id} style={styles.scheduleCard}>
                      <Text style={styles.courseTitle}>{item.title || item.courseName || item.courseCode || 'Ders'}</Text>
                      <Text style={styles.metaText}>
                        {(item.startTime || item.start) ? `${item.startTime || item.start}` : ''}
                        {(item.endTime || item.end) ? ` - ${item.endTime || item.end}` : ''}
                      </Text>
                      <Text style={styles.metaText}>Salon: {item.room || item.location || '-'}</Text>
                      <Text style={styles.metaText}>Öğretim Üyesi: {item.instructor || '-'}</Text>
                      <Text style={styles.codeText}>Kod: {item.courseCode || '-'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  topBox: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  },
  cornerBadge: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 70,
    height: 70,
    zIndex: 5,
  },
  settingsIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 6,
  },
  logoCard: {
    width: MINI_CARD,
    height: MINI_CARD,
    borderRadius: MINI_CARD / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  logo: { width: '65%', height: '65%', marginBottom: 0 },
  circleTitle: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: NAVY,
    marginTop: -8,
  },
  circleSubtitle: {
    fontFamily: 'Helvetica',
    fontSize: 13,
    color: NAVY,
    marginTop: -6,
  },
  shadowEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -8,
    height: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bottomBox: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  greeting: {
    fontFamily: 'Helvetica',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  subText: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: '#dbe3f0',
  },
  listWrap: { width: '100%', marginTop: 18 },
  emptyCard: { backgroundColor: '#fff', padding: 18, borderRadius: 12 },
  emptyTitle: { fontFamily: 'Helvetica', fontSize: 16, color: NAVY, fontWeight: '700' },
  emptySubtitle: { fontFamily: 'Helvetica', marginTop: 8, color: '#475569' },
  dayHeader: {
    fontFamily: 'Helvetica',
    fontSize: 18,
    color: '#e2e8f0',
    marginBottom: 8,
    fontWeight: '700'
  },
  scheduleCard: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  courseTitle: { fontFamily: 'Helvetica', fontSize: 16, color: NAVY, fontWeight: '700' },
  metaText: { fontFamily: 'Helvetica', marginTop: 6, color: '#475569' },
  codeText: { fontFamily: 'Helvetica', marginTop: 6, color: '#475569', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
