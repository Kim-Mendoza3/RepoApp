import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';

export default function AuthCallbackScreen() {
  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      const url = await Linking.getInitialURL();
      const fragment = url?.split('#')[1];
      const params = fragment ? new URLSearchParams(fragment) : null;
      const accessToken = params?.get('access_token');
      const refreshToken = params?.get('refresh_token');

      if (supabase && accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error && mounted) {
          router.replace('/');
          return;
        }
      }

      if (mounted) router.replace('/');
    };

    void handleCallback();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator />
      <Text style={styles.text}>Confirmando tu cuenta...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  text: { fontSize: 15 },
});
