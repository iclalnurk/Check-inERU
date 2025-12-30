// App.js
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-gesture-handler';

import { NavigationContainer, useNavigationContainerRef, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';

// Firebase init
import './firebase';

// Ekranlar
import LoginStudentScreen from './screens/src/student/LoginStudentScreen';
import SignupStudentScreen from './screens/src/student/SignupStudentScreen';
import LoginAcademicScreen from './screens/src/Academic/LoginAcademicScreen';
import SignupAcademicScreen from './screens/src/Academic/SignupAcademicScreen';
import RoleSelectScreen from './screens/src/RoleSelectScreen';
import HomeScreen from './screens/src/HomeScreen';
import StudentHome from './screens/src/student/StudentHome';
import AcademicHome from './screens/src/Academic/AcademicHome';
import AttandanceScreen from './screens/src/student/AttandanceScreen';
import ScheduleScreen from './screens/src/student/ScheduleScreen';
import AttandanceAcademic from './screens/src/Academic/AttandanceAcademic';
import ScheduleAcademic from './screens/src/Academic/ScheduleAcademic';

const Stack = createNativeStackNavigator();
const NAVY = '#0b1f3b';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff',
  },
};

// Alt güvenli alanı aktif sayfaya göre boyar
function BottomInsetFill({ routeName }) {
  const insets = useSafeAreaInsets();
  if (!insets.bottom) return null;

  const navyRoutes = new Set([
    'RoleSelect',
    'LoginStudent',
    'SignupStudent',
    'LoginAcademic',
    'SignupAcademic',
  ]);

  const color = navyRoutes.has(routeName) ? NAVY : '#ffffff';

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: insets.bottom,
        backgroundColor: color,
      }}
    />
  );
}

export default function App() {
  const navRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState('RoleSelect');

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    (async () => {
      try {
        // Edge-to-edge aktif cihazlarda sadece ikon stilini kontrol et
        if (NavigationBar.setButtonStyleAsync) {
          await NavigationBar.setButtonStyleAsync('dark'); // koyu ikonlar
        }
      } catch (e) {
        console.log('NavBar style setup skipped:', e?.message || e);
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      {/* Üst StatusBar: beyaz + koyu ikon */}
      <StatusBar style="dark" backgroundColor="#ffffff" />

      <NavigationContainer
        ref={navRef}
        theme={navTheme}
        onReady={() => setCurrentRoute(navRef.getCurrentRoute()?.name ?? 'RoleSelect')}
        onStateChange={() => setCurrentRoute(navRef.getCurrentRoute()?.name ?? 'RoleSelect')}
      >
        <Stack.Navigator initialRouteName="RoleSelect" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
          <Stack.Screen name="LoginStudent" component={LoginStudentScreen} />
          <Stack.Screen name="SignupStudent" component={SignupStudentScreen} />
          <Stack.Screen name="LoginAcademic" component={LoginAcademicScreen} />
          <Stack.Screen name="SignupAcademic" component={SignupAcademicScreen} />
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="StudentHome" component={StudentHome} />
          <Stack.Screen name="AcademicHome" component={AcademicHome} />
          <Stack.Screen name ="AttandanceScreen" component={AttandanceScreen}/>
          <Stack.Screen name ="ScheduleScreen" component={ScheduleScreen}/>
          <Stack.Screen name ="AttandanceAcademic" component={AttandanceAcademic}/>
          <Stack.Screen name ="ScheduleAcademic" component={ScheduleAcademic}/>
        </Stack.Navigator>

        <BottomInsetFill routeName={currentRoute} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
