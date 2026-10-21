import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  Animated,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet as NativeStyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WorkshopCarousel } from '@/components/workshop-carousel';
import { useAppTheme } from '@/context/theme-context';
import { mixedWorkshopSlides, workshops } from '@/data/workshops';
import { authRedirectUrl, supabase } from '@/lib/supabase';

const StyleSheet = Object.assign(NativeStyleSheet, { absoluteFillObject: NativeStyleSheet.absoluteFill });

type Section = 'inicio' | 'adultos' | 'ninos' | 'admin';
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
const scienceIcons: IconName[] = ['microscope', 'telescope', 'chart-bubble', 'bug-outline', 'robot', 'dna', 'flask-outline', 'rocket-launch'];
const workshopAgendaWhatsApp = 'https://wa.me/529531753907?text=Hola%2C%20me%20gustaria%20solicitar%20informacion%20sobre%20visitas%20escolares%2C%20talleres%20o%20charlas%20itinerantes.';

const palette = {
  light: { background: '#F7FAFC', surface: '#FFFFFF', text: '#17202A', muted: '#718096', line: '#E2E8F0', blue: '#2463A5', blueSoft: '#E6F4FF', green: '#087F68', greenSoft: '#E7F8F1', orange: '#A85B00', orangeSoft: '#FFF4E5', purple: '#6941A5', purpleSoft: '#F2EAFE', danger: '#B42318' },
  dark: { background: '#171923', surface: '#2D3748', text: '#F7FAFC', muted: '#E2E8F0', line: '#718096', blue: '#9BD7FF', blueSoft: '#234A67', green: '#75E0C2', greenSoft: '#205344', orange: '#FFD08A', orangeSoft: '#684B24', purple: '#D0B4FF', purpleSoft: '#4A3470', danger: '#FF9B93' },
} as const;

// PANTALLA PRINCIPAL: carga, sesión y navegación entre secciones.
export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [section, setSection] = useState<Section>('inicio');
  const { mode: themeMode, setMode } = useAppTheme();
  const darkMode = themeMode === 'dark';
  const themeTransition = useRef(new Animated.Value(0)).current;
  const [themeCoverVisible, setThemeCoverVisible] = useState(false);
  const colors = darkMode ? palette.dark : palette.light;
  const [transitionColor, setTransitionColor] = useState(colors.background);

  const changeTheme = (value: boolean) => {
    setTransitionColor(colors.background);
    themeTransition.setValue(1);
    setThemeCoverVisible(true);
    requestAnimationFrame(() => {
      setMode(value ? 'dark' : 'light');
      Animated.timing(themeTransition, { toValue: 0, duration: 520, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setThemeCoverVisible(false);
      });
    });
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 2400);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        Alert.alert('No se pudo recuperar la sesión', error.message);
      }
      setLoggedIn(Boolean(data.session));
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setLoggedIn(Boolean(session));
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      {loading || authLoading ? <LoadingScreen /> : loggedIn ? (
        <AppShell
          colors={colors}
          darkMode={darkMode}
          section={section}
          setDarkMode={changeTheme}
          setLoggedIn={setLoggedIn}
          setSection={setSection}
        />
      ) : (
        <LoginScreen colors={colors} />
      )}
      {!loading && themeCoverVisible && <Animated.View pointerEvents="none" style={[styles.themeTransition, { backgroundColor: transitionColor, opacity: themeTransition }]} />}
    </View>
  );
}

// PANTALLA DE CARGA.
function LoadingScreen() {
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const dotsProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();
    const dotsAnimation = Animated.loop(Animated.timing(dotsProgress, { toValue: 3, duration: 1500, useNativeDriver: true }));
    dotsAnimation.start();
    const fadeTimer = setTimeout(() => Animated.timing(fade, { toValue: 0, duration: 350, useNativeDriver: true }).start(), 2050);
    return () => {
      dotsAnimation.stop();
      clearTimeout(fadeTimer);
    };
  }, [dotsProgress, fade, logoOpacity, logoScale]);

  const dotOneY = dotsProgress.interpolate({ inputRange: [0, 0.35, 0.7, 1.35, 2, 3], outputRange: [0, -8, 0, 0, 0, 0] });
  const dotTwoY = dotsProgress.interpolate({ inputRange: [0, 0.7, 1.05, 1.4, 2.35, 3], outputRange: [0, 0, -8, 0, 0, 0] });
  const dotThreeY = dotsProgress.interpolate({ inputRange: [0, 1.4, 1.75, 2.1, 2.7, 3], outputRange: [0, 0, -8, 0, 0, 0] });

  return <Animated.View style={[styles.loadingScreen, { opacity: fade }]}>
    <ScienceBackground />
    <Animated.View style={[styles.loadingLogo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}><Image contentFit="contain" source={require('@/assets/images/De-Divulgadores-logo100x102.png')} style={[styles.loadingLogoImage, styles.logoOutline]} /></Animated.View>
    <Text style={styles.loadingTagline}>Una asociacion que convierte preguntas en experiencias</Text>
    <View style={styles.loadingDots}><Animated.View style={[styles.loadingDot, { transform: [{ translateY: dotOneY }] }]} /><Animated.View style={[styles.loadingDot, { transform: [{ translateY: dotTwoY }] }]} /><Animated.View style={[styles.loadingDot, { transform: [{ translateY: dotThreeY }] }]} /></View>
  </Animated.View>;
}

// ELEMENTOS ANIMADOS DE LA PANTALLA DE CARGA.
function ScienceBackground({ opacity = 1 }: { opacity?: number }) {
  return <View pointerEvents="none" style={[styles.iconField, { opacity }]}>{scienceIcons.map((icon, index) => <FloatingScienceIcon key={`${icon}-${index}`} icon={icon} index={index} />)}</View>;
}

