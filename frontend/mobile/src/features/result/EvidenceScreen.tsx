import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { getEvidence } from '@/api/endpoints';
import { resolveErrorMessage } from '@/api/errorMessage';
import { SessionExpiredError } from '@/api/errors';
import type { EvidenceItem } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Notice } from '@/components/ui/Notice';
import { Screen } from '@/components/ui/Screen';
import { PageTitle } from '@/components/ui/PageTitle';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radii, spacing, strokes, typography } from '@/design/tokens';
import { FixtureBanner } from '@/features/dev/FixtureBanner';
import { useSession } from '@/session/SessionProvider';

// SC-005 근거 상세. 상태 정본은 SCREEN_STATES §6.3이다.
// EVIDENCE-LOADING / NORMAL / LOADING-MORE / END / EMPTY / ERROR.
// 목록은 cursor로 이어 받는다. 작성자 정보는 응답에 없고 화면에도 두지 않는다(API.md §7).

type Phase = 'loading' | 'ready' | 'error';

const perspectiveLabels: Record<string, string> = {
  POSITIVE: '잘하고 있는 점',
  NEGATIVE: '손님이 불편해한 점',
  PERCEPTION: '손님이 기억하는 모습',
  PRIORITY: '먼저 볼 것',
  ADVICE: '검토해 볼 행동',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

export function EvidenceScreen({
  analysisId,
  personaId,
  perspective,
  personaLabel,
}: {
  analysisId: string;
  personaId: string;
  perspective: string;
  personaLabel?: string;
}) {
  const router = useRouter();
  const { client } = useSession();

  const [phase, setPhase] = useState<Phase>('loading');
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const page = await getEvidence(client, analysisId, { personaId, perspective });
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setPhase('ready');
      } catch (error) {
        if (cancelled || error instanceof SessionExpiredError) return;
        setErrorMessage(
          resolveErrorMessage(error, {
            fallback: '근거 리뷰를 불러오지 못했어요.',
            offline: '인터넷에 연결되지 않아 근거 리뷰를 불러오지 못했어요.',
          }),
        );
        setPhase('error');
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [analysisId, client, perspective, personaId, reloadToken]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getEvidence(client, analysisId, { personaId, perspective, cursor });
      // 이미 받은 목록은 유지하고 뒤에 붙인다(EVIDENCE-LOADING-MORE).
      setItems((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
      setErrorMessage(null);
    } catch (error) {
      if (!(error instanceof SessionExpiredError)) {
        setErrorMessage(
          resolveErrorMessage(error, { fallback: '다음 근거를 불러오지 못했어요. 다시 시도해 주세요.' }),
        );
      }
    } finally {
      setLoadingMore(false);
    }
  }, [analysisId, client, cursor, loadingMore, perspective, personaId]);

  const title = perspectiveLabels[perspective] ?? '근거 리뷰';

  return (
    <Screen
      header={<ScreenHeader brand label="근거 리뷰" />}
      scroll={phase !== 'ready'}
    >
      <StatusBar style="dark" />

      <PageTitle title={`${title} 근거 리뷰`} />

      {phase !== 'ready' ? <FixtureBanner /> : null}

      {phase === 'loading' ? <LoadingBlock message="근거 리뷰를 불러오고 있어요." /> : null}

      {phase === 'error' && errorMessage ? (
        <View style={styles.block}>
          <Notice alert title="근거 리뷰를 불러오지 못했어요" message={errorMessage} tone="error" />
          <Button
            label="다시 불러오기"
            onPress={() => {
              setPhase('loading');
              setErrorMessage(null);
              setReloadToken((token) => token + 1);
            }}
            variant="ghost"
          />
          <Button label="결과로 돌아가기" onPress={() => router.back()} variant="ghost" />
        </View>
      ) : null}

      {phase === 'ready' ? (
        <FlatList
          ListEmptyComponent={
            <Notice
              alert
              title="연결된 근거 리뷰가 없어요"
              message="근거 없이 만들어진 결과는 정상 결과로 볼 수 없어요. 결과를 다시 불러와 주세요."
              tone="error"
            />
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {errorMessage ? (
                <Notice alert title="더 불러오지 못했어요" message={errorMessage} tone="error" />
              ) : null}
              {loadingMore ? (
                <View style={styles.more}>
                  <ActivityIndicator color={colors.brand.primary} size="small" />
                  <Text style={styles.moreText}>다음 근거를 불러오는 중이에요.</Text>
                </View>
              ) : cursor ? (
                <Button label="더 보기" onPress={() => void loadMore()} variant="ghost" />
              ) : items.length > 0 ? (
                <Text style={styles.end}>근거 리뷰를 모두 확인했어요.</Text>
              ) : null}
              <Button label="결과로 돌아가기" onPress={() => router.back()} variant="ghost" />
            </View>
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <FixtureBanner />
              {personaLabel ? <Text style={styles.subject}>{personaLabel}</Text> : null}
              <Text style={styles.note}>
                리뷰를 쓴 사람의 정보는 받지도, 보여주지도 않아요.
              </Text>
            </View>
          }
          data={items}
          keyExtractor={(item) => item.reviewId}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.excerpt}>“{item.excerpt}”</Text>
              <Text style={styles.meta}>
                {formatDate(item.writtenAt)}
                {typeof item.rating === 'number' ? ` · 별점 ${item.rating}` : ''}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing[3],
  },
  listHeader: {
    gap: spacing[2],
    paddingBottom: spacing[3],
  },
  subject: {
    ...typography.body1,
    color: colors.text.primary,
  },
  note: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  row: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    gap: spacing[2],
    marginBottom: spacing[2],
    padding: spacing[4],
  },
  excerpt: {
    ...typography.body7,
    color: colors.text.primary,
  },
  meta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  footer: {
    gap: spacing[3],
    paddingBottom: spacing[8],
    paddingTop: spacing[3],
  },
  more: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  moreText: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  end: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
