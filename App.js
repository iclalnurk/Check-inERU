// App.js
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';

// BURAYI EKLEYİN: firebase.js dosyanızı import edin
import './firebase'; // Eğer firebase.js dosyası App.js ile aynı seviyede değilse, doğru yolu belirtin.
                       // Örneğin: import './utils/firebase'; veya import '../firebase';

import LoginStudentScreen from './screens/src/student/LoginStudentScreen';
import SignupStudentScreen from './screens/src/student/SignupStudentScreen';
import LoginAcademicScreen from './screens/src/Academic/LoginAcademicScreen';
import SignupAcademicScreen from './screens/src/Academic/SignupAcademicScreen';
import RoleSelectScreen from './screens/src/RoleSelectScreen';
import HomeScreen from './screens/src/HomeScreen';
import StudentHome from './screens/src/student/StudentHome';
import AcademicHome from './screens/src/Academic/AcademicHome';
const Stack = createNativeStackNavigator();

export default function App() {
  // ... (geri kalan kodunuz aynı kalır)
  return (
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
    </NavigationContainer>
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
