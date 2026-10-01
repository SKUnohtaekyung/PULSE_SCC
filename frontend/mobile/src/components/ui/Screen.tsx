import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/design/tokens';

// 화면 하나의 공통 골격이다. 화면마다 복사하던 SafeArea·ScrollView·읽기 폭·좌우 여백을 한곳에 모았다.
// 반응형 규칙(DESIGN_SYSTEM §7)을 여기서만 바꾸면 모든 화면에 적용된다.
//
// - header: 화면 폭 전체를 쓰는 영역. 좌우 여백은 헤더가 직접 가진다.
// - children: 읽기 폭(readingMaxWidth) 안에서 가운데 정렬되는 본문.
//   wide를 켜면 expanded(1024dp 이상)에서만 contentMaxWidth까지 넓힌다. 열을 늘리는 결과 화면이 쓴다.
// - footer: 스크롤에서 빠지는 하단 고정 영역(하단 내비게이션 등).
// - scroll: false면 스크롤을 만들지 않는다. 목록(FlatList)을 담는 화면은 반드시 false로 둔다.
//   FlatList를 ScrollView 안에 넣으면 가상화가 꺼지고 경고가 난다.

/** 화면 좌우 여백. 반응형 기준(DESIGN_SYSTEM §7)을 여기 한 곳에서 정한다. */
export function usePagePadding() {
  const { width } = useWindowDimensions();
  if (width >= layout.breakpoint.expanded) return layout.pagePadding.expanded;
  if (width >= layout.breakpoint.medium) return layout.pagePadding.medium;
  return layout.pagePadding.compact;
}

/** expanded 중단점 이상인가. 열 수를 늘리는 판단은 모두 이 값으로 한다(DESIGN_SYSTEM §7). */
export function useExpandedLayout() {
  const { width } = useWindowDimensions();
  return width >= layout.breakpoint.expanded;
}

/** 본문 최대 폭. wide 화면만 expanded에서 contentMaxWidth를 쓴다. 헤더·본문이 같은 값을 써야 왼쪽 끝이 맞는다. */
export function useBodyMaxWidth(wide: boolean) {
  const expanded = useExpandedLayout();
  return wide && expanded ? layout.contentMaxWidth : layout.readingMaxWidth;
}

export function Screen({
  children,
  header,
  footer,
  centered = false,
  scroll = true,
  verticalEdges = ['top'],
  wide = false,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  /** 내용이 적은 화면을 세로 가운데 정렬한다(첫 저장 완료 화면 등). */
  centered?: boolean;
  /** 목록 화면처럼 자체 스크롤을 가진 내용이면 false로 둔다. */
  scroll?: boolean;
  /** 위·아래 SafeArea. 좌우는 컷아웃 때문에 항상 적용한다. */
  verticalEdges?: ('top' | 'bottom')[];
  /** 넓은 화면에서 열을 늘리는 화면이면 true. expanded에서만 본문을 contentMaxWidth까지 넓힌다. */
  wide?: boolean;
}) {
  const horizontalPadding = usePagePadding();
  const bodyMaxWidth = useBodyMaxWidth(wide);

  const body = (
    <>
      {header}
      <View
        style={[
          styles.body,
          centered && styles.bodyCentered,
          // 스크롤을 끄면 본문이 남은 높이를 모두 차지해야 한다.
          // 그래야 안에 넣은 목록(FlatList)이 스크롤 영역을 갖는다.
          !scroll && styles.bodyFill,
          { maxWidth: bodyMaxWidth, paddingHorizontal: horizontalPadding },
        ]}
      >
        {children}
      </View>
    </>
  );

  return (
    <View style={styles.screen}>
      {/* 가로 모드의 디스플레이 컷아웃 아래로 내용이 들어가지 않게 좌우도 SafeArea로 둔다. */}
      <SafeAreaView
        edges={[...verticalEdges, 'left', 'right']}
        style={styles.safeArea}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              styles.contentScroll,
              centered && styles.contentCentered,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        ) : (
          <View style={[styles.content, centered && styles.contentCentered]}>{body}</View>
        )}
      </SafeAreaView>
      {footer ? (
        // 하단 고정 영역이 컷아웃에 닿지 않게 좌우를 SafeArea로 감싼다.
        // 아래쪽 inset은 footer가 bottomInset으로 직접 처리한다.
        // 래퍼에 배경색을 주지 않는다. 주면 inset이 0인 세로 모드에서 래퍼 rect가 footer와 같아져
        // 둥근 모서리를 가진 footer(저장 선택 바)의 radius 뒤를 채워 버린다.
        <SafeAreaView edges={['left', 'right']}>{footer}</SafeAreaView>
      ) : null}
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
  },
  content: {
    flexGrow: 1,
    backgroundColor: colors.background.canvas,
  },
  // 아래 여백은 스크롤되는 화면에만 준다. 목록 화면에서는 목록이 쓸 높이를 깎는다.
  contentScroll: {
    paddingBottom: spacing[10],
  },
  contentCentered: {
    justifyContent: 'center',
  },
  body: {
    width: '100%',
    alignSelf: 'center',
    gap: spacing[5],
    paddingTop: spacing[6],
  },
  // 세로 가운데 정렬 화면은 위아래 여백을 두지 않는다. 가운데가 한쪽으로 밀린다.
  bodyCentered: {
    paddingBottom: 0,
    paddingTop: 0,
  },
  bodyFill: {
    flex: 1,
    minHeight: 0,
  },
});
