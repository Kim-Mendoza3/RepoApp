import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useAnimatedValue, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedButton } from '@/components/animated-button';
import { logoSource } from '@/components/brand-logo';
import { GridBackground } from '@/components/grid-background';
import { GoogleLogoIcon, UserCircleIcon, UserCirclePlusIcon } from '@/components/icons';
import { ScienceBackground } from '@/components/science-background';
import { useColors } from '@/context/theme-context';
import { authRedirectUrl, supabase } from '@/lib/supabase';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

// Al iniciar sesión no navegamos a mano: el AuthProvider detecta la nueva sesión
// y las rutas protegidas de _layout.tsx abren la app automáticamente.
export default function LoginScreen() {
  const colors = useColors();
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

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.background }];
  const HeaderIcon = isRegistering ? UserCirclePlusIcon : UserCircleIcon;

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GridBackground color={colors.grid} />
      <ScienceBackground color={colors.accent} opacity={0.25} />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.logoTile, { borderColor: colors.line, transform: [{ scale: logoScale }] }]}>
            <Image accessibilityLabel="Logo de deDivulgadores" contentFit="contain" source={logoSource} style={styles.logo} />
          </Animated.View>
          <Text style={[textStyles.label, styles.kicker, { color: colors.accent }]}>{'// asociación civil'}</Text>
          <Text style={[styles.intro, { color: colors.muted }]}>Ciencia, creatividad y comunidad.</Text>

          <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.header}>
              <View style={[styles.headerIcon, { backgroundColor: colors.soft }]}>
                <HeaderIcon color={colors.accent} size={26} weight="duotone" />
              </View>
              <View style={styles.headerCopy}>
                <Text style={[textStyles.label, { color: colors.accent }]}>CUENTA</Text>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isRegistering ? 'Crear una cuenta' : 'Iniciar sesión'}</Text>
              </View>
            </View>
            <Text style={[styles.welcome, { color: colors.text }]}>Te damos la bienvenida</Text>
            <Text style={[styles.description, { color: colors.muted }]}>
              {isRegistering ? 'Crea una cuenta gratuita para continuar a tu espacio de aprendizaje.' : 'Ingresa tus datos para continuar a tu espacio de aprendizaje.'}
            </Text>
            <Text style={[styles.label, { color: colors.text }]}>Correo electrónico</Text>
            <TextInput
              accessibilityLabel="Correo electrónico"
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
            <Text style={[styles.label, { color: colors.text }]}>Contraseña</Text>
            <TextInput
              accessibilityLabel="Contraseña"
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
            <AnimatedButton disabled={submitting} label={submitting ? 'Procesando...' : isRegistering ? 'Crear cuenta' : 'Iniciar sesión'} onPress={submit} variant="accent" />
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
              <Text style={[textStyles.label, { color: colors.muted, fontSize: 10 }]}>O CONTINÚA CON</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={signInWithGoogle}
              style={({ pressed }) => [styles.googleButton, { borderColor: colors.line, backgroundColor: colors.background }, pressed && pressedStyle]}
            >
              <GoogleLogoIcon color={colors.text} size={20} weight="bold" />
              <Text style={[styles.googleButtonText, { color: colors.text }]}>Continuar con Google</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={submitting} onPress={() => { setIsRegistering(!isRegistering); setError(''); }} style={styles.modeButton}>
              <Text style={[styles.modeButtonText, { color: colors.accent }]}>{isRegistering ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}</Text>
            </Pressable>
            <Text style={[styles.helper, { color: colors.muted }]}>Tu sesión se guarda de forma segura en este dispositivo.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 22 },
  logoTile: { width: 148, height: 148, borderRadius: 34, borderWidth: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  logo: { width: 112, height: 114 },
  kicker: { fontSize: 12 },
  intro: { fontFamily: fonts.body, marginTop: 6, marginBottom: 22, fontSize: 15, textAlign: 'center' },
  box: { width: '100%', maxWidth: 410, borderRadius: 22, borderWidth: 1, padding: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerTitle: { fontFamily: fonts.display, fontSize: 21, lineHeight: 25, marginTop: 2 },
  welcome: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, marginBottom: 6 },
  description: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, marginBottom: 20 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, marginBottom: 6 },
  input: { height: 52, borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, marginBottom: 16, fontFamily: fonts.body, fontSize: 15 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, marginBottom: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  googleButton: { minHeight: 52, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleButtonText: { fontFamily: fonts.bodySemi, fontSize: 15 },
  modeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, marginTop: 10 },
  modeButtonText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  helper: { fontFamily: fonts.body, fontSize: 11, lineHeight: 17, marginTop: 8, textAlign: 'center' },
});
