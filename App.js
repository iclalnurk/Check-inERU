// App.js
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View ,Platform} from 'react-native';
import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
// BURAYI EKLEYİN: firebase.js dosyanızı import edin
import './firebase'; // Eğer firebase.js dosyası App.js ile aynı seviyede değilse, doğru yolu belirtin.
                       // Örneğin: import './utils/firebase'; veya import '../firebase';
 import { SafeAreaProvider,useSafeAreaInsets  } from 'react-native-safe-area-context';

import LoginStudentScreen from './screens/src/student/LoginStudentScreen';
import SignupStudentScreen from './screens/src/student/SignupStudentScreen';
import LoginAcademicScreen from './screens/src/Academic/LoginAcademicScreen';
import SignupAcademicScreen from './screens/src/Academic/SignupAcademicScreen';
import RoleSelectScreen from './screens/src/RoleSelectScreen';
import HomeScreen from './screens/src/HomeScreen';
import StudentHome from './screens/src/student/StudentHome';
import AcademicHome from './screens/src/Academic/AcademicHome';
const Stack = createNativeStackNavigator();
const NAVY = '#0b1f3b';

function BottomInsetFill({ color = '#0b1f3b' }) {
  const insets = useSafeAreaInsets();
  if (!insets.bottom) return null;
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
  useEffect(() => {
    if (Platform.OS === 'android') {
      (async () => {
        // Gizlenmişse geri getir
        await NavigationBar.setVisibilityAsync('visible');
        // Arka plan NAVY
        await NavigationBar.setBackgroundColorAsync(NAVY);
        // Buton ikonları açık renk
        await NavigationBar.setButtonStyleAsync('light');
      })();
    }
  }, []);

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName='RoleSelect' >
        <Stack.Screen name = "RoleSelect" component={RoleSelectScreen} options={{headerShown: false}} />
        <Stack.Screen name= "LoginStudent" component={LoginStudentScreen} options= {{headerShown: false}} />
        <Stack.Screen name = "SignupStudent" component={SignupStudentScreen} options = {{headerShown: false}}/>
        <Stack.Screen name = "LoginAcademic" component={LoginAcademicScreen} options={{headerShown: false}}/>
        <Stack.Screen name = "SignupAcademic" component={SignupAcademicScreen} options={{headerShown: false}}/>
         <Stack.Screen name = "HomeScreen" component={HomeScreen} options={{headerShown: false}}/>
           <Stack.Screen name = "StudentHome" component={StudentHome} options={{headerShown: false}}/>
            <Stack.Screen name = "AcademicHome" component={AcademicHome} options={{headerShown: false}}/>
      </Stack.Navigator>
       <BottomInsetFill color="#0b1f3b" />
    </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
