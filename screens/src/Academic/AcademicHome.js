import React, { useEffect } from 'react';
import { View, Text, BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function AcademicHome() {
  const navigation = useNavigation();

  // Header back ve iOS geri jestini kapat
  useEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      gestureEnabled: false,
    });
  }, [navigation]);

  // Android donanım geri tuşu → LoginAcademic'e reset
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'LoginAcademic' }],
        });
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [navigation])
  );

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Academic Home</Text>
    </View>
  );
}
