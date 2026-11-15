import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { demoAccount } from '@/api/config';
import { login, loginWithGoogle } from '@/api/endpoints';
import { resolveErrorMessage } from '@/api/errorMessage';
import { ApiError } from '@/api/errors';
import { Button } from '@/components/ui/Button';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { Notice } from '@/components/ui/Notice';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { siteBase } from '@/demo/appFrame';
import { clearDemoKeys } from '@/demo/webStorage';
import { colors, fontFamilies, layout, radii, shadows, spacing, strokes, typography } from '@/design/tokens';
import { useSession } from '@/session/SessionProvider';

import { SplitFlapLogo } from './components/SplitFlapLogo';
import { requestGoogleIdToken } from './googleSignIn';

const logo = require('../../../assets/images/brand/pulse-wordmark.png');
// 시연 사이트: 앱을 켤 때 맥박 스플래시(app/index.tsx)가 먼저 나오므로 로고 인트로는 다시 틀지 않는다.
let hasPlayedIntroThisLaunch = true;

type FieldErrors = { email?: string; password?: string };

const loginErrorCopy: Record<string, string> = {
  INVALID_CREDENTIALS: '이메일 또는 비밀번호를 다시 확인해 주세요.',
  ACCOUNT_NOT_ACTIVE: '이 계정은 지금 사용할 수 없어요. 관리자에게 문의해 주세요.',
  INVALID_INPUT: '입력한 내용을 다시 확인해 주세요.',
  INVALID_REQUEST: '입력한 내용을 다시 확인해 주세요.',
};

// SCREEN_STATES §2.1의 Google 로그인 코드. 서버 문구는 MVP에 없는 계정 연결을 안내하므로 쓰지 않는다.
const googleErrorCopy: Record<string, string> = {
  INVALID_GOOGLE_ID_TOKEN: 'Google 계정을 확인하지 못했어요. 다시 시도해 주세요.',
  GOOGLE_AUTH_NOT_CONFIGURED: 'Google 로그인이 아직 준비되지 않았어요. 이메일로 로그인해 주세요.',
  ACCOUNT_LINK_REQUIRED: '이미 이메일로 가입한 계정이 있어요. 이메일과 비밀번호로 로그인해 주세요.',
  ACCOUNT_NOT_ACTIVE: loginErrorCopy.ACCOUNT_NOT_ACTIVE,
};

// 테스트 계정 버튼은 아무것도 입력하지 않으므로 "입력한 내용을 확인하라"는 안내를 쓰지 않는다.
// 서버는 계정이 없는 경우와 비밀번호가 틀린 경우를 구분하지 않으므로 원인을 단정하지 않는다
// (서버 DB에 시연 계정이 없거나, 다른 값으로 빌드한 경우).
const demoErrorCopy: Record<string, string> = {
  INVALID_CREDENTIALS: '이 서버에서 테스트 계정으로 로그인하지 못했어요. 시연 계정과 빌드 값을 확인해 주세요.',
  ACCOUNT_NOT_ACTIVE: '테스트 계정을 지금 사용할 수 없어요. 시연 계정을 확인해 주세요.',
};

const googleOutcomeCopy = {
  notConfigured: googleErrorCopy.GOOGLE_AUTH_NOT_CONFIGURED,
  unsupported: '이 앱에서는 Google 로그인을 쓸 수 없어요. 이메일로 로그인해 주세요.',
  playServicesUnavailable: 'Google Play 서비스를 쓸 수 없어요. 업데이트한 뒤 다시 시도해 주세요.',
  failed: 'Google로 로그인하지 못했어요. 잠시 뒤에 다시 시도해 주세요.',
} as const;

