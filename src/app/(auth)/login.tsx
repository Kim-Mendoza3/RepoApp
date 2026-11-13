import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useAnimatedValue,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedButton } from '@/components/animated-button';
import { logoSource } from '@/components/brand-logo';
import { GridBackground } from '@/components/grid-background';
import { ArrowLeftIcon, GoogleLogoIcon, UserCircleIcon, UserCirclePlusIcon } from '@/components/icons';
import { ScienceBackground } from '@/components/science-background';
import { useColors } from '@/context/theme-context';
import { authRedirectUrl, supabase } from '@/lib/supabase';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

type Mode = 'login' | 'register';

// Al iniciar sesión no navegamos a mano: el AuthProvider detecta la nueva sesión
// y las rutas protegidas de _layout.tsx abren la app automáticamente.
export default function LoginScreen() {
  const colors = useColors();
  // El menú puede abrir el login directo en "Crear cuenta" con ?mode=register.
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: Mode = params.mode === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [switchWidth, setSwitchWidth] = useState(0);
  const logoScale = useAnimatedValue(1);
  const indicator = useAnimatedValue(initialMode === 'register' ? 1 : 0); // 0 = Iniciar sesión, 1 = Crear cuenta
  const slide = useAnimatedValue(0); // barrido del contenido: 1 entra por la derecha, -1 por la izquierda

  const isRegistering = mode === 'register';
  // Cada modo tiene su color: cian para entrar, índigo para crear cuenta.
  const accent = isRegistering ? colors.accent2 : colors.accent;
  const onAccent = isRegistering ? colors.onAccent2 : colors.onAccent;

  // El logo "respira" suavemente.
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(logoScale, { toValue: 1.04, duration: 1400, useNativeDriver: true }),
      Animated.timing(logoScale, { toValue: 1, duration: 1400, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [logoScale]);

  const exploreAsGuest = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const switchMode = (next: Mode) => {
    if (next === mode || submitting) return;
    setMode(next);
    setError('');
    setNotice('');
    setConfirmPassword('');
    // Mismo barrido lateral que las pestañas de la app: "Crear cuenta" está a la derecha.
    slide.setValue(next === 'register' ? 1 : -1);
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 380, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }),
      Animated.spring(indicator, { toValue: next === 'register' ? 1 : 0, useNativeDriver: true, speed: 18, bounciness: 6 }),
    ]).start();
  };

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setNotice('');
    if (!supabase) {
      setError('La autenticación no está configurada. Verifica las variables de Supabase.');
      return;
    }
    if (!normalizedEmail || !normalizedEmail.includes('@') || password.length < 6) {
      setError('Escribe un correo válido y una contraseña de al menos 6 caracteres.');
      return;
    }
    if (isRegistering && password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Escríbelas de nuevo.');
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
      setNotice('Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.');
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      setError('La autenticación no está configurada. Verifica las variables de Supabase.');
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');
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
  const half = Math.max(0, (switchWidth - 8) / 2);
  const indicatorX = indicator.interpolate({ inputRange: [0, 1], outputRange: [0, half] });
  const loginLabelOpacity = indicator.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' });
  // El indicador también funde su color de cian a índigo mientras se desliza.
  const registerTint = indicator.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const contentX = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [-60, 0, 60] });
  const contentOpacity = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] });

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GridBackground color={colors.grid} />
      <ScienceBackground color={accent} opacity={0.25} />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Modo invitado: la cuenta es opcional, se puede volver a la app sin iniciar sesión. */}
          <Pressable
            accessibilityRole="button"
            onPress={exploreAsGuest}
            style={({ pressed }) => [styles.guestButton, { backgroundColor: colors.surface, borderColor: colors.line }, pressed && pressedStyle]}
          >
            <ArrowLeftIcon color={colors.text} size={18} weight="bold" />
            <Text style={[styles.guestText, { color: colors.text }]}>Explorar sin cuenta</Text>
          </Pressable>
          <Animated.View style={[styles.logoTile, { borderColor: colors.line, transform: [{ scale: logoScale }] }]}>
            <Image accessibilityLabel="Logo de deDivulgadores" contentFit="contain" source={logoSource} style={styles.logo} />
          </Animated.View>
          <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={[styles.chipDot, { backgroundColor: colors.accent }]} />
            <Text style={[textStyles.label, { color: colors.accent }]}>ASOCIACIÓN CIVIL</Text>
          </View>
          <Text style={[styles.intro, { color: colors.muted }]}>Ciencia, creatividad y comunidad.</Text>

          <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {/* Selector de modo con indicador deslizante. */}
            <View
              accessibilityRole="tablist"
              onLayout={(event: LayoutChangeEvent) => setSwitchWidth(event.nativeEvent.layout.width)}
              style={[styles.switch, { backgroundColor: colors.background, borderColor: colors.line }]}
            >
              <Animated.View style={[styles.switchIndicator, { width: half, backgroundColor: colors.accent, transform: [{ translateX: indicatorX }] }]}>
                <Animated.View style={[styles.switchIndicatorFill, { backgroundColor: colors.accent2, opacity: registerTint }]} />
              </Animated.View>
              {/*
                Cada opción tiene dos textos encimados (gris y claro) que se funden al ritmo del
                indicador. Así el texto nunca queda claro sobre el fondo claro a mitad del deslizamiento.
              */}
              <Pressable accessibilityRole="tab" accessibilityState={{ selected: !isRegistering }} onPress={() => switchMode('login')} style={styles.switchOption}>
                <Text style={[styles.switchText, { color: colors.muted }]}>Iniciar sesión</Text>
                <Animated.Text style={[styles.switchText, styles.switchTextActive, { color: colors.onAccent, opacity: loginLabelOpacity }]}>Iniciar sesión</Animated.Text>
              </Pressable>
              <Pressable accessibilityRole="tab" accessibilityState={{ selected: isRegistering }} onPress={() => switchMode('register')} style={styles.switchOption}>
                <Text style={[styles.switchText, { color: colors.muted }]}>Crear cuenta</Text>
                <Animated.Text style={[styles.switchText, styles.switchTextActive, { color: colors.onAccent2, opacity: indicator }]}>Crear cuenta</Animated.Text>
              </Pressable>
            </View>

            <Animated.View style={{ opacity: contentOpacity, transform: [{ translateX: contentX }] }}>
              <View style={styles.header}>
                <View style={[styles.headerIcon, { backgroundColor: colors.soft, borderColor: accent }]}>
                  <HeaderIcon color={accent} size={28} weight="duotone" />
                </View>
                <View style={styles.headerCopy}>
                  <Text style={[textStyles.label, { color: accent }]}>{isRegistering ? '// nueva cuenta' : '// acceso'}</Text>
                  <Text style={[styles.welcome, { color: colors.text }]}>{isRegistering ? 'Crea tu cuenta' : 'Te damos la bienvenida'}</Text>
                </View>
              </View>
              <Text style={[styles.description, { color: colors.muted }]}>
                {isRegistering
                  ? 'Es gratis y solo necesitas un correo electrónico.'
                  : 'Ingresa tus datos para continuar a tu espacio de aprendizaje.'}
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
                autoComplete={isRegistering ? 'new-password' : 'password'}
                editable={!submitting}
                onChangeText={(value) => { setPassword(value); setError(''); }}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={inputStyle}
                value={password}
              />
              {isRegistering ? (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Confirmar contraseña</Text>
                  <TextInput
                    accessibilityLabel="Confirmar contraseña"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!submitting}
                    onChangeText={(value) => { setConfirmPassword(value); setError(''); }}
                    placeholder="Escríbela otra vez"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    style={inputStyle}
                    value={confirmPassword}
                  />
                </>
              ) : null}

              {error ? <Text style={[styles.message, { color: colors.danger }]}>{error}</Text> : null}
              {notice ? <Text style={[styles.message, { color: colors.success }]}>{notice}</Text> : null}

              <AnimatedButton
                buttonColor={accent}
                disabled={submitting}
                label={submitting ? 'Procesando...' : isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
                onPress={submit}
                textColor={onAccent}
              />
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
                <Text style={[styles.googleButtonText, { color: colors.text }]}>{isRegistering ? 'Registrarme con Google' : 'Continuar con Google'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={submitting} onPress={() => switchMode(isRegistering ? 'login' : 'register')} style={styles.modeButton}>
                <Text style={[styles.modeButtonText, { color: colors.muted }]}>
                  {isRegistering ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? '}
                  <Text style={{ color: isRegistering ? colors.accent : colors.accent2, fontFamily: fonts.bodySemi }}>{isRegistering ? 'Inicia sesión' : 'Créala aquí'}</Text>
                </Text>
              </Pressable>
              <Text style={[styles.helper, { color: colors.muted }]}>Tu sesión se guarda de forma segura en este dispositivo.</Text>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 22 },
  guestButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, marginBottom: 14 },
  guestText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  logoTile: { width: 140, height: 140, borderRadius: 32, borderWidth: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logo: { width: 106, height: 108 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  intro: { fontFamily: fonts.body, marginTop: 8, marginBottom: 20, fontSize: 15, textAlign: 'center' },
  box: { width: '100%', maxWidth: 410, borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden' },
  switch: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, padding: 4, marginBottom: 20 },
  switchIndicator: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 10, overflow: 'hidden' },
  switchIndicatorFill: { ...StyleSheet.absoluteFill },
  switchOption: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  switchText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  switchTextActive: { position: 'absolute' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  headerIcon: { width: 50, height: 50, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  welcome: { fontFamily: fonts.display, fontSize: 23, lineHeight: 27, marginTop: 2 },
  description: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, marginBottom: 18 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, marginBottom: 6 },
  input: { height: 52, borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, marginBottom: 14, fontFamily: fonts.body, fontSize: 15 },
  message: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1 },
  googleButton: { minHeight: 52, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleButtonText: { fontFamily: fonts.bodySemi, fontSize: 15 },
  modeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, marginTop: 10 },
  modeButtonText: { fontFamily: fonts.body, fontSize: 14 },
  helper: { fontFamily: fonts.body, fontSize: 11, lineHeight: 17, marginTop: 4, textAlign: 'center' },
});