function FloatingScienceIcon({ icon, index }: { icon: string; index: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const positions = [styles.iconOne, styles.iconTwo, styles.iconThree, styles.iconFour, styles.iconFive, styles.iconSix, styles.iconSeven, styles.iconEight];
  useEffect(() => {
    const animation = Animated.loop(Animated.timing(progress, { toValue: 1, duration: 3600 + index * 280, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [index, progress]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [45, -90] });
  const opacity = progress.interpolate({ inputRange: [0, 0.18, 0.7, 1], outputRange: [0, 0.75, 0.5, 0] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '18deg'] });
  return <Animated.View style={[styles.floatingIcon, positions[index], { opacity, transform: [{ translateY }, { rotate }] }]}><MaterialCommunityIcons color="#A60E12" name={icon as never} size={34} /></Animated.View>;
}

type Colors = typeof palette.light | typeof palette.dark;

function AnimatedButton({ colors, label, onPress, buttonColor }: { colors: Colors; label: string; onPress: () => void; buttonColor?: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 24, bounciness: 5 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        style={[styles.primaryButton, { backgroundColor: buttonColor ?? colors.blue }]}
      >
        <Text style={styles.primaryButtonText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <Image contentFit="contain" source={require('@/assets/images/De-Divulgadores-logo100x102.png')} style={[styles.brandLogo, styles.logoOutline, compact && styles.brandLogoCompact]} />;
}

// PANTALLA DE INICIO DE SESION.
function LoginScreen({ colors }: { colors: Colors }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const logoScale = useRef(new Animated.Value(1)).current;
  const authColors = darkModeAuthColors(colors);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.04, duration: 1400, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ]),
    );
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
      ? await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: authRedirectUrl },
        })
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
      options: {
        redirectTo: authRedirectUrl,
        skipBrowserRedirect: true,
      },
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
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) setError(sessionError.message);
      }
    } else if (result.type !== 'cancel' && result.type !== 'dismiss') {
      setError('No se pudo completar el acceso con Google.');
    }
    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScienceBackground opacity={0.3} />
      <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.loginLogo, loginStyles.logo, { backgroundColor: colors.surface, borderColor: colors.line, transform: [{ scale: logoScale }] }]}>
          <BrandLogo />
        </Animated.View>
        <Text style={[loginStyles.kicker, { color: colors.blue }]}>ASOCIACION CIVIL</Text>
        <Text style={[styles.loginIntro, loginStyles.intro, { color: colors.muted }]}>Ciencia, creatividad y comunidad.</Text>
        <View style={[styles.loginBox, loginStyles.box, { backgroundColor: authColors.panel, borderColor: authColors.border }]}>
          <View style={[loginStyles.header, { backgroundColor: authColors.header }]}>
            <View style={[loginStyles.headerIcon, { backgroundColor: authColors.iconBackground }]}>
              <MaterialCommunityIcons color={authColors.accent} name={isRegistering ? 'account-plus-outline' : 'account-lock-outline'} size={23} />
            </View>
            <View style={loginStyles.headerCopy}>
              <Text style={[loginStyles.headerKicker, { color: authColors.accent }]}>CUENTA</Text>
              <Text style={[loginStyles.headerTitle, { color: colors.text }]}>{isRegistering ? 'Crear una cuenta' : 'Iniciar sesión'}</Text>
            </View>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bienvenido</Text>
          <Text style={[loginStyles.description, { color: colors.muted }]}>{isRegistering ? 'Crea una cuenta gratuita para continuar a tu espacio de aprendizaje.' : 'Ingresa tus datos para continuar a tu espacio de aprendizaje.'}</Text>
          <Text style={[styles.label, { color: authColors.label }]}>Correo electrónico</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            editable={!submitting}
            keyboardType="email-address"
            onChangeText={(value) => { setEmail(value); setError(''); }}
            placeholder="ejemplo@correo.com"
            placeholderTextColor={colors.muted}
            style={[styles.input, loginStyles.input, { color: colors.text, borderColor: authColors.border, backgroundColor: authColors.input }]}
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
            style={[styles.input, loginStyles.input, { color: colors.text, borderColor: authColors.border, backgroundColor: authColors.input }]}
            value={password}
          />
          {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
          <AnimatedButton buttonColor={authColors.accent} colors={colors} label={submitting ? 'Procesando...' : isRegistering ? 'Crear cuenta' : 'Iniciar sesión'} onPress={submit} />
          <View style={loginStyles.divider}>
            <View style={[loginStyles.dividerLine, { backgroundColor: authColors.border }]} />
            <Text style={[loginStyles.dividerText, { color: colors.muted }]}>O CONTINÚA CON</Text>
            <View style={[loginStyles.dividerLine, { backgroundColor: authColors.border }]} />
          </View>
          <Pressable disabled={submitting} onPress={signInWithGoogle} style={[loginStyles.googleButton, { borderColor: authColors.border, backgroundColor: authColors.input }]}>
            <MaterialCommunityIcons color={authColors.google} name="google" size={20} />
            <Text style={[loginStyles.googleButtonText, { color: colors.text }]}>Continuar con Google</Text>
          </Pressable>
          <Pressable disabled={submitting} onPress={() => { setIsRegistering(!isRegistering); setError(''); }} style={loginStyles.modeButton}>
            <Text style={[loginStyles.modeButtonText, { color: colors.blue }]}>{isRegistering ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}</Text>
          </Pressable>
          <Text style={[styles.helper, loginStyles.helper, { color: colors.muted }]}>Tu sesión se guarda de forma segura en este dispositivo.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function darkModeAuthColors(colors: Colors) {
  const dark = colors.background === palette.dark.background;
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

// CONTENEDOR DE LA APP: barra superior, contenido y navegación inferior.
function AppShell({ colors, darkMode, section, setDarkMode, setLoggedIn, setSection }: { colors: Colors; darkMode: boolean; section: Section; setDarkMode: (value: boolean) => void; setLoggedIn: (value: boolean) => void; setSection: (value: Section) => void }) {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [carouselGestureActive, setCarouselGestureActive] = useState(false);
  const menuScale = useRef(new Animated.Value(1)).current;
  const sectionNames: Record<Section, string> = { inicio: 'Inicio', adultos: 'Talleres', ninos: 'Niños', admin: 'Administración' };

  const toggleSettings = () => {
    if (settingsVisible) {
      setSettingsVisible(false);
      return;
    }
    menuScale.setValue(0.92);
    setSettingsVisible(true);
    Animated.spring(menuScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <BrandWatermark colors={colors} section={section} />
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={!carouselGestureActive}>
            <View style={[styles.toolbar, responsiveStyles.toolbarFrame, { backgroundColor: colors.surface, borderColor: `${colors.line}B8` }]}> 
          <Pressable onPress={toggleSettings} style={({ pressed }) => [styles.toolbarBrand, { gap: 18 }, pressed && pressedStyle]}>
            <View style={[styles.logoSmall, { width: 82, height: 82, backgroundColor: colors.surface, borderWidth: 0 }]}><BrandLogo compact /></View>
            <View><Text style={[styles.sectionLabel, { color: colors.blue }]}>{sectionNames[section]}</Text><Text style={[styles.toolbarTitle, { color: colors.text }]}>Divulgadores</Text></View>
          </Pressable>
          <Pressable onPress={toggleSettings} style={({ pressed }) => [styles.iconButton, { borderColor: colors.line, marginLeft: 18 }, pressed && pressedStyle]}><MaterialCommunityIcons color={colors.text} name={settingsVisible ? 'close' : 'menu'} size={23} /></Pressable>
        </View>
        {settingsVisible && <Animated.View style={{ transform: [{ scale: menuScale }] }}><SettingsPanel colors={colors} darkMode={darkMode} setDarkMode={setDarkMode} setLoggedIn={setLoggedIn} /></Animated.View>}
        {section === 'inicio' && <HomeContent colors={colors} setSection={setSection} onCarouselGesture={setCarouselGestureActive} />}
        {section === 'adultos' && <AdultsContent colors={colors} />}
        {section === 'ninos' && <KidsContent colors={colors} />}
        {section === 'admin' && <AdminContent colors={colors} />}
      </ScrollView>
      <BottomNav colors={colors} section={section} setSection={setSection} />
    </SafeAreaView>
  );
}

function BrandWatermark({ colors, section }: { colors: Colors; section: Section }) {
  const drift = useRef(new Animated.Value(0)).current;
  const sectionOpacity: Record<Section, number> = { inicio: 0.09, adultos: 0.11, ninos: 0.12, admin: 0.075 };
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 7000, useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration: 7000, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [drift]);
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const rotate = drift.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  return <Animated.View pointerEvents="none" style={[styles.watermark, { opacity: sectionOpacity[section], transform: [{ translateY }, { rotate }] }]}><Image contentFit="contain" source={require('@/assets/images/De-Divulgadores-logo100x102.png')} style={[styles.watermarkImage, styles.logoOutline, { tintColor: colors.blue }]} /></Animated.View>;
}

function SettingsPanel({ colors, darkMode, setDarkMode, setLoggedIn }: { colors: Colors; darkMode: boolean; setDarkMode: (value: boolean) => void; setLoggedIn: (value: boolean) => void }) {
  const signOut = async () => {
    if (!supabase) {
      setLoggedIn(false);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('No se pudo cerrar la sesión', error.message);
  };

  return <View style={[styles.settings, glassStyles.surface, { backgroundColor: `${colors.surface}D9`, borderColor: `${colors.line}B8` }]}>
    <Text style={[styles.settingsTitle, { color: colors.text }]}>Ajustes</Text>
    <View style={styles.settingRow}><View style={styles.settingLabel}><MaterialCommunityIcons color={colors.blue} name="theme-light-dark" size={20} /><Text style={[styles.body, { color: colors.text }]}>Modo oscuro</Text></View><Pressable accessibilityRole="switch" onPress={() => setDarkMode(!darkMode)} style={[styles.switch, { backgroundColor: darkMode ? colors.blue : colors.line }]}><View style={[styles.switchThumb, darkMode && styles.switchThumbActive]} /></Pressable></View>
    <Pressable onPress={signOut} style={styles.logoutRow}><MaterialCommunityIcons color={colors.danger} name="logout" size={19} /><Text style={[styles.logout, { color: colors.danger }]}>Cerrar sesión</Text></Pressable>
  </View>;
}

// PANTALLA INICIO: presentacion de la asociacion y experiencias destacadas.
function HomeContent({ colors, setSection, onCarouselGesture }: { colors: Colors; setSection: (value: Section) => void; onCarouselGesture: (locked: boolean) => void }) {
  return <>
    <View style={[styles.hero, glassStyles.surface, { backgroundColor: `${colors.surface}D9`, borderColor: `${colors.line}B8` }]}>
      <Text style={[styles.eyebrow, { color: colors.blue }]}>ASOCIACION DE DIVULGACION CIENTIFICA</Text>
      <Text style={[styles.heroTitle, { color: colors.text }]}>Somos deDivulgadores</Text>
      <Text style={[styles.body, { color: colors.muted }]}>Acercamos la ciencia, la tecnologia, el arte y la cultura a todas las personas mediante experiencias claras, participativas y llenas de curiosidad.</Text>
      <View style={styles.associationSignature}><MaterialCommunityIcons color={colors.blue} name="account-heart-outline" size={20} /><Text style={[styles.associationSignatureText, { color: colors.text }]}>Creamos espacios para preguntar, experimentar y aprender en comunidad.</Text></View>
    </View>
    <View style={[styles.associationIntro, glassStyles.surface, { backgroundColor: `${colors.blue}12`, borderColor: `${colors.blue}55` }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Así hacemos que la ciencia cobre vida</Text>
      <ProcessFlow colors={colors} />
    </View>
    <WorkshopCarousel colors={colors} slides={mixedWorkshopSlides} compact onHorizontalGesture={onCarouselGesture} onSelectWorkshop={(workshopId) => router.push({ pathname: '/workshop/[id]', params: { id: workshopId } })} />
    <View style={[styles.featuredWorkshop, glassStyles.surface, { backgroundColor: `${colors.blue}18`, borderColor: `${colors.blue}70` }]}>
      <View style={styles.featuredHeader}><View style={[styles.featuredIcon, { backgroundColor: `${colors.blue}2E` }]}><MaterialCommunityIcons color={colors.blue} name="calendar-star" size={27} /></View><View style={styles.featuredCopy}><Text style={[styles.eyebrow, { color: colors.blue }]}>PRÓXIMO TALLER</Text><Text style={[styles.featuredTitle, { color: colors.text }]}>Laboratorio de curiosidad</Text></View></View>
      <Text style={[styles.body, { color: colors.muted }]}>Una experiencia práctica para descubrir, experimentar y hacer preguntas.</Text>
      <View style={styles.workshopMeta}><Text style={[styles.metaText, { color: colors.text }]}><MaterialCommunityIcons color={colors.blue} name="calendar-outline" size={15} /> Fecha por confirmar</Text><Text style={[styles.metaText, { color: colors.text }]}><MaterialCommunityIcons color={colors.blue} name="account-group-outline" size={15} /> Familias y escuelas</Text></View>
      <AnimatedButton colors={colors} label="Ver taller" onPress={() => setSection('adultos')} />
    </View>
  </>;
}

function AnimatedScienceGuides({ colors }: { colors: Colors }) {
  const leftMotion = useRef(new Animated.Value(0)).current;
  const rightMotion = useRef(new Animated.Value(0)).current;
  const leftTalk = useRef(new Animated.Value(0)).current;
  const rightTalk = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLeft = Animated.loop(Animated.sequence([
      Animated.timing(leftMotion, { toValue: 1, duration: 1700, useNativeDriver: true }),
      Animated.timing(leftMotion, { toValue: 0, duration: 1700, useNativeDriver: true }),
    ]));
    const floatRight = Animated.loop(Animated.sequence([
      Animated.delay(350),
      Animated.timing(rightMotion, { toValue: 1, duration: 1900, useNativeDriver: true }),
      Animated.timing(rightMotion, { toValue: 0, duration: 1900, useNativeDriver: true }),
    ]));
    const talk = Animated.loop(Animated.sequence([
      Animated.timing(leftTalk, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(leftTalk, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(rightTalk, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(rightTalk, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.delay(1800),
    ]));
    floatLeft.start();
    floatRight.start();
    talk.start();
    return () => {
      floatLeft.stop();
      floatRight.stop();
      talk.stop();
    };
  }, [leftMotion, leftTalk, rightMotion, rightTalk]);

  const leftTranslate = leftMotion.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const rightTranslate = rightMotion.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const leftScale = leftTalk.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const rightScale = rightTalk.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return <View style={styles.guides} accessibilityLabel="Guías de divulgación animadas">
    <Animated.View style={[styles.guide, { transform: [{ translateY: leftTranslate }] }]}>
      <View style={[styles.guideAvatar, { backgroundColor: colors.greenSoft, borderColor: `${colors.green}70` }]}><MaterialCommunityIcons color={colors.green} name="face-woman-outline" size={38} /></View>
      <Animated.View style={[styles.guideBubble, { backgroundColor: colors.surface, borderColor: colors.line, transform: [{ scale: leftScale }] }]}><Text style={[styles.guideText, { color: colors.text }]}>¡Mira!</Text><View style={[styles.talkDots, { backgroundColor: colors.green }]} /></Animated.View>
    </Animated.View>
    <Animated.View style={[styles.guide, styles.guideRight, { transform: [{ translateY: rightTranslate }] }]}>
      <Animated.View style={[styles.guideBubble, { backgroundColor: colors.surface, borderColor: colors.line, transform: [{ scale: rightScale }] }]}><Text style={[styles.guideText, { color: colors.text }]}>¿Por qué?</Text><View style={[styles.talkDots, { backgroundColor: colors.orange }]} /></Animated.View>
      <View style={[styles.guideAvatar, { backgroundColor: colors.orangeSoft, borderColor: `${colors.orange}70` }]}><MaterialCommunityIcons color={colors.orange} name="face-man-outline" size={38} /></View>
    </Animated.View>
  </View>;
}

function AnimatedPillarIcon({ icon, color, backgroundColor, delay }: { icon: IconName; color: string; backgroundColor: string; delay: number }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(bounce, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 360, useNativeDriver: true }),
      Animated.delay(2200),
    ]));
    animation.start();
    return () => animation.stop();
  }, [bounce, delay]);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  return <Animated.View style={[styles.associationPillarIcon, { backgroundColor, transform: [{ translateY }] }]}><MaterialCommunityIcons color={color} name={icon} size={23} /></Animated.View>;
}

function ProcessFlow({ colors }: { colors: Colors }) {
  const steps: { icon: IconName; title: string; text: string; color: string; delay: number }[] = [
    { icon: 'eye-circle-outline', title: 'MIRAMOS', text: 'Observamos lo que nos rodea.', color: colors.green, delay: 0 },
    { icon: 'flask-outline', title: 'EXPERIMENTAMOS', text: 'Probamos ideas y hacemos preguntas.', color: colors.orange, delay: 240 },
    { icon: 'share-variant-outline', title: 'COMPARTIMOS', text: 'Convertimos hallazgos en nuevas ideas.', color: colors.purple, delay: 480 },
  ];

  return <View style={processStyles.processFlow} accessibilityLabel="Proceso de divulgación en tres pasos">
    {steps.map((step, index) => <View key={step.title} style={processStyles.processStepGroup}>
      <View style={[processStyles.processStep, { backgroundColor: `${step.color}16`, borderColor: `${step.color}65` }]}>
        <View style={[processStyles.processNumber, { backgroundColor: step.color }]}><Text style={processStyles.processNumberText}>{index + 1}</Text></View>
        <AnimatedPillarIcon icon={step.icon} color={step.color} backgroundColor={`${step.color}25`} delay={step.delay} />
        <View style={processStyles.processCopy}><Text style={[processStyles.processTitle, { color: colors.text }]}>{step.title}</Text><Text style={[processStyles.processText, { color: colors.muted }]}>{step.text}</Text></View>
      </View>
      {index < steps.length - 1 && <AnimatedProcessArrow color={step.color} delay={step.delay + 160} />}
    </View>)}
  </View>;
}

function AnimatedProcessArrow({ color, delay }: { color: string; delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.delay(1800),
    ]));
    animation.start();
    return () => animation.stop();
  }, [delay, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-2, 5] });
  const opacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.45, 1, 0.45] });
  return <Animated.View style={[processStyles.processArrow, { opacity, transform: [{ translateY }] }]}><MaterialCommunityIcons color={color} name="arrow-down-bold" size={21} /></Animated.View>;
}

