import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { login } from '@/api/endpoints';
import { resolveErrorMessage } from '@/api/errorMessage';
import { ApiError } from '@/api/errors';
import { isFixtureMode } from '@/api/config';
import { fixtureAccount } from '@/api/fixtures/server';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Screen } from '@/components/ui/Screen';
import { PageTitle } from '@/components/ui/PageTitle';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { colors, radii, spacing, strokes, typography } from '@/design/tokens';
import { useSession } from '@/session/SessionProvider';

// SC-AUTH 로그인. 이번 Vertical Slice가 다루는 상태(SCREEN_STATES §3.2):
// AUTH-INITIAL / AUTH-EDITING / AUTH-FIELD-ERROR / AUTH-SUBMITTING / AUTH-INVALID-CREDENTIALS / AUTH-SUCCESS.
// 가입(AUTH-SIGNUP-*)과 Google 로그인(AUTH-GOOGLE-*)은 이번 범위 밖이라 진입점만 두고 이유를 알린다.

type FieldErrors = { email?: string; password?: string };

// SCREEN_STATES §2.1에서 이 화면이 문구를 정한 코드들.
const loginErrorCopy: Record<string, string> = {
  INVALID_CREDENTIALS: '이메일 또는 비밀번호를 다시 확인해 주세요.',
  // 세션 만료가 아니므로 로그인 화면에 머문다.
  ACCOUNT_NOT_ACTIVE: '이 계정은 지금 사용할 수 없어요. 관리자에게 문의해 주세요.',
  INVALID_INPUT: '입력한 내용을 다시 확인해 주세요.',
  INVALID_REQUEST: '입력한 내용을 다시 확인해 주세요.',
};

export function LoginScreen() {
  const router = useRouter();
  const { signIn, client, expired } = useSession();
  const [email, setEmail] = useState(isFixtureMode ? fixtureAccount.email : '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = '이메일을 입력해 주세요.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = '이메일 형식을 확인해 주세요.';
    if (!password) next.password = '비밀번호를 입력해 주세요.';
    else if (password.length < 8) next.password = '비밀번호는 8자 이상이에요.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
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

  const applyError = (error: unknown) => {
    // 서버가 필드 오류를 주면 필드 가까이에 표시한다(AUTH-FIELD-ERROR).
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

  return (
    <Screen header={<ScreenHeader brand />}>
      <StatusBar style="dark" />

      <PageTitle
        title="가게 리뷰에서 손님을 읽어요"
        description="네이버 공개 리뷰를 모아 어떤 손님이 반복해서 오는지 정리해 드려요."
      />

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
          placeholder="예: owner@example.com"
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

      <Button
        label="로그인"
        loading={submitting}
        loadingLabel="로그인하는 중이에요"
        onPress={() => void submit()}
      />

      <Button label="이메일로 가입하기" onPress={() => router.push('/signup')} variant="ghost" />

      <View style={styles.otherWays}>
        <Text style={styles.otherWaysTitle}>Google 로그인</Text>
        <Text style={styles.otherWaysBody}>
          Google 로그인은 앱 식별자와 OAuth 설정이 정해진 뒤에 연결해요. 지금은 이메일 계정으로 이용해
          주세요.
        </Text>
      </View>

      {isFixtureMode ? (
        <Notice
          title="지금은 가상 서버로 동작해요"
          message={`실제 백엔드에 연결하기 전이라 고정된 예시 데이터로 흐름만 확인합니다. 예시 계정 ${fixtureAccount.email} / ${fixtureAccount.password}`}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[5],
    padding: spacing[5],
  },
  otherWays: {
    gap: spacing[2],
  },
  otherWaysTitle: {
    ...typography.body6,
    color: colors.text.primary,
  },
  otherWaysBody: {
    ...typography.body7,
    color: colors.text.secondary,
  },
});
