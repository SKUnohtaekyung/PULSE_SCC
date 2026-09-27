import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getLegalDocuments, register } from '@/api/endpoints';
import { resolveErrorMessage } from '@/api/errorMessage';
import { ApiError } from '@/api/errors';
import type { LegalDocuments } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { CheckRow } from '@/components/ui/CheckRow';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Notice } from '@/components/ui/Notice';
import { Screen } from '@/components/ui/Screen';
import { PageTitle } from '@/components/ui/PageTitle';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { colors, radii, spacing, strokes, typography } from '@/design/tokens';
import { useSession } from '@/session/SessionProvider';

// SC-AUTH 자체 계정 가입. 상태 정본은 SCREEN_STATES §3.2다.
// AUTH-LEGAL-LOADING → AUTH-SIGNUP-EDITING → AUTH-SIGNUP-SUBMITTING → AUTH-SIGNUP-CREATED(=AUTH-SUCCESS),
// 그리고 AUTH-LEGAL-ERROR · AUTH-FIELD-ERROR · AUTH-SIGNUP-ERROR · AUTH-CONSENT-OUTDATED.

type FieldKey = 'email' | 'password' | 'passwordConfirm' | 'phoneNumber' | 'consent';
type Phase = 'legalLoading' | 'legalError' | 'editing' | 'submitting';

// 비밀번호는 UTF-8 72바이트 이하다(기능명세 §10.1, ADR-008).
const passwordByteLength = (value: string) =>
  typeof TextEncoder === 'undefined' ? value.length : new TextEncoder().encode(value).length;

const signupErrorCopy: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: '이미 가입된 이메일이에요. 로그인으로 들어가 주세요.',
  ACCOUNT_ALREADY_EXISTS: '이미 가입된 계정이에요. 로그인으로 들어가 주세요.',
  INVALID_PASSWORD: '비밀번호 조건을 확인해 주세요.',
  INVALID_PHONE_NUMBER: '전화번호 형식을 확인해 주세요.',
  INVALID_INPUT: '입력한 내용을 다시 확인해 주세요.',
  INVALID_REQUEST: '입력한 내용을 다시 확인해 주세요.',
};