function AudienceCard({ colors, icon, title, text, tint, iconColor, onPress }: { colors: Colors; icon: IconName; title: string; text: string; tint: string; iconColor: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.audienceCard, responsiveStyles.audienceCard, glassStyles.surface, { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.82 : 1 }]}><View style={[styles.audienceIcon, { backgroundColor: tint }]}><MaterialCommunityIcons color={iconColor} name={icon} size={25} /></View><Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.cardSubtitle, { color: colors.muted }]}>{text}</Text></Pressable>; }

async function openWorkshopAgendaWhatsApp() {
  try {
    const canOpen = await Linking.canOpenURL(workshopAgendaWhatsApp);
    if (!canOpen) {
      Alert.alert('WhatsApp no disponible', 'No se pudo abrir el contacto de agenda en este dispositivo.');
      return;
    }
    await Linking.openURL(workshopAgendaWhatsApp);
  } catch {
    Alert.alert('No se pudo abrir WhatsApp', 'Intenta nuevamente o contacta a la asociación por otro medio.');
  }
}

// PANTALLA TALLERES: informacion institucional y catalogo de talleres.
function AdultsContent({ colors }: { colors: Colors }) {
  return <View><Text style={[styles.eyebrow, { color: colors.blue }]}>INSTITUCIONAL</Text><Text style={[styles.pageTitle, { color: colors.text }]}>Divulgación científica transformadora</Text><View style={[purposeStyles.row, responsiveStyles.purposeRow]}><PurposeCard colors={colors} icon="target" title="Misión" accent={colors.blue} text="La divulgación, difusión y comunicación pública y privada de las ciencias, tecnología, humanidades, arte, historia y cultura en general, a través de diversos formatos de comunicación, a públicos especializados y no especializados, procurando la transición hacia una sociedad del conocimiento." /><PurposeCard colors={colors} icon="earth" title="Visión" accent={colors.purple} text="Proyectarse como un grupo consolidado en las actividades de divulgación, que sirva como referente para otros divulgadores y actores sociales; en el ámbito local y global." /></View><Text style={[styles.heading, { color: colors.text }]}>Talleres disponibles</Text><Text style={[styles.body, { color: colors.muted, marginBottom: 18 }]}>Explora cada experiencia para conocer sus actividades y fotografías.</Text><View style={[styles.workshopGrid, responsiveStyles.workshopGrid]}>{workshops.map((workshop) => <WorkshopTile key={workshop.id} colors={colors} workshop={workshop} />)}</View><InfoCard colors={colors} title="Capacitación" text="Formación para docentes y familias." /><Pressable accessibilityRole="button" accessibilityLabel="Contactar por WhatsApp al encargado de agenda" onPress={openWorkshopAgendaWhatsApp} style={({ pressed }) => [styles.whatsappButton, pressed && pressedStyle]}><MaterialCommunityIcons color="#FFFFFF" name="whatsapp" size={52} /><View style={styles.whatsappCopy}><Text style={styles.whatsappTitle}>Solicita una visita o taller</Text><Text style={styles.whatsappText}>Contacta al encargado de agenda por WhatsApp.</Text></View></Pressable></View>;
}

