import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

import { login } from '@/api/endpoints';
import { resolveErrorMessage } from '@/api/errorMessage';
import { ApiError } from '@/api/errors';
import { Button } from '@/components/ui/Button';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { Notice } from '@/components/ui/Notice';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { colors, radii, shadows, spacing, strokes } from '@/design/tokens';
import { useSession } from '@/session/SessionProvider';

import { SplitFlapLogo } from './components/SplitFlapLogo';

const logo = require('../../../assets/images/brand/pulse-wordmark.png');
let hasPlayedIntroThisLaunch = false;

type FieldErrors = { email?: string; password?: string };

const loginErrorCopy: Record<string, string> = {
  INVALID_CREDENTIALS: '이메일 또는 비밀번호를 다시 확인해 주세요.',
  ACCOUNT_NOT_ACTIVE: '이 계정은 지금 사용할 수 없어요. 관리자에게 문의해 주세요.',
  INVALID_INPUT: '입력한 내용을 다시 확인해 주세요.',
  INVALID_REQUEST: '입력한 내용을 다시 확인해 주세요.',
};

export function LoginScreen() {
  const router = useRouter();
  const { signIn, client, expired } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
    setFormError(null);
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
        </View>

        <View style={styles.actions}>
          <Button
            label="로그인"
            loading={submitting}
            loadingLabel="로그인하는 중이에요"
            onPress={() => void submit()}
          />
          <Button label="이메일로 회원가입" onPress={() => router.push('/signup')} variant="ghost" />
          <Button
            accessibilityHint="Google OAuth 앱 식별자와 client ID 설정 후 사용할 수 있어요."
            label="Google로 회원가입"
            leadingIcon={<GoogleIcon color={colors.text.brand} />}
            onPress={() => {
              setFormError('Google 회원가입은 Android 앱 식별자와 OAuth client ID 설정이 필요해요.');
            }}
            variant="ghost"
          />
        </View>
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
    paddingBottom: spacing[2],
    paddingTop: spacing[4],
  },
  loginLogo: {
    height: spacing[20],
    width: spacing[32] + spacing[20],
  },
  formCard: {
    ...shadows.soft,
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[5],
    padding: spacing[5],
  },
  actions: {
    gap: spacing[3],
  },
});
