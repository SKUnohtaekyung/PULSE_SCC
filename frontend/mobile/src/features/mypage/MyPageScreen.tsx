import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
import { personaImageSource, type PersonaImageSource } from '@/api/personaImages';
import type { AnalysisResult, NotificationItem } from '@/api/types';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Reveal, revealStagger } from '@/components/ui/Motion';
import { Notice } from '@/components/ui/Notice';
import {
  PersonaAvatar,
  PersonaAvatarNotice,
  PersonaImageError,
  usePersonaImageRetry,
} from '@/components/ui/PersonaAvatar';
import { Screen, usePagePadding } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';
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
  const pagePadding = usePagePadding();
  const { width: windowWidth } = useWindowDimensions();
  // 카드 한 장과 다음 카드의 가장자리가 함께 보이는 폭. 넓은 화면에서는 읽기 폭의 절반을 넘지 않는다.
  const cardWidth = Math.min(windowWidth - pagePadding * 2 - spacing[12], layout.readingMaxWidth / 2);
  /** 크게 보고 있는 저장 이미지의 순서. 닫혀 있으면 null. */
  const [viewing, setViewing] = useState<number | null>(null);
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

  // 순위를 함께 들고 간다. 자리표시 그림은 시상대와 같은 순위 자리의 손님이어야 한다.
  const personaImages =
    savedResult.data?.podium
      .filter((slot) => slot.status === 'FILLED' && slot.persona)
      .sort((a, b) => a.rank - b.rank)
      .map((slot) => ({
        rank: slot.rank,
        persona: slot.persona!,
        topicReviewCount: slot.topicReviewCount,
      })) ?? [];
  const personaSources = personaImages.map(({ persona }) => personaImageSource(client, persona.image));

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

      {/* 저장된 손님 유형 이미지. 사진 피드처럼 카드 한 장에 한 사람씩 놓고 옆으로 넘겨 본다(2026-10-09 사용자 요청). */}
      <View style={styles.feedSection}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          저장된 결과의 손님 유형 이미지
        </Text>
        {savedResult.status === 'loading' ? (
          <LoadingBlock message="저장된 결과를 불러오고 있어요." />
        ) : savedResult.status === 'error' ? (
          <Notice alert title="저장된 결과를 불러오지 못했어요" message={savedResult.message} tone="error" />
        ) : personaImages.length > 0 ? (
          <>
            {/* 결과 화면 시상대와 같은 고지 — 실제 이미지가 한 장이라도 있으면 AI 이미지라고, 없으면 자리표시라고 알린다. */}
            <PersonaAvatarNotice anyRemote={personaSources.some((source) => source.kind === 'remote')} />
            <ScrollView
              contentContainerStyle={styles.feed}
              horizontal
              showsHorizontalScrollIndicator={false}
              // 카드가 본문 좌우 여백 밖까지 흘러 다음 카드가 있다는 것을 보여 준다.
              style={{ marginHorizontal: -pagePadding }}
            >
              <View style={{ width: pagePadding - spacing[3] }} />
              {personaImages.map(({ rank, persona, topicReviewCount }, index) => (
                <StoredPersonaCard
                  altText={persona.image.altText}
                  key={persona.id}
                  label={persona.label}
                  onOpen={() => setViewing(index)}
                  rank={rank}
                  source={personaSources[index]}
                  topicReviewCount={topicReviewCount}
                  width={cardWidth}
                />
              ))}
              <View style={{ width: pagePadding - spacing[3] }} />
            </ScrollView>
          </>
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
          계정 탈퇴는 준비 중이에요.
        </Text>
      </View>

      {viewing !== null && personaImages[viewing] ? (
        <StoredPersonaViewer
          altText={personaImages[viewing].persona.image.altText}
          label={personaImages[viewing].persona.label}
          onClose={() => setViewing(null)}
          rank={personaImages[viewing].rank}
          source={personaSources[viewing]}
        />
      ) : null}

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

type SaveState = 'idle' | 'saving' | 'saved' | 'denied' | 'error';

const saveMessages: Record<Exclude<SaveState, 'idle' | 'saving'>, string> = {
  saved: '사진 앱에 저장했어요.',
  denied: '사진 저장 권한이 없어 저장하지 못했어요. 기기 설정에서 권한을 허용해 주세요.',
  error: '저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.',
};

/**
 * 인증 요청으로 이미지를 다시 받아 기기 사진 앱에 저장한다. 쓰기 권한만 요청한다.
 * 저장 모듈은 누를 때 불러온다. Expo Go에는 expo-media-library의 새 네이티브 모듈이 없어,
 * 파일 맨 위에서 불러오면 마이페이지 전체가 열리지 않는다(2026-10-09 에뮬레이터에서 확인).
 */
async function savePersonaImage(source: PersonaImageSource, fileName: string): Promise<SaveState> {
  if (source.kind !== 'remote') return 'error';
  const { requestPermissionsAsync, saveToLibraryAsync } = await import('expo-media-library/legacy');
  const permission = await requestPermissionsAsync(true);
  if (!permission.granted) return 'denied';
  const bytes = await source.client.requestImage(source.path);
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(bytes);
  await saveToLibraryAsync(file.uri);
  // 사진 앱에 복사됐으므로 캐시의 사본은 남기지 않는다. 지우지 못해도 저장은 이미 끝났으므로 실패로 알리지 않는다.
  try {
    file.delete();
  } catch {
    // 캐시는 시스템이 나중에 비운다.
  }
  return 'saved';
}

// 저장된 결과의 손님 유형 카드(STORED-IMAGES-NORMAL). 결과 화면과 같은 그림·같은 실패 규칙을 쓴다(SCREEN_STATES §6.4).
function StoredPersonaCard({
  rank,
  label,
  altText,
  source,
  topicReviewCount,
  width,
  onOpen,
}: {
  rank: number;
  label: string;
  altText: string;
  source: PersonaImageSource;
  topicReviewCount?: number;
  width: number;
  onOpen: () => void;
}) {
  const image = usePersonaImageRetry(source);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const save = async () => {
    setSaveState('saving');
    try {
      setSaveState(await savePersonaImage(source, `pulse-persona-${rank}.png`));
    } catch {
      setSaveState('error');
    }
  };

  return (
    <Reveal delay={revealStagger * rank} style={[styles.feedCard, { width }]}>
      <Pressable
        // 그림과 이름을 한 번에 읽는다. 묶으면 그림 라벨이 가려지므로 서버 대체 텍스트를 함께 붙인다.
        accessibilityLabel={`${altText}. ${rank}위 ${label}. 크게 보기`}
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <PersonaAvatar
          altText={altText}
          key={image.attempt}
          onLoadError={image.onLoadError}
          source={source}
          tile
          variant={rank - 1}
        />
      </Pressable>
      <View style={styles.feedBody}>
        <View style={styles.feedMeta}>
          <Text style={styles.feedRank}>{rank}위 손님</Text>
          {topicReviewCount !== undefined ? (
            <Text style={styles.imageRank}>리뷰 {topicReviewCount}건</Text>
          ) : null}
        </View>
        <Text style={styles.imageLabel}>{label}</Text>
        {image.showError ? <PersonaImageError canRetry={image.canRetry} onRetry={image.retry} /> : null}
        {source.kind === 'remote' && !image.showError ? (
          <>
            <Button
              label={saveState === 'saved' ? '다시 저장' : '이미지 저장'}
              loading={saveState === 'saving'}
              loadingLabel="저장하는 중이에요"
              onPress={() => void save()}
              variant="ghost"
            />
            {saveState !== 'idle' && saveState !== 'saving' ? (
              <Text
                accessibilityLiveRegion="polite"
                style={saveState === 'saved' ? styles.saveDone : styles.saveFailed}
              >
                {saveMessages[saveState]}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </Reveal>
  );
}

// 저장 이미지 크게 보기. 읽기 전용이고, AI가 만든 가상 이미지라는 사실을 그림 바로 아래에서 다시 알린다.
function StoredPersonaViewer({
  rank,
  label,
  altText,
  source,
  onClose,
}: {
  rank: number;
  label: string;
  altText: string;
  source: PersonaImageSource;
  onClose: () => void;
}) {
  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible
    >
      {/* 배경과 본문 래퍼는 접근성 초점을 갖지 않는다(ConfirmDialog와 같은 규칙). */}
      <Pressable accessible={false} onPress={onClose} style={styles.viewerBackdrop}>
        <Pressable accessible={false} onPress={() => undefined} style={styles.viewer}>
          {/* 가로 화면이나 큰 글자에서 닫기 버튼이 화면 밖으로 밀리지 않게 안에서 스크롤한다. */}
          <ScrollView contentContainerStyle={styles.viewerContent} showsVerticalScrollIndicator={false}>
            <PersonaAvatar altText={altText} source={source} tile variant={rank - 1} />
            <View style={styles.imageText}>
              <Text style={styles.imageRank}>{rank}위 손님</Text>
              <Text accessibilityRole="header" style={styles.viewerLabel}>
                {label}
              </Text>
              <PersonaAvatarNotice anyRemote={source.kind === 'remote'} />
            </View>
            <Button label="닫기" onPress={onClose} variant="ghost" />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
  feedSection: {
    gap: spacing[3],
  },
  feed: {
    gap: spacing[3],
    paddingVertical: spacing[1],
  },
  feedCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[3],
    padding: spacing[3],
  },
  feedBody: {
    gap: spacing[2],
    paddingHorizontal: spacing[1],
    paddingBottom: spacing[1],
  },
  feedMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feedRank: {
    ...typography.caption,
    backgroundColor: colors.brand.tint,
    borderRadius: radii.pill,
    color: colors.text.brand,
    overflow: 'hidden',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  saveDone: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  saveFailed: {
    ...typography.caption,
    color: colors.status.errorText,
  },
  imageText: {
    gap: spacing[1],
  },
  viewerBackdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.brand.strongOverlay,
    justifyContent: 'center',
    padding: spacing[5],
  },
  viewer: {
    width: '100%',
    maxHeight: '100%',
    maxWidth: layout.readingMaxWidth,
    backgroundColor: colors.background.surface,
    borderRadius: radii.panel,
    padding: spacing[4],
  },
  viewerContent: {
    gap: spacing[3],
  },
  viewerLabel: {
    ...typography.head5,
    color: colors.text.strong,
  },
  pressed: {
    opacity: 0.9,
  },
  imageRank: {
    ...typography.caption,
    color: colors.text.secondary,
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