function WorkshopTile({ colors, workshop }: { colors: Colors; workshop: (typeof workshops)[number] }) {
  const hasCover = Boolean(workshop.cover || workshop.images.length > 0);
  const coverSource = workshop.cover ?? workshop.images[0];
  return <Pressable accessibilityLabel={`Abrir ${workshop.title}`} accessibilityRole="button" onPress={() => router.push({ pathname: '/workshop/[id]', params: { id: workshop.id } })} style={({ pressed }) => [styles.workshopTile, responsiveStyles.workshopTile, responsiveStyles.workshopTileSquare, { borderColor: `${workshop.accent}70`, opacity: pressed ? 0.82 : 1 }]}>{hasCover ? <Image contentFit="cover" source={coverSource} style={StyleSheet.absoluteFillObject} /> : <View style={[StyleSheet.absoluteFillObject, styles.workshopTileFallback, { backgroundColor: `${workshop.accent}24` }]}><MaterialCommunityIcons color={workshop.accent} name="image-plus-outline" size={42} /><Text style={[styles.workshopTilePending, { color: workshop.accent }]}>Portada pendiente</Text></View>}<View style={[styles.workshopTileShade, { backgroundColor: hasCover ? `${workshop.accent}B8` : `${workshop.accent}18` }]} /><View style={styles.workshopTileContent}><Text style={[styles.workshopTileEyebrow, !hasCover && { color: workshop.accent }]}>{workshop.eyebrow}</Text><Text style={[styles.workshopTileTitle, !hasCover && { color: colors.text }]}>{workshop.title}</Text><View style={styles.workshopTileAction}><Text style={[styles.workshopTileActionText, !hasCover && { color: workshop.accent }]}>Ver taller</Text><MaterialCommunityIcons color={hasCover ? '#FFFFFF' : workshop.accent} name="arrow-right" size={17} /></View></View></Pressable>;
}