export function LoginScreen() {
  const router = useRouter();
  const { signIn, client, expired } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [googleCancelled, setGoogleCancelled] = useState(false);
  const [demoPending, setDemoPending] = useState(false);
  const busy = submitting || googlePending || demoPending;
  const [shouldPlayIntro] = useState(() => {
    const shouldPlay = !hasPlayedIntroThisLaunch;
    hasPlayedIntroThisLaunch = true;
    return shouldPlay;
  });
  const [introVisible, setIntroVisible] = useState(shouldPlayIntro);
  const [contentProgress] = useState(() => new Animated.Value(shouldPlayIntro ? 0 : 1));

  const completeIntro = useCallback(
    (reduceMotion: boolean) => {
      setIntroVisible(false);
      if (reduceMotion) {
        contentProgress.setValue(1);
        return;
      }
      Animated.timing(contentProgress, {
        duration: 360,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }).start();
    },
    [contentProgress],
  );

  const validate = () => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = '이메일을 입력해 주세요.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = '이메일 형식을 확인해 주세요.';
    if (!password) next.password = '비밀번호를 입력해 주세요.';
    else if (password.length < 8) next.password = '비밀번호는 8자 이상이에요.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const applyError = (error: unknown) => {
    if (error instanceof ApiError && error.fieldErrors.length > 0) {
      const next: FieldErrors = {};
      for (const item of error.fieldErrors) {
        if (item.field === 'email') next.email = item.message;
        else if (item.field === 'password') next.password = item.message;
      }
      setFieldErrors(next);
      if (!next.email && !next.password) setFormError(error.message);
      return;
    }
    setFormError(
      resolveErrorMessage(error, {
        known: loginErrorCopy,
        fallback: '로그인하지 못했어요. 잠시 뒤에 다시 시도해 주세요.',
      }),
    );
  };

  const submit = async () => {
    if (busy) return;
    setFormError(null);
    setGoogleCancelled(false);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const session = await login(client, email.trim(), password);
      await signIn(session);
    } catch (error) {
      applyError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDemo = async () => {
    if (!demoAccount || busy) return;
    setFormError(null);
    setGoogleCancelled(false);
    setFieldErrors({});

    setDemoPending(true);
    try {
      const session = await login(client, demoAccount.email, demoAccount.password);
      await signIn(session);
    } catch (error) {
      setFormError(
        resolveErrorMessage(error, {
          known: demoErrorCopy,
          fallback: '테스트 계정으로 들어가지 못했어요. 잠시 뒤에 다시 시도해 주세요.',
        }),
      );
    } finally {
      setDemoPending(false);
    }
  };

  const submitGoogle = async () => {
    if (busy) return;
    setFormError(null);
    setGoogleCancelled(false);
    setFieldErrors({});

    setGooglePending(true);
    try {
      const outcome = await requestGoogleIdToken();
      if (outcome.type === 'cancelled') {
        setGoogleCancelled(true);
        return;
      }
      if (outcome.type !== 'success') {
        setFormError(googleOutcomeCopy[outcome.type]);
        return;
      }
      const session = await loginWithGoogle(client, outcome.idToken);
      await signIn(session);
    } catch (error) {
      setFormError(
        resolveErrorMessage(error, {
          known: googleErrorCopy,
          fallback: 'Google로 로그인하지 못했어요. 잠시 뒤에 다시 시도해 주세요.',
        }),
      );
    } finally {
      setGooglePending(false);
    }
  };

  if (introVisible) {
    return (
      <View style={styles.intro}>
        <StatusBar style="dark" />
        <SplitFlapLogo logo={logo} onComplete={completeIntro} />
      </View>
    );
  }

  return (
    <Screen centered verticalEdges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <Animated.View
        style={[
          styles.loginContent,
          {
            opacity: contentProgress,
            transform: [
              {
                translateY: contentProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.brandArea}>
          <Image accessibilityLabel="PULSE" resizeMode="contain" source={logo} style={styles.loginLogo} />
          <Text accessibilityRole="header" style={styles.headline}>
            리뷰에서 우리 가게{'\n'}손님을 찾아요
          </Text>
          <Text style={styles.subline}>공개 리뷰를 읽고 자주 오는 손님과 검토해 볼 행동을 정리해요.</Text>
        </View>

        {expired ? (
          <Notice
            alert
            title="로그인이 만료됐어요"
            message="보안을 위해 일정 시간이 지나면 다시 로그인해야 해요."
            tone="warning"
          />
        ) : null}

        {formError ? <Notice alert title="로그인하지 못했어요" message={formError} tone="error" /> : null}

        {googleCancelled ? (
          <Notice
            title="Google 로그인을 취소했어요"
            message="다시 시도하거나 이메일로 로그인할 수 있어요."
            tone="info"
          />
        ) : null}

        {/* 시연 사이트에서는 테스트 계정이 가장 먼저 쓰는 길이다. 그래서 맨 위 큰 버튼으로 둔다. */}
        {demoAccount ? (
          <View style={styles.demoGroup}>
            <Button
              disabled={submitting || googlePending}
              label="테스트 계정으로 바로 시작하기"
              loading={demoPending}
              loadingLabel="테스트 계정으로 들어가는 중이에요"
              onPress={() => void submitDemo()}
            />
            <Text style={styles.demoHint}>가입 없이 시연용 예시 데이터로 모든 화면을 써 볼 수 있어요.</Text>
          </View>
        ) : null}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는 이메일로</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.formCard}>
          <TextField
            autoCapitalize="none"
            autoComplete="email"
            error={fieldErrors.email}
            inputMode="email"
            label="이메일"
            onChangeText={(value) => {
              setEmail(value);
              setFieldErrors((current) => ({ ...current, email: undefined }));
            }}
            placeholder="이메일 주소"
            returnKeyType="next"
            value={email}
          />
          <TextField
            autoCapitalize="none"
            autoComplete="current-password"
            error={fieldErrors.password}
            label="비밀번호"
            onChangeText={(value) => {
              setPassword(value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
            }}
            onSubmitEditing={() => void submit()}
            placeholder="8자 이상"
            returnKeyType="done"
            secureTextEntry
            value={password}
          />
          <Button
            disabled={googlePending || demoPending}
            label="로그인"
            loading={submitting}
            loadingLabel="로그인하는 중이에요"
            onPress={() => void submit()}
            variant="ghost"
          />
        </View>

        <View style={styles.secondaryActions}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => router.push('/signup')}
            style={({ pressed }) => [styles.textAction, pressed && !busy && styles.textActionPressed]}
          >
            <Text style={[styles.textActionLabel, busy && styles.textActionDisabled]}>이메일로 회원가입</Text>
          </Pressable>
          <View style={styles.actionDot} />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: googlePending, disabled: busy }}
            disabled={busy}
            onPress={() => void submitGoogle()}
            style={({ pressed }) => [styles.textAction, pressed && !busy && styles.textActionPressed]}
          >
            <View style={styles.textActionInner}>
              {googlePending ? (
                <ActivityIndicator color={colors.text.brand} size="small" />
              ) : (
                <GoogleIcon color={colors.text.brand} />
              )}
              <Text style={[styles.textActionLabel, busy && !googlePending && styles.textActionDisabled]}>
                {googlePending ? 'Google 계정을 확인하는 중이에요' : 'Google로 계속하기'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* 시연 데이터(가입한 계정·분석 결과)를 브라우저에서 지우고 처음 상태로 돌린다. 시연 사이트 전용. */}
        <Pressable
          accessibilityHint="이 브라우저에 남은 시연 데이터를 지우고 처음부터 다시 시작해요"
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            if (!window.confirm('이 브라우저에 남은 시연 데이터를 지우고 처음부터 다시 시작할까요?')) return;
            clearDemoKeys();
            window.location.href = `${siteBase}/`;
          }}
          style={({ pressed }) => [styles.textAction, styles.resetAction, pressed && !busy && styles.textActionPressed]}
        >
          <Text style={styles.resetLabel}>시연 데이터 처음부터</Text>
        </Pressable>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  loginContent: {
    gap: spacing[5],
    width: '100%',
  },
  brandArea: {
    alignItems: 'center',
    gap: spacing[3],
    paddingTop: spacing[6],
    paddingBottom: spacing[2],
  },
  loginLogo: {
    height: spacing[12],
    width: spacing[12] * (1740 / 673),
  },
  headline: {
    ...typography.head3,
    fontFamily: fontFamilies.bold,
    color: colors.text.strong,
    textAlign: 'center',
  },
  subline: {
    ...typography.body7,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  demoGroup: {
    gap: spacing[2],
  },
  demoHint: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  dividerLine: {
    flex: 1,
    height: strokes.hairline,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  formCard: {
    ...shadows.soft,
    backgroundColor: colors.background.surface,
    borderRadius: radii.panel,
    gap: spacing[4],
    padding: spacing[5],
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing[2],
  },
  textAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.touchTargetMin,
    paddingHorizontal: spacing[2],
  },
  // 공용 Button과 같은 눌림 표현(Button.tsx pressed).
  textActionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  textActionInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  textActionLabel: {
    ...typography.body6,
    color: colors.text.brand,
  },
  textActionDisabled: {
    color: colors.text.disabled,
  },
  resetAction: {
    alignSelf: 'center',
  },
  resetLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
  actionDot: {
    width: spacing[1],
    height: spacing[1],
    borderRadius: radii.pill,
    backgroundColor: colors.border.strong,
  },
});
