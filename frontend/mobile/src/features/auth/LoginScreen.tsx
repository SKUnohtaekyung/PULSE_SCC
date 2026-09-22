import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login } from '@/api/endpoints';
import { ApiError, NetworkError } from '@/api/errors';
import { isFixtureMode } from '@/api/config';
import { fixtureAccount } from '@/api/fixtures/server';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';
import { useSession } from '@/session/SessionProvider';

// SC-AUTH 로그인. 이번 Vertical Slice가 다루는 상태(SCREEN_STATES §3.2):
// AUTH-INITIAL / AUTH-EDITING / AUTH-FIELD-ERROR / AUTH-SUBMITTING / AUTH-INVALID-CREDENTIALS / AUTH-SUCCESS.
// 가입(AUTH-SIGNUP-*)과 Google 로그인(AUTH-GOOGLE-*)은 이번 범위 밖이라 진입점만 두고 이유를 알린다.

type FieldErrors = { email?: string; password?: string };

export function LoginScreen() {
  const { signIn, client, expired } = useSession();
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= layout.breakpoint.medium ? spacing[6] : spacing[4];

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
    if (error instanceof NetworkError) {
      setFormError('인터넷에 연결되지 않았어요. 연결한 뒤 다시 시도해 주세요.');
      return;
    }
    if (!(error instanceof ApiError)) {
      setFormError('로그인하지 못했어요. 잠시 뒤에 다시 시도해 주세요.');
      return;
    }
    if (error.fieldErrors.length > 0) {
      const next: FieldErrors = {};
      for (const item of error.fieldErrors) {
        if (item.field === 'email') next.email = item.message;
        else if (item.field === 'password') next.password = item.message;
      }
      setFieldErrors(next);
      if (!next.email && !next.password) setFormError(error.message);
      return;
    }
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        setFormError('이메일 또는 비밀번호를 다시 확인해 주세요.');
        return;
      case 'ACCOUNT_NOT_ACTIVE':
        // 세션 만료가 아니므로 로그인 화면에 머문다(SCREEN_STATES §2.1).
        setFormError('이 계정은 지금 사용할 수 없어요. 관리자에게 문의해 주세요.');
        return;
      case 'INVALID_INPUT':
      case 'INVALID_REQUEST':
        setFormError('입력한 내용을 다시 확인해 주세요.');
        return;
      default:
        // 모르는 코드는 서버 문구를 그대로 보여준다(공통 불변식 11).
        setFormError(error.message);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="가게 리뷰에서 손님을 읽어요" />

          <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
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

            <View style={styles.otherWays}>
              <Text style={styles.otherWaysTitle}>다른 방법</Text>
              <Text style={styles.otherWaysBody}>
                Google 로그인과 이메일 가입은 이번 구현 범위에 들어 있지 않아요. 백엔드 연결을 마친 뒤 이어서
                연결해요.
              </Text>
            </View>

            {isFixtureMode ? (
              <Notice
                title="지금은 가상 서버로 동작해요"
                message={`실제 백엔드에 연결하기 전이라 고정된 예시 데이터로 흐름만 확인합니다. 예시 계정 ${fixtureAccount.email} / ${fixtureAccount.password}`}
              />
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.primary,
  },
  content: {
    flexGrow: 1,
    backgroundColor: colors.background.canvas,
    paddingBottom: spacing[10],
  },
  body: {
    width: '100%',
    maxWidth: layout.readingMaxWidth,
    alignSelf: 'center',
    gap: spacing[5],
    paddingTop: spacing[6],
  },
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