// PANTALLA NINAS Y NINOS.
function KidsContent({ colors }: { colors: Colors }) {
  return <View><View style={[styles.kidsHero, { backgroundColor: colors.greenSoft }]}><Text style={[styles.eyebrow, { color: colors.green }]}>ZONA SEGURA</Text><Text style={[styles.pageTitle, { color: colors.text }]}>Aprender es jugar</Text><Pressable style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.blue, flexDirection: 'row', alignItems: 'center', gap: 8 }, pressed && pressedStyle]}><MaterialCommunityIcons color={colors.blue} name="play-circle-outline" size={20} /><Text style={[styles.secondaryButtonText, { color: colors.blue }]}>Comenzar aventura</Text></Pressable></View><Text style={[styles.heading, { color: colors.text }]}>Explora</Text><View style={styles.grid}><CategoryCard colors={colors} title="Ciencia" icon="microscope" subtitle="Descubre cómo funciona." tint={colors.blueSoft} iconColor={colors.blue} onPress={() => {}} /><CategoryCard colors={colors} title="Eco" icon="leaf-circle-outline" subtitle="Cuida tu planeta." tint={colors.greenSoft} iconColor={colors.green} onPress={() => {}} /><CategoryCard colors={colors} title="Espacio" icon="rocket-launch-outline" subtitle="Viaja más allá." tint={colors.purpleSoft} iconColor={colors.purple} onPress={() => {}} /><CategoryCard colors={colors} title="Retos" icon="gamepad-variant-outline" subtitle="Pon a prueba tus ideas." tint={colors.orangeSoft} iconColor={colors.orange} onPress={() => {}} /></View></View>;
}

