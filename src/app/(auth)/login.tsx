import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useAnimatedValue, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedButton } from '@/components/animated-button';
import { BrandLogo } from '@/components/brand-logo';
import { ScienceBackground } from '@/components/science-background';
import { useAppTheme, useColors } from '@/context/theme-context';
import { authRedirectUrl, supabase } from '@/lib/supabase';
import type { ThemeMode } from '@/theme/palette';

// Al iniciar sesión no navegamos a mano: el AuthProvider detecta la nueva sesión
// y las rutas protegidas de _layout.tsx abren la app automáticamente.
export default function LoginScreen() {
  const colors = useColors();
  const { mode } = useAppTheme();
  const authColors = getAuthColors(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const logoScale = useAnimatedValue(1);

  // El logo "respira" suavemente.
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(logoScale, { toValue: 1.04, duration: 1400, useNativeDriver: true }),
      Animated.timing(logoScale, { toValue: 1, duration: 1400, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [logoScale]);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!supabase) {
      setError('La autenticación no está configurada. Verifica las variables de Supabase.');
      return;
    }
    if (!normalizedEmail || !normalizedEmail.includes('@') || password.length < 6) {
      setError('Escribe un correo válido y una contraseña de al menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    setError('');
    const result = isRegistering
      ? await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: authRedirectUrl } })
      : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setSubmitting(false);

    if (result.error) {
      setError(isRegistering && result.error.message.includes('already registered')
        ? 'Ese correo ya tiene una cuenta. Inicia sesión.'
        : result.error.message);
      return;
    }

    if (isRegistering && !result.data.session) {
      setError('Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.');
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      setError('La autenticación no está configurada. Verifica las variables de Supabase.');
      return;
    }

    setSubmitting(true);
    setError('');
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectUrl, skipBrowserRedirect: true },
    });

    if (oauthError || !data.url) {
      setSubmitting(false);
      setError(oauthError?.message ?? 'No se pudo iniciar el acceso con Google.');
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUrl);
    if (result.type === 'success') {
      const fragment = result.url.split('#')[1];
      const params = fragment ? new URLSearchParams(fragment) : null;
      const accessToken = params?.get('access_token');
      const refreshToken = params?.get('refresh_token');

      if (!accessToken || !refreshToken) {
        setError('Google no devolvió una sesión válida. Intenta nuevamente.');
      } else {
        const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (sessionError) setError(sessionError.message);
      }
    } else if (result.type !== 'cancel' && result.type !== 'dismiss') {
      setError('No se pudo completar el acceso con Google.');
    }
    setSubmitting(false);
  };

  const inputStyle = [styles.input, { color: colors.text, borderColor: authColors.border, backgroundColor: authColors.input }];

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScienceBackground opacity={0.3} />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.logo, { backgroundColor: colors.surface, borderColor: colors.line, transform: [{ scale: logoScale }] }]}>
            <BrandLogo />
          </Animated.View>
          <Text style={[styles.kicker, { color: colors.blue }]}>ASOCIACIÓN CIVIL</Text>
          <Text style={[styles.intro, { color: colors.muted }]}>Ciencia, creatividad y comunidad.</Text>
          <View style={[styles.box, { backgroundColor: authColors.panel, borderColor: authColors.border }]}>
            <View style={[styles.header, { backgroundColor: authColors.header }]}>
              <View style={[styles.headerIcon, { backgroundColor: authColors.iconBackground }]}>
                <MaterialCommunityIcons color={authColors.accent} name={isRegistering ? 'account-plus-outline' : 'account-lock-outline'} size={23} />
              </View>
              <View style={styles.headerCopy}>
                <Text style={[styles.headerKicker, { color: authColors.accent }]}>CUENTA</Text>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isRegistering ? 'Crear una cuenta' : 'Iniciar sesión'}</Text>
              </View>
            </View>
            <Text style={[styles.welcome, { color: colors.text }]}>Te damos la bienvenida</Text>
            <Text style={[styles.description, { color: colors.muted }]}>
              {isRegistering ? 'Crea una cuenta gratuita para continuar a tu espacio de aprendizaje.' : 'Ingresa tus datos para continuar a tu espacio de aprendizaje.'}
            </Text>
            <Text style={[styles.label, { color: authColors.label }]}>Correo electrónico</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              editable={!submitting}
              keyboardType="email-address"
              onChangeText={(value) => { setEmail(value); setError(''); }}
              placeholder="ejemplo@correo.com"
              placeholderTextColor={colors.muted}
              style={inputStyle}
              value={email}
            />
            <Text style={[styles.label, { color: authColors.label }]}>Contraseña</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              editable={!submitting}
              onChangeText={(value) => { setPassword(value); setError(''); }}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={inputStyle}
              value={password}
            />
            {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
            <AnimatedButton buttonColor={authColors.accent} disabled={submitting} label={submitting ? 'Procesando...' : isRegistering ? 'Crear cuenta' : 'Iniciar sesión'} onPress={submit} />
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: authColors.border }]} />
              <Text style={[styles.dividerText, { color: colors.muted }]}>O CONTINÚA CON</Text>
              <View style={[styles.dividerLine, { backgroundColor: authColors.border }]} />
            </View>
            <Pressable accessibilityRole="button" disabled={submitting} onPress={signInWithGoogle} style={[styles.googleButton, { borderColor: authColors.border, backgroundColor: authColors.input }]}>
              <MaterialCommunityIcons color={authColors.google} name="google" size={20} />
              <Text style={[styles.googleButtonText, { color: colors.text }]}>Continuar con Google</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={submitting} onPress={() => { setIsRegistering(!isRegistering); setError(''); }} style={styles.modeButton}>
              <Text style={[styles.modeButtonText, { color: colors.blue }]}>{isRegistering ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}</Text>
            </Pressable>
            <Text style={[styles.helper, { color: colors.muted }]}>Tu sesión se guarda de forma segura en este dispositivo.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// Tonos cálidos propios del formulario de acceso.
function getAuthColors(mode: ThemeMode) {
  const dark = mode === 'dark';
  return {
    panel: dark ? '#222B3A' : '#FFFBF5',
    header: dark ? '#303B4D' : '#FFF1D6',
    input: dark ? '#1A2230' : '#FFFFFF',
    border: dark ? '#52627A' : '#E8C58C',
    label: dark ? '#D9E2F2' : '#795548',
    accent: dark ? '#FFB86B' : '#B45309',
    iconBackground: dark ? '#4B3A2B' : '#FFE1A8',
    google: dark ? '#F7FAFC' : '#4285F4',
  };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { width: 156, height: 156, borderRadius: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#A60E12', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.8, marginTop: 2 },
  intro: { marginTop: 7, marginBottom: 24, fontSize: 15, textAlign: 'center' },
  box: { width: '100%', maxWidth: 410, borderRadius: 24, borderWidth: 1, padding: 25, shadowColor: '#17202A', shadowOpacity: 0.08, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 17, padding: 13, marginBottom: 22 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  headerTitle: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  welcome: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: { height: 52, borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, marginBottom: 17, fontSize: 15 },
  error: { fontSize: 13, marginBottom: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  googleButton: { minHeight: 52, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleButtonText: { fontSize: 15, fontWeight: '800' },
  modeButton: { alignItems: 'center', marginTop: 18 },
  modeButtonText: { fontSize: 13, fontWeight: '800' },
  helper: { fontSize: 11, lineHeight: 17, marginTop: 15, textAlign: 'center' },
});