export function SignupScreen() {
  const router = useRouter();
  const { client, signIn } = useSession();

  const [phase, setPhase] = useState<Phase>('legalLoading');
  const [legal, setLegal] = useState<LegalDocuments | null>(null);
  const [legalReloadToken, setLegalReloadToken] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 확인 값은 화면에서만 비교하고 서버에 보내지 않는다(가입 API 계약 그대로).
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [consentOutdated, setConsentOutdated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const documents = await getLegalDocuments(client);
        if (cancelled) return;
        setLegal(documents);
        setPhase('editing');
      } catch {
        if (cancelled) return;
        setPhase('legalError');
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [client, legalReloadToken]);

  /**
   * 약관을 다시 조회한다.
   * 약관이 바뀌어 다시 받는 경우(AUTH-CONSENT-OUTDATED)에는 그 안내를 지우지 않는다.
   */
  const reloadLegal = (options: { keepOutdatedNotice?: boolean } = {}) => {
    setPhase('legalLoading');
    if (!options.keepOutdatedNotice) setConsentOutdated(false);
    setAgreedTerms(false);
    setAgreedPrivacy(false);
    setLegalReloadToken((token) => token + 1);
  };

  const validate = () => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!email.trim()) next.email = '이메일을 입력해 주세요.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = '이메일 형식을 확인해 주세요.';

    if (!password) next.password = '비밀번호를 입력해 주세요.';
    else if (password.length < 8) next.password = '비밀번호는 8자 이상이에요.';
    else if (passwordByteLength(password) > 72) next.password = '비밀번호가 너무 길어요. 조금 줄여 주세요.';

    // 비밀번호를 비워 둔 경우에는 비밀번호 칸의 오류만 보여 준다.
    if (password && !passwordConfirm) next.passwordConfirm = '비밀번호를 한 번 더 입력해 주세요.';
    else if (password && passwordConfirm !== password) next.passwordConfirm = '비밀번호가 서로 달라요.';

    // 서버(AuthPolicy)는 숫자만 추려 8~15자리를 받고 국가번호(+)도 허용한다. 앱이 더 좁히지 않는다.
    const digits = phoneNumber.replace(/[^\d+]/g, '');
    if (!phoneNumber.trim()) next.phoneNumber = '전화번호를 입력해 주세요.';
    else if (!/^\+?\d{8,15}$/.test(digits))
      next.phoneNumber = '전화번호를 다시 확인해 주세요. 예: 010-1234-5678';

    if (!agreedTerms || !agreedPrivacy) next.consent = '이용약관과 개인정보 처리방침에 모두 동의해 주세요.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setFormError(null);
    setConsentOutdated(false);
    if (!legal || !validate()) return;

    setPhase('submitting');
    try {
      const session = await register(client, {
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.replace(/[^\d+]/g, ''),
        termsVersion: legal.termsVersion,
        privacyVersion: legal.privacyVersion,
      });
      await signIn(session);
    } catch (error) {
      setPhase('editing');
      if (error instanceof ApiError) {
        if (error.code === 'CURRENT_LEGAL_CONSENT_REQUIRED') {
          // 약관이 바뀌었다. 이메일·전화번호는 남기고 동의만 다시 받는다(AUTH-CONSENT-OUTDATED).
          setConsentOutdated(true);
          setPassword('');
          setPasswordConfirm('');
          reloadLegal({ keepOutdatedNotice: true });
          return;
        }
        if (error.fieldErrors.length > 0) {
          const next: Partial<Record<FieldKey, string>> = {};
          for (const item of error.fieldErrors) {
            if (item.field === 'email' || item.field === 'password' || item.field === 'phoneNumber') {
              next[item.field] = item.message;
            }
          }
          setErrors(next);
          if (Object.keys(next).length > 0) return;
        }
      }
      setFormError(
        resolveErrorMessage(error, {
          known: signupErrorCopy,
          fallback: '가입하지 못했어요. 잠시 뒤에 다시 시도해 주세요.',
        }),
      );
    }
  };

  return (
    <Screen header={<ScreenHeader label="회원가입" />}>
      <StatusBar style="dark" />

      <PageTitle title="이메일로 가입해요" />

      {consentOutdated ? (
        <Notice
          alert
          title="약관이 바뀌었어요"
          message="새 약관을 다시 받아왔어요. 내용을 확인하고 다시 동의해 주세요. 비밀번호는 안전을 위해 지웠으니 확인 칸까지 다시 입력해 주세요."
          tone="warning"
        />
      ) : null}

      {phase === 'legalLoading' ? (
        <LoadingBlock message="이용약관과 개인정보 처리방침을 불러오고 있어요." />
      ) : null}

      {phase === 'legalError' ? (
        <View style={styles.block}>
          <Notice
            alert
            title="약관을 불러오지 못했어요"
            message="약관을 확인하기 전에는 가입을 진행할 수 없어요."
            tone="error"
          />
          <Button label="다시 불러오기" onPress={() => reloadLegal()} variant="ghost" />
          <Button label="로그인으로 돌아가기" onPress={() => router.back()} variant="ghost" />
        </View>
      ) : null}

      {phase === 'editing' || phase === 'submitting' ? (
        <>
          {formError ? <Notice alert title="가입하지 못했어요" message={formError} tone="error" /> : null}

          <View style={styles.formCard}>
            <TextField
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              inputMode="email"
              label="이메일"
              onChangeText={(value) => {
                setEmail(value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="예: owner@example.com"
              value={email}
            />
            <TextField
              autoCapitalize="none"
              error={errors.password}
              hint="8자 이상"
              label="비밀번호"
              onChangeText={(value) => {
                setPassword(value);
                // 비밀번호가 바뀌면 확인 칸의 불일치 판정도 낡는다.
                setErrors((current) => ({ ...current, password: undefined, passwordConfirm: undefined }));
              }}
              secureTextEntry
              value={password}
            />
            <TextField
              autoCapitalize="none"
              error={errors.passwordConfirm}
              label="비밀번호 확인"
              onChangeText={(value) => {
                setPasswordConfirm(value);
                setErrors((current) => ({ ...current, passwordConfirm: undefined }));
              }}
              secureTextEntry
              value={passwordConfirm}
            />
            <TextField
              error={errors.phoneNumber}
              hint="가게 확인 연락에만 씁니다. 본인 인증이나 비밀번호 찾기에는 쓰지 않아요."
              inputMode="numeric"
              label="전화번호"
              onChangeText={(value) => {
                setPhoneNumber(value);
                setErrors((current) => ({ ...current, phoneNumber: undefined }));
              }}
              placeholder="010-1234-5678"
              value={phoneNumber}
            />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.consentTitle}>약관 동의</Text>
            <CheckRow
              checked={agreedTerms}
              description={legal ? `이용약관 ${legal.termsVersion}` : undefined}
              label="이용약관에 동의해요"
              onToggle={() => {
                setAgreedTerms((value) => !value);
                setErrors((current) => ({ ...current, consent: undefined }));
              }}
            />
            <CheckRow
              checked={agreedPrivacy}
              description={legal ? `개인정보 처리방침 ${legal.privacyVersion}` : undefined}
              error={errors.consent}
              label="개인정보 처리방침에 동의해요"
              onToggle={() => {
                setAgreedPrivacy((value) => !value);
                setErrors((current) => ({ ...current, consent: undefined }));
              }}
            />
          </View>

          <Button
            label="가입하기"
            loading={phase === 'submitting'}
            loadingLabel="가입하는 중이에요"
            onPress={() => void submit()}
          />

          <Button label="로그인으로 돌아가기" onPress={() => router.back()} variant="ghost" />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing[3],
  },
  formCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[4],
    padding: spacing[5],
  },
  consentTitle: {
    ...typography.body6,
    color: colors.text.primary,
  },
});