// PANTALLA ADMINISTRACION.
function AdminContent({ colors }: { colors: Colors }) {
  return <View><Text style={[styles.pageTitle, { color: colors.text }]}>Panel de administración</Text><View style={styles.statsRow}><StatCard colors={colors} label="Talleres" value="14" /><StatCard colors={colors} label="Registros" value="86" /></View><InfoCard colors={colors} title="Resumen del mes" text="3 talleres activos, 2 por iniciar." /><AnimatedButton colors={colors} label="Registrar taller" onPress={() => {}} /></View>;
}

function CategoryCard({ colors, title, icon, subtitle, tint, iconColor, onPress }: { colors: Colors; title: string; icon: IconName; subtitle: string; tint: string; iconColor: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.categoryCard, glassStyles.surface, { backgroundColor: `${colors.surface}CC`, borderColor: `${colors.line}A8`, opacity: pressed ? 0.8 : 1 }]}><View style={[styles.categoryIcon, { backgroundColor: tint }]}><MaterialCommunityIcons color={iconColor} name={icon} size={27} /></View><Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.cardSubtitle, { color: colors.muted }]}>{subtitle}</Text></Pressable>;
}

function StatCard({ colors, label, value }: { colors: Colors; label: string; value: string }) { return <View style={[styles.statCard, glassStyles.surface, { backgroundColor: `${colors.surface}CC`, borderColor: `${colors.line}A8` }]}><Text style={[styles.cardSubtitle, { color: colors.muted }]}>{label}</Text><Text style={[styles.statValue, { color: colors.blue }]}>{value}</Text></View>; }

function InfoCard({ colors, title, text, badge }: { colors: Colors; title: string; text: string; badge?: boolean }) { return <View style={[styles.infoCard, glassStyles.surface, { backgroundColor: `${colors.surface}CC`, borderColor: `${colors.line}A8` }]}><Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.body, { color: colors.muted }]}>{text}</Text>{badge && <Text style={[styles.badge, { color: colors.green, backgroundColor: `${colors.greenSoft}D9` }]}>Inscripción abierta</Text>}</View>; }

const purposeStyles = NativeStyleSheet.create({
  stack: { gap: 16, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  columnItem: { flex: 1 },
  card: { borderRadius: 20, borderWidth: 1, padding: 14 },
  compactContent: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headingCopy: { flex: 1 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconEmphasis: { width: 38, height: 38, borderRadius: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  compactTitle: { fontSize: 16, fontWeight: '800' },
  summary: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  text: { fontSize: 15, lineHeight: 23 },
  accentLine: { height: 3, borderRadius: 2, marginBottom: 10 },
  tapHint: { fontSize: 12, fontWeight: '700' },
});

const glassStyles = NativeStyleSheet.create({
  surface: { shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
});

const purposeModalStyles = NativeStyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(15, 23, 42, 0.62)' },
  backdrop: { ...NativeStyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '78%', borderRadius: 30, borderWidth: 2, padding: 24, shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modalLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 3 },
  rule: { height: 3, borderRadius: 2, marginVertical: 20 },
  closeAction: { height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  closeActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

const purposeMotionStyles = NativeStyleSheet.create({
  field: { ...NativeStyleSheet.absoluteFill, overflow: 'hidden' },
  icon: { position: 'absolute' },
  one: { left: '38%', top: '26%' },
  two: { left: '8%', top: '22%' },
  three: { right: '8%', top: '17%' },
  four: { left: '12%', bottom: '19%' },
  five: { right: '13%', bottom: '25%' },
  six: { left: '22%', top: '72%' },
  seven: { right: '21%', top: '69%' },
  eight: { left: '73%', bottom: '10%' },
});

function PurposeCard({ colors, icon, title, accent, text }: { colors: Colors; icon: IconName; title: string; accent: string; text: string }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const cardScale = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0.82)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const open = () => {
    setVisible(true);
    setClosing(false);
    modalScale.setValue(0.82);
    modalOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 0.98, useNativeDriver: true, speed: 22, bounciness: 4 }),
      Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const close = () => {
    setClosing(true);
    Animated.parallel([
      Animated.timing(modalScale, { toValue: 0.82, duration: 180, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 4 }),
    ]).start(() => {
      setVisible(false);
      setClosing(false);
    });
  };

  return <>
    <Animated.View style={[purposeStyles.columnItem, responsiveStyles.purposeItem, { transform: [{ scale: cardScale }] }]}><Pressable onPress={open} style={({ pressed }) => [purposeStyles.card, glassStyles.surface, { backgroundColor: `${accent}18`, borderColor: `${accent}A8`, shadowColor: accent, shadowOpacity: 0.2, opacity: pressed ? 0.82 : 1 }, pressed && pressedStyle]}><View style={purposeStyles.compactContent}><View style={[purposeStyles.icon, purposeStyles.iconEmphasis, { backgroundColor: `${accent}35` }]}><MaterialCommunityIcons color={accent} name={icon} size={21} /></View><Text style={[purposeStyles.compactTitle, { color: colors.text }]}>{title}</Text></View><View style={[purposeStyles.accentLine, { backgroundColor: accent }]} /></Pressable></Animated.View>
    <Modal transparent visible={visible} onRequestClose={close} animationType="none">
      <View style={purposeModalStyles.overlay}><Animated.View style={[purposeModalStyles.backdrop, { opacity: modalOpacity }]}><PurposeMotion accent={accent} /></Animated.View><Animated.View style={[purposeModalStyles.sheet, { backgroundColor: colors.surface, borderColor: accent, opacity: modalOpacity, transform: [{ scale: modalScale }] }]}><View style={purposeModalStyles.sheetHeader}><View style={[purposeModalStyles.modalIcon, { backgroundColor: `${accent}22` }]}><MaterialCommunityIcons color={accent} name={icon} size={25} /></View><View style={purposeStyles.headingCopy}><Text style={[purposeStyles.title, { color: colors.text }]}>{title}</Text><Text style={[purposeModalStyles.modalLabel, { color: accent }]}>PROPÓSITO INSTITUCIONAL</Text></View></View><View style={[purposeModalStyles.rule, { backgroundColor: accent }]} /><ScrollView showsVerticalScrollIndicator={false}><Text style={[purposeStyles.text, { color: colors.text }]}>{text}</Text></ScrollView><Pressable onPress={close} style={[purposeModalStyles.closeAction, { backgroundColor: accent }]}><Text style={purposeModalStyles.closeActionText}>{closing ? 'Guardando' : 'Cerrar'}</Text></Pressable></Animated.View></View>
    </Modal>
  </>;
}

function PurposeMotion({ accent }: { accent: string }) {
  const icons: { name: IconName; style: object; delay: number; size: number }[] = [
    { name: 'atom', style: purposeMotionStyles.one, delay: 0, size: 128 },
    { name: 'microscope', style: purposeMotionStyles.two, delay: 420, size: 42 },
    { name: 'telescope', style: purposeMotionStyles.three, delay: 760, size: 38 },
    { name: 'flask-outline', style: purposeMotionStyles.four, delay: 980, size: 34 },
    { name: 'dna', style: purposeMotionStyles.five, delay: 260, size: 40 },
    { name: 'chart-bubble', style: purposeMotionStyles.six, delay: 640, size: 36 },
    { name: 'robot', style: purposeMotionStyles.seven, delay: 860, size: 35 },
    { name: 'rocket-launch-outline', style: purposeMotionStyles.eight, delay: 1120, size: 34 },
  ];
  return <View pointerEvents="none" style={purposeMotionStyles.field}>{icons.map((item) => <PurposeMotionIcon key={item.name} accent={accent} {...item} />)}</View>;
}

function PurposeMotionIcon({ accent, name, style, delay, size }: { accent: string; name: IconName; style: object; delay: number; size: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => Animated.loop(Animated.sequence([Animated.timing(progress, { toValue: 1, duration: 3000 + delay, useNativeDriver: true }), Animated.timing(progress, { toValue: 0, duration: 3000 + delay, useNativeDriver: true })])).start(), delay);
    return () => clearTimeout(timer);
  }, [delay, progress]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [22, -22] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });
  const opacity = progress.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0.08, 0.2, 0.16, 0.08] });
  return <Animated.View style={[purposeMotionStyles.icon, style, { opacity, transform: [{ translateY }, { rotate }] }]}><MaterialCommunityIcons color={accent} name={name as never} size={size} /></Animated.View>;
}

