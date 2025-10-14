import React, { useEffect } from 'react';
import { View, Text, BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function StudentHome() {
  const navigation = useNavigation();

  // Header back ve iOS geri jestini kapat
  useEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      gestureEnabled: false,
    });
  }, [navigation]);

  // Android donanım geri tuşu → LoginStudent'a reset
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'LoginStudent' }],
        });
        return true; // varsayılan geri davranışını engelle
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [navigation])
  );

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Student Home</Text>
    </View>
  );
}
