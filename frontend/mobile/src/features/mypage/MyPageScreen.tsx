import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getNotificationSettings,
  getNotifications,
  getSavedAnalysis,
  logout,
  updateNotificationSettings,
} from '@/api/endpoints';
import { resolveErrorMessage } from '@/api/errorMessage';
import { ApiError, SessionExpiredError } from '@/api/errors';
import { personaImageSource } from '@/api/personaImages';
import type { AnalysisResult, NotificationItem } from '@/api/types';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Notice } from '@/components/ui/Notice';
import { PersonaImageBlock } from '@/components/ui/PersonaImageBlock';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { colors, radii, spacing, strokes, typography } from '@/design/tokens';
import { FixtureBanner } from '@/features/dev/FixtureBanner';
import { useSession } from '@/session/SessionProvider';

// SC-012 마이페이지. 상태 정본은 SCREEN_STATES §8이다.
// 영역마다 따로 불러오고 따로 실패한다(MYPAGE-PARTIAL-ERROR). 한 영역이 실패해도 나머지는 그대로 둔다.
// 계정 탈퇴는 이 저장소 API.md(§3.3)가 계약에서 제외해 구현하지 않는다.
// 원격 백엔드에는 DELETE /api/v1/me/account가 있으므로, 계약을 맞출지는 role:platform이 정한다.

type SectionState<T> = { status: 'loading' | 'ready' | 'error'; data: T | null; message?: string };

const appVersion = Constants.expoConfig?.version ?? '개발 빌드';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