// NAVEGACION INFERIOR.
function BottomNav({ colors, section, setSection }: { colors: Colors; section: Section; setSection: (value: Section) => void }) {
  const items: { key: Section; label: string; icon: IconName }[] = [{ key: 'inicio', label: 'Inicio', icon: 'home-variant-outline' }, { key: 'adultos', label: 'Talleres', icon: 'school-outline' }, { key: 'ninos', label: 'Niños', icon: 'flask-outline' }, { key: 'admin', label: 'Admin', icon: 'view-dashboard-outline' }];
  return <View style={[styles.bottomNav, { backgroundColor: colors.surface, borderColor: colors.line }]}>{items.map((item) => <Pressable key={item.key} onPress={() => setSection(item.key)} style={styles.navItem}><MaterialCommunityIcons color={section === item.key ? colors.blue : colors.muted} name={item.icon} size={22} /><Text style={[styles.navLabel, { color: section === item.key ? colors.blue : colors.muted }]}>{item.label}</Text></Pressable>)}</View>;
}

const pressedStyle = { opacity: 0.7, transform: [{ scale: 0.97 }] } as const;

const loginStyles = NativeStyleSheet.create({
  logo: { width: 156, height: 156, borderRadius: 34, shadowColor: '#A60E12', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.8, marginTop: 2 },
  intro: { marginTop: 7, marginBottom: 24, fontSize: 15, textAlign: 'center' },
  box: { padding: 25, shadowColor: '#17202A', shadowOpacity: 0.08, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 17, padding: 13, marginBottom: 22 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  headerTitle: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 22 },
  input: { height: 52, borderRadius: 13, paddingHorizontal: 15, marginBottom: 17 },
  button: { borderRadius: 13, minHeight: 52, marginTop: 3 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  googleButton: { minHeight: 52, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleButtonText: { fontSize: 15, fontWeight: '800' },
  modeButton: { alignItems: 'center', marginTop: 18 },
  modeButtonText: { fontSize: 13, fontWeight: '800' },
  helper: { fontSize: 11, lineHeight: 17, marginTop: 15 },
});

const responsiveStyles = NativeStyleSheet.create({
  toolbarFrame: { borderRadius: 28, borderWidth: 1, padding: 16 },
  audienceRow: { flexWrap: 'wrap' },
  audienceCard: { flexBasis: 220 },
  purposeRow: { flexWrap: 'wrap' },
  purposeItem: { minWidth: 240 },
  workshopGrid: { gap: 14 },
  workshopTile: { width: '47%' },
  workshopTileSquare: { aspectRatio: 1, minHeight: 0 },
});

const processStyles = NativeStyleSheet.create({
  processFlow: { alignItems: 'stretch', marginTop: 4 },
  processStepGroup: { width: '100%', alignItems: 'stretch' },
  processStep: { minHeight: 88, borderRadius: 18, borderWidth: 1, padding: 10, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
  processNumber: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  processNumberText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  processCopy: { flex: 1, paddingRight: 16 },
  processTitle: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  processText: { fontSize: 12, lineHeight: 16, marginTop: 3 },
  processArrow: { height: 22, alignItems: 'center', justifyContent: 'center' },
});

const styles = StyleSheet.create({
  featuredWorkshop: { borderRadius: 25, borderWidth: 1, padding: 22, marginBottom: 28 }, featuredHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }, featuredIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, featuredCopy: { flex: 1 }, featuredTitle: { fontSize: 21, fontWeight: '800', marginTop: -5 }, workshopMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18, marginBottom: 18 }, metaText: { fontSize: 12, fontWeight: '700' }, audienceRow: { flexDirection: 'row', gap: 12, marginBottom: 20 }, audienceCard: { flex: 1, minHeight: 150, borderRadius: 21, borderWidth: 1, padding: 17, justifyContent: 'center' }, audienceIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, contentHighlight: { borderRadius: 21, borderWidth: 1, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 20 }, highlightIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, highlightCopy: { flex: 1 }, agendaCta: { borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }, ctaCopy: { flex: 1 }, ctaTitle: { fontSize: 15, fontWeight: '800', lineHeight: 20 }, ctaText: { fontSize: 12, lineHeight: 17, marginTop: 3 }, associationSignature: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 18 }, associationSignatureText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '800' }, associationIntro: { borderRadius: 22, borderWidth: 1, padding: 20, marginBottom: 28 }, guides: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 20 }, guide: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }, guideRight: { justifyContent: 'flex-end' }, guideAvatar: { width: 58, height: 58, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, guideBubble: { flex: 1, minHeight: 43, borderRadius: 15, borderWidth: 1, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, guideText: { fontSize: 13, fontWeight: '900' }, talkDots: { width: 7, height: 7, borderRadius: 4 }, associationPillars: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }, associationPillar: { flex: 1, minWidth: 180 }, associationPillarIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  themeTransition: { ...StyleSheet.absoluteFill, zIndex: 20 },
  watermark: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' }, watermarkImage: { width: 310, height: 310 }, sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  brandLogo: { width: 112, height: 114 }, brandLogoCompact: { width: 76, height: 77 }, logoOutline: { shadowColor: '#FFFFFF', shadowOpacity: 1, shadowRadius: 2.5, shadowOffset: { width: 0, height: 0 }, elevation: 4 }, settingLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 }, logoutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingScreen: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFF9F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, iconField: { ...StyleSheet.absoluteFillObject }, floatingIcon: { position: 'absolute', fontSize: 34 }, iconOne: { left: '10%', top: '24%' }, iconTwo: { left: '72%', top: '19%' }, iconThree: { left: '22%', top: '68%' }, iconFour: { left: '78%', top: '67%' }, iconFive: { left: '8%', top: '48%' }, iconSix: { left: '60%', top: '76%' }, iconSeven: { left: '42%', top: '13%' }, iconEight: { left: '45%', top: '84%' }, loadingLogo: { alignItems: 'center', justifyContent: 'center' }, loadingLogoImage: { width: 220, height: 224 }, loadingLogoMark: { color: '#A60E12', fontSize: 92, lineHeight: 86, fontWeight: '900', letterSpacing: -12 }, loadingLogoName: { color: '#A60E12', fontSize: 26, fontWeight: '500', letterSpacing: 1 }, loadingTagline: { color: '#7D4B4A', fontSize: 13, marginTop: 20, letterSpacing: 0.4 }, loadingDots: { flexDirection: 'row', marginTop: 32, gap: 7 }, loadingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A60E12' }, loadingDotMiddle: { opacity: 0.45 },
  root: { flex: 1 }, flex: { flex: 1 }, content: { padding: 24, paddingBottom: 120, maxWidth: 800, width: '100%', alignSelf: 'center' }, toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }, toolbarBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 }, logoSmall: { width: 48, height: 48, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, toolbarTitle: { fontSize: 22, fontWeight: '900' }, iconButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, loginScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }, loginLogo: { width: 130, height: 130, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, logoEmoji: { fontSize: 58 }, brand: { fontSize: 30, fontWeight: '900' }, loginIntro: { marginTop: 8, marginBottom: 28, fontSize: 16 }, loginBox: { width: '100%', maxWidth: 410, borderRadius: 24, borderWidth: 1, padding: 24 }, sectionTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20 }, label: { fontSize: 13, fontWeight: '700', marginBottom: 6 }, input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, fontSize: 15 }, error: { color: '#E53E3E', fontSize: 13, marginBottom: 14 }, primaryButton: { borderRadius: 12, minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 4 }, primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 }, helper: { fontSize: 11, textAlign: 'center', marginTop: 14 }, hero: { borderRadius: 28, borderWidth: 1, padding: 24, marginBottom: 28 }, eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 }, heroTitle: { fontSize: 28, lineHeight: 32, fontWeight: '900', marginBottom: 12 }, pageTitle: { fontSize: 30, lineHeight: 34, fontWeight: '900', marginBottom: 24 }, heading: { fontSize: 21, fontWeight: '800', marginBottom: 16 }, body: { fontSize: 15, lineHeight: 22 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }, workshopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 }, workshopTile: { width: '48%', minHeight: 214, borderRadius: 20, borderWidth: 1, overflow: 'hidden', backgroundColor: '#CBD5E1' }, workshopTileShade: { ...StyleSheet.absoluteFillObject }, workshopTileFallback: { alignItems: 'center', justifyContent: 'center', gap: 8 }, workshopTilePending: { fontSize: 11, fontWeight: '800' }, workshopTileContent: { flex: 1, justifyContent: 'flex-end', padding: 16 }, workshopTileEyebrow: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 6 }, workshopTileTitle: { color: '#FFFFFF', fontSize: 20, lineHeight: 23, fontWeight: '900' }, workshopTileAction: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 13 }, workshopTileActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, categoryCard: { width: '47%', minHeight: 160, borderRadius: 22, borderWidth: 1, padding: 18, justifyContent: 'center' }, categoryIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, categoryEmoji: { fontSize: 25 }, cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 }, cardSubtitle: { fontSize: 12, lineHeight: 18 }, statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 }, statCard: { flex: 1, borderRadius: 20, borderWidth: 1, padding: 18, alignItems: 'center' },     statValue: { fontSize: 32, fontWeight: '900', marginTop: 4 }, infoCard: { borderRadius: 22, borderWidth: 1, padding: 22, marginBottom: 16 }, whatsappButton: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 20, backgroundColor: '#25D366', shadowColor: '#128C7E', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 }, whatsappCopy: { alignItems: 'center', marginTop: 12 }, whatsappTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center' }, whatsappText: { color: '#F0FFF4', fontSize: 12, lineHeight: 17, marginTop: 4, textAlign: 'center' }, badge: { alignSelf: 'flex-start', color: '#168A70', backgroundColor: '#D8F5EA', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginTop: 12, fontSize: 12, fontWeight: '700' }, kidsHero: { borderRadius: 28, padding: 24, marginBottom: 28 }, secondaryButton: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: 20 }, secondaryButtonText: { fontWeight: '800' }, settings: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 22 }, settingsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 }, settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, switch: { width: 48, height: 28, borderRadius: 20, padding: 3 }, switchThumb: { width: 22, height: 22, borderRadius: 12, backgroundColor: '#FFFFFF' }, switchThumbActive: { alignSelf: 'flex-end' }, logout: { color: '#E53E3E', fontWeight: '800' }, bottomNav: { position: 'absolute', bottom: 18, left: 20, right: 20, height: 72, borderRadius: 24, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', elevation: 5 }, navItem: { alignItems: 'center', gap: 2, minWidth: 58 }, navLabel: { fontSize: 11, fontWeight: '700' },
});
