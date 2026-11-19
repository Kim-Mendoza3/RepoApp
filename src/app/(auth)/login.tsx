import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useAnimatedValue, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedButton } from '@/components/animated-button';
import { logoSource } from '@/components/brand-logo';
import { GridBackground } from '@/components/grid-background';
import { ArrowLeftIcon, LockKeyIcon } from '@/components/icons';
import { ScienceBackground } from '@/components/science-background';
import { useAuth } from '@/context/auth-context';
import { useColors } from '@/context/theme-context';
import { supabase } from '@/lib/supabase';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

// ACCESO PARA ADMINISTRADORES
// La app se usa sin cuenta. Este inicio de sesión es solo para el equipo (1 a 3 personas) que
// sube y actualiza la información. Las cuentas se crean desde el panel de Supabase, no aquí.
// Al entrar no navegamos a mano: si la cuenta es de administrador, las rutas protegidas de
// _layout.tsx cierran esta pantalla; si no lo es, el AuthProvider cierra la sesión y avisamos.
export default function LoginScreen() {
  const colors = useColors();
  const { session, accessDenied, clearAccessDenied } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const logoScale = useAnimatedValue(1);
  // Ya entró, y se está revisando si la cuenta es de administrador.
  const checking = Boolean(session) && !accessDenied;

  // El logo "respira" suavemente.
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(logoScale, { toValue: 1.04, duration: 1400, useNativeDriver: true }),
      Animated.timing(logoScale, { toValue: 1, duration: 1400, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [logoScale]);

  const goBack = () => {
    clearAccessDenied();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    clearAccessDenied();
    if (!supabase) {
      setError('La conexión con el servidor no está configurada. Verifica las variables de Supabase.');
      return;
    }
    if (!normalizedEmail || !normalizedEmail.includes('@') || password.length < 6) {
      setError('Escribe tu correo y tu contraseña de administrador.');
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message.includes('Invalid login credentials')
        ? 'El correo o la contraseña no son correctos.'
        : result.error.message);
    }
  };

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.background }];
  const message = accessDenied
    ? 'Esta cuenta no es de administrador. Para usar la app no necesitas cuenta: regresa y explora libremente.'
    : error;

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GridBackground color={colors.grid} />
      <ScienceBackground color={colors.accent} opacity={0.25} />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, { backgroundColor: colors.surface, borderColor: colors.line }, pressed && pressedStyle]}
          >
            <ArrowLeftIcon color={colors.text} size={18} weight="bold" />
            <Text style={[styles.backText, { color: colors.text }]}>Volver a la app</Text>
          </Pressable>
          <Animated.View style={[styles.logoTile, { borderColor: colors.line, transform: [{ scale: logoScale }] }]}>
            <Image accessibilityLabel="Logo de deDivulgadores" contentFit="contain" source={logoSource} style={styles.logo} />
          </Animated.View>
          <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={[styles.chipDot, { backgroundColor: colors.accent }]} />
            <Text style={[textStyles.label, { color: colors.accent }]}>SOLO ADMINISTRADORES</Text>
          </View>
          <Text style={[styles.intro, { color: colors.muted }]}>Ciencia, creatividad y comunidad.</Text>

          <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.header}>
              <View style={[styles.headerIcon, { backgroundColor: colors.soft, borderColor: colors.accent }]}>
                <LockKeyIcon color={colors.accent} size={28} weight="duotone" />
              </View>
              <View style={styles.headerCopy}>
                <Text style={[textStyles.label, { color: colors.accent }]}>{'// acceso del equipo'}</Text>
                <Text style={[styles.welcome, { color: colors.text }]}>Acceso para administradores</Text>
              </View>
            </View>
            <Text style={[styles.description, { color: colors.muted }]}>
              Esta sección es solo para el equipo de deDivulgadores, para subir y actualizar la información de la app.
              Para usar la app no necesitas una cuenta.
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Correo electrónico</Text>
            <TextInput
              accessibilityLabel="Correo electrónico"
              autoCapitalize="none"
              autoComplete="email"
              editable={!submitting && !checking}
              keyboardType="email-address"
              onChangeText={(value) => { setEmail(value); setError(''); clearAccessDenied(); }}
              placeholder="correo@dedivulgadores.org"
              placeholderTextColor={colors.muted}
              style={inputStyle}
              value={email}
            />
            <Text style={[styles.label, { color: colors.text }]}>Contraseña</Text>
            <TextInput
              accessibilityLabel="Contraseña"
              autoCapitalize="none"
              autoComplete="password"
              editable={!submitting && !checking}
              onChangeText={(value) => { setPassword(value); setError(''); clearAccessDenied(); }}
              placeholder="Tu contraseña"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={inputStyle}
              value={password}
            />

            {message ? <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.danger }]}>{message}</Text> : null}

            <AnimatedButton
              buttonColor={colors.accent}
              disabled={submitting || checking}
              label={submitting || checking ? 'Verificando...' : 'Entrar'}
              onPress={submit}
              textColor={colors.onAccent}
            />
            <Text style={[styles.helper, { color: colors.muted }]}>
              ¿Olvidaste tu contraseña o necesitas una cuenta? Pídela a otra persona administradora del equipo.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 22 },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, marginBottom: 14 },
  backText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  logoTile: { width: 140, height: 140, borderRadius: 32, borderWidth: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logo: { width: 106, height: 108 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  intro: { fontFamily: fonts.body, marginTop: 8, marginBottom: 20, fontSize: 15, textAlign: 'center' },
  box: { width: '100%', maxWidth: 410, borderRadius: 22, borderWidth: 1, padding: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  headerIcon: { width: 50, height: 50, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  welcome: { fontFamily: fonts.display, fontSize: 23, lineHeight: 27, marginTop: 2 },
  description: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, marginBottom: 18 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, marginBottom: 6 },
  input: { height: 52, borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, marginBottom: 14, fontFamily: fonts.body, fontSize: 15 },
  message: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  helper: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, marginTop: 12, textAlign: 'center' },
});