export function MyPageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { client, user, signOut } = useSession();

  const [notifications, setNotifications] = useState<SectionState<NotificationItem[]>>({
    status: 'loading',
    data: null,
  });
  const [settings, setSettings] = useState<SectionState<boolean>>({ status: 'loading', data: null });
  const [savedResult, setSavedResult] = useState<SectionState<AnalysisResult>>({
    status: 'loading',
    data: null,
  });
  const [settingUpdating, setSettingUpdating] = useState(false);
  const [settingError, setSettingError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'logout' | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const response = await getNotifications(client);
        if (!cancelled) setNotifications({ status: 'ready', data: response });
      } catch (error) {
        if (cancelled || error instanceof SessionExpiredError) return;
        setNotifications({
          status: 'error',
          data: null,
          message: resolveErrorMessage(error, { fallback: '알림을 불러오지 못했어요.' }),
        });
      }
    };

    const loadSettings = async () => {
      try {
        const response = await getNotificationSettings(client);
        if (!cancelled) setSettings({ status: 'ready', data: response.analysisResultEnabled });
      } catch (error) {
        if (cancelled || error instanceof SessionExpiredError) return;
        setSettings({
          status: 'error',
          data: null,
          message: resolveErrorMessage(error, { fallback: '알림 설정을 불러오지 못했어요.' }),
        });
      }
    };

    const loadSaved = async () => {
      try {
        const response = await getSavedAnalysis(client);
        if (!cancelled) setSavedResult({ status: 'ready', data: response });
      } catch (error) {
        if (cancelled || error instanceof SessionExpiredError) return;
        if (error instanceof ApiError && error.code === 'SAVED_ANALYSIS_NOT_FOUND') {
          setSavedResult({ status: 'ready', data: null });
          return;
        }
        setSavedResult({
          status: 'error',
          data: null,
          message: resolveErrorMessage(error, { fallback: '저장된 결과를 불러오지 못했어요.' }),
        });
      }
    };

    void loadNotifications();
    void loadSettings();
    void loadSaved();
    return () => {
      cancelled = true;
    };
  }, [client, reloadToken]);

  const changeSetting = async (next: boolean) => {
    setSettingUpdating(true);
    setSettingError(null);
    try {
      const response = await updateNotificationSettings(client, next);
      setSettings({ status: 'ready', data: response.analysisResultEnabled });
    } catch (error) {
      if (!(error instanceof SessionExpiredError)) {
        // 서버 값이 바뀌지 않았으므로 화면 값도 그대로 둔다(SETTING-ERROR).
        setSettingError(
          resolveErrorMessage(error, { fallback: '알림 설정을 바꾸지 못했어요. 값은 그대로예요.' }),
        );
      }
    } finally {
      setSettingUpdating(false);
    }
  };

  const runLogout = async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logout(client);
      setDialog(null);
      await signOut();
    } catch (error) {
      setDialog(null);
      if (error instanceof SessionExpiredError) return;
      // 서버 세션이 정리됐는지 알 수 없다. 이 기기의 로그인 상태는 그대로 두고 다음 행동을 묻는다(LOGOUT-ERROR).
      setLogoutError(
        resolveErrorMessage(error, {
          fallback: '서버에서 로그아웃을 확인하지 못했어요. 이 기기에는 아직 로그인 상태가 남아 있어요.',
          offline: '인터넷에 연결되지 않아 로그아웃하지 못했어요. 이 기기에는 아직 로그인 상태가 남아 있어요.',
        }),
      );
    } finally {
      setLoggingOut(false);
    }
  };

  /** 서버 응답과 무관하게 이 기기의 인증 정보만 지운다. */
  const signOutLocally = async () => {
    setLogoutError(null);
    await signOut();
  };

  const personaImages =
    savedResult.data?.podium
      .filter((slot) => slot.status === 'FILLED' && slot.persona)
      .map((slot) => slot.persona!) ?? [];

  return (
    <Screen
      footer={
        <BottomNavigation
          active="mypage"
          bottomInset={insets.bottom}
          onAnalyze={() => router.navigate('/analyze')}
          onHome={() => router.navigate('/home')}
        />
      }
      header={<ScreenHeader brand badge="마이페이지" />}
    >
      <StatusBar style="dark" />

      <FixtureBanner />

      {logoutError ? (
        <Notice alert title="로그아웃하지 못했어요" message={logoutError} tone="warning">
          <View style={styles.logoutActions}>
            <Button label="다시 시도" onPress={() => void runLogout()} variant="ghost" />
            <Button
              label="이 기기에서만 로그아웃"
              onPress={() => void signOutLocally()}
              variant="ghost"
            />
          </View>
        </Notice>
      ) : null}

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          분석 알림
        </Text>
        {notifications.status === 'loading' ? (
          <LoadingBlock message="알림을 불러오고 있어요." />
        ) : notifications.status === 'error' ? (
          <Notice alert title="알림을 불러오지 못했어요" message={notifications.message} tone="error" />
        ) : notifications.data && notifications.data.length > 0 ? (
          notifications.data.map((item) => (
            <View key={item.id} style={styles.notification}>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationDate}>{formatDateTime(item.createdAt)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>아직 분석 알림이 없어요. 분석을 마치면 여기에 쌓여요.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          알림 설정
        </Text>
        {settings.status === 'loading' ? (
          <LoadingBlock message="알림 설정을 불러오고 있어요." />
        ) : settings.status === 'error' ? (
          <Notice alert title="알림 설정을 불러오지 못했어요" message={settings.message} tone="error" />
        ) : (
          <>
            <ToggleRow
              description="분석이 끝나거나 실패했을 때 앱 안에서 알려요."
              label="분석 결과 알림"
              onChange={(next) => void changeSetting(next)}
              updating={settingUpdating}
              value={settings.data ?? true}
            />
            {settingError ? (
              <Notice alert title="설정을 바꾸지 못했어요" message={settingError} tone="error" />
            ) : null}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          저장된 결과의 손님 유형 이미지
        </Text>
        {savedResult.status === 'loading' ? (
          <LoadingBlock message="저장된 결과를 불러오고 있어요." />
        ) : savedResult.status === 'error' ? (
          <Notice alert title="저장된 결과를 불러오지 못했어요" message={savedResult.message} tone="error" />
        ) : personaImages.length > 0 ? (
          <View style={styles.images}>
            <Text style={styles.empty}>
              손님 유형 이미지는 리뷰 패턴을 설명하려고 AI가 만드는 그림이에요. 실제 손님 사진이 아니에요.
            </Text>
            {personaImages.map((persona) => (
              <View key={persona.id} style={styles.imageItem}>
                <PersonaImageBlock
                  altText={persona.image.altText}
                  showNotice={false}
                  size="small"
                  source={personaImageSource(client, persona.image)}
                />
                <Text style={styles.imageLabel}>{persona.label}</Text>
              </View>
            ))}
            <Text style={styles.empty}>
              읽기 전용이에요. 새 결과로 바꾸면 이미지도 함께 바뀌어요.
            </Text>
          </View>
        ) : (
          <Text style={styles.empty}>지금 저장된 결과에는 보여드릴 이미지가 없어요.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          서비스 정보
        </Text>
        <Text style={styles.infoRow}>로그인 계정 · {user?.email ?? '알 수 없음'}</Text>
        <Text style={styles.infoRow}>앱 버전 · {appVersion}</Text>
        <Text style={styles.empty}>
          분석은 공개된 네이버 리뷰만 사용하고, 손님 유형과 제안은 AI가 만든 해석이에요.
        </Text>
      </View>

      {savedResult.status === 'error' || notifications.status === 'error' || settings.status === 'error' ? (
        <Button
          label="다시 불러오기"
          onPress={() => {
            setNotifications({ status: 'loading', data: null });
            setSettings({ status: 'loading', data: null });
            setSavedResult({ status: 'loading', data: null });
            setReloadToken((token) => token + 1);
          }}
          variant="ghost"
        />
      ) : null}

      <Button label="로그아웃" onPress={() => setDialog('logout')} variant="ghost" />

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          계정 탈퇴
        </Text>
        <Text style={styles.empty}>
          계정 탈퇴는 아직 연결하지 않았어요. 서버에는 탈퇴 기능이 있지만 팀의 API 계약에는 아직 들어 있지
          않아서, 계약이 정리되면 이 자리에 넣어요.
        </Text>
      </View>

      <ConfirmDialog
        actions={[
          {
            label: '로그아웃',
            onPress: () => void runLogout(),
            variant: 'primary',
            loading: loggingOut,
            loadingLabel: '로그아웃하는 중이에요',
          },
          { label: '취소', onPress: () => setDialog(null) },
        ]}
        message="다시 이용하려면 이메일과 비밀번호로 로그인해요."
        onDismiss={() => setDialog(null)}
        title="로그아웃할까요?"
        visible={dialog === 'logout'}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[3],
    padding: spacing[5],
  },
  sectionTitle: {
    ...typography.body1,
    color: colors.text.primary,
  },
  notification: {
    borderLeftColor: colors.border.brand,
    borderLeftWidth: strokes.focus,
    gap: spacing[1],
    paddingLeft: spacing[3],
  },
  notificationMessage: {
    ...typography.body7,
    color: colors.text.primary,
  },
  notificationDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  empty: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  images: {
    gap: spacing[3],
  },
  imageItem: {
    gap: spacing[2],
  },
  logoutActions: {
    gap: spacing[2],
    paddingTop: spacing[2],
  },
  imageLabel: {
    ...typography.body6,
    color: colors.text.primary,
  },
  infoRow: {
    ...typography.body7,
    color: colors.text.primary,
  },
});
