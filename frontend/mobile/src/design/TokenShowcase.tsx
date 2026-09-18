import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  accessibility,
  colors,
  layout,
  motion,
  radii,
  shadows,
  spacing,
  strokes,
  typography,
} from '@/design/tokens';

const swatches = [
  { name: 'Brand', value: colors.brand.primary },
  { name: 'Action', value: colors.action.primary },
  { name: 'Canvas', value: colors.background.canvas },
  { name: 'Ink', value: colors.text.primary },
] as const;

const typeSamples = [
  { name: 'Head 2', style: typography.head2, sample: '손님이 남긴 신호를 읽어요' },
  { name: 'Head 5', style: typography.head5, sample: '우선 확인할 운영 포인트' },
  { name: 'Body 2', style: typography.body2, sample: '반복된 경험은 강조하되 과장하지 않습니다.' },
  { name: 'Body 4', style: typography.body4, sample: '리뷰에서 반복된 손님 경험을 근거와 함께 정리합니다.' },
  { name: 'Caption', style: typography.caption, sample: '네이버 리뷰 126건 · 2026.09.18 분석' },
] as const;

function Swatch({ name, value, isMedium }: (typeof swatches)[number] & { isMedium: boolean }) {
  return (
    <View style={[styles.swatch, { flexBasis: isMedium ? '48%' : '100%' }]}>
      <View accessibilityLabel={`${name} 색상 ${value}`} style={[styles.colorWell, { backgroundColor: value }]} />
      <View style={styles.swatchLabel}>
        <Text style={styles.swatchName}>{name}</Text>
        <Text style={styles.code}>{value}</Text>
      </View>
    </View>
  );
}

export function TokenShowcase() {
  const { width } = useWindowDimensions();
  const isExpanded = width >= layout.breakpoint.expanded;
  const isMedium = width >= layout.breakpoint.medium;
  const horizontalPadding = isExpanded
    ? layout.pagePadding.expanded
    : isMedium
      ? layout.pagePadding.medium
      : layout.pagePadding.compact;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>DESIGN FOUNDATION · STEP 3</Text>
          <Text accessibilityRole="header" style={styles.title}>
            PULSE
          </Text>
          <Text style={styles.lead}>
            공개 리뷰를 점주가 바로 이해할 수 있는 손님 인사이트와 실행 제안으로 바꿉니다.
          </Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>리뷰에서 확인</Text>
            <Text style={styles.heroTitle}>근거가 먼저, 해석은 명확하게</Text>
            <Text style={styles.heroBody}>
              분석 결과는 실제 리뷰 근거와 AI 해석을 분리해 보여줍니다.
            </Text>
          </View>
          <View style={styles.actionBadge}>
            <Text style={styles.actionBadgeText}>분석하기</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Semantic color</Text>
            <Text style={styles.sectionCaption}>역할이 먼저이고, 화면은 역할 토큰만 사용합니다.</Text>
          </View>
          <View style={styles.swatchGrid}>
            {swatches.map((swatch) => (
              <Swatch key={swatch.name} {...swatch} isMedium={isMedium} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Typography</Text>
            <Text style={styles.sectionCaption}>Pretendard 정적 굵기와 읽기 쉬운 행간을 적용했습니다.</Text>
          </View>
          <View style={styles.typeList}>
            {typeSamples.map((item) => (
              <View key={item.name} style={styles.typeRow}>
                <Text style={styles.typeName}>{item.name}</Text>
                <Text style={[item.style, styles.typeSample]}>{item.sample}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Structure</Text>
            <Text style={styles.sectionCaption}>4px 간격과 세 단계 모서리 계층을 공통 기준으로 씁니다.</Text>
          </View>
          <View style={styles.structureGrid}>
            <View style={[styles.structureCard, styles.smallRadius]}>
              <Text style={styles.structureValue}>{radii.small}px</Text>
              <Text style={styles.structureLabel}>Badge</Text>
            </View>
            <View style={[styles.structureCard, styles.controlRadius]}>
              <Text style={styles.structureValue}>{radii.control}px</Text>
              <Text style={styles.structureLabel}>Control</Text>
            </View>
            <View style={[styles.structureCard, styles.panelRadius]}>
              <Text style={styles.structureValue}>{radii.panel}px</Text>
              <Text style={styles.structureLabel}>Panel</Text>
            </View>
          </View>
        </View>

        <View style={styles.accessibilityCard}>
          <View style={styles.statusDot} />
          <View style={styles.accessibilityCopy}>
            <Text style={styles.accessibilityTitle}>
              {accessibility.standard} {accessibility.level}
            </Text>
            <Text style={styles.accessibilityBody}>
              일반 텍스트 {accessibility.contrast.normalText}:1 이상 · 제품 터치 영역 최소{' '}
              {accessibility.productTouchTargetMinimum}px · 기본 모션 {motion.duration.standard}ms
            </Text>
          </View>
        </View>

        <Text style={styles.footnote}>
          이 화면은 제품 화면이 아니라 디자인 토큰을 실제 렌더링으로 확인하기 위한 개발용 견본입니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingBottom: spacing[16],
    paddingTop: spacing[8],
    gap: spacing[8],
  },
  intro: {
    gap: spacing[2],
  },
  eyebrow: {
    ...typography.body6,
    color: colors.text.brand,
  },
  title: {
    ...typography.head1,
    color: colors.text.strong,
  },
  lead: {
    ...typography.body4,
    color: colors.text.secondary,
    maxWidth: layout.readingMaxWidth,
  },
  hero: {
    ...shadows.soft,
    backgroundColor: colors.brand.primary,
    borderRadius: radii.panel,
    padding: spacing[6],
    gap: spacing[6],
  },
  heroCopy: {
    gap: spacing[2],
  },
  heroLabel: {
    ...typography.body6,
    color: colors.brand.onPrimary,
  },
  heroTitle: {
    ...typography.head4,
    color: colors.brand.onPrimary,
  },
  heroBody: {
    ...typography.body4,
    color: colors.brand.onPrimary,
  },
  actionBadge: {
    alignSelf: 'flex-start',
    minHeight: layout.touchTargetMin,
    justifyContent: 'center',
    backgroundColor: colors.action.primary,
    borderRadius: radii.control,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
  },
  actionBadgeText: {
    ...typography.buttonMain,
    color: colors.action.onPrimary,
  },
  section: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    padding: spacing[6],
    gap: spacing[5],
  },
  sectionHeading: {
    gap: spacing[1],
  },
  sectionTitle: {
    ...typography.head5,
    color: colors.text.strong,
  },
  sectionCaption: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  swatch: {
    flexGrow: 1,
    overflow: 'hidden',
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
  },
  colorWell: {
    height: spacing[14],
  },
  swatchLabel: {
    padding: spacing[3],
    gap: spacing[1],
  },
  swatchName: {
    ...typography.body6,
    color: colors.text.primary,
  },
  code: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  typeList: {
    gap: spacing[5],
  },
  typeRow: {
    borderBottomColor: colors.border.default,
    borderBottomWidth: strokes.hairline,
    paddingBottom: spacing[4],
    gap: spacing[1],
  },
  typeName: {
    ...typography.caption,
    color: colors.text.brand,
  },
  typeSample: {
    color: colors.text.primary,
  },
  structureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  structureCard: {
    flexGrow: 1,
    minWidth: spacing[24],
    backgroundColor: colors.brand.tint,
    borderColor: colors.border.brand,
    borderWidth: strokes.hairline,
    padding: spacing[4],
    gap: spacing[1],
  },
  smallRadius: {
    borderRadius: radii.small,
  },
  controlRadius: {
    borderRadius: radii.control,
  },
  panelRadius: {
    borderRadius: radii.panel,
  },
  structureValue: {
    ...typography.body1,
    color: colors.text.brand,
  },
  structureLabel: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  accessibilityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.surface,
    borderColor: colors.status.success,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[4],
    gap: spacing[3],
  },
  statusDot: {
    width: spacing[3],
    height: spacing[3],
    marginTop: spacing[1],
    borderRadius: radii.pill,
    backgroundColor: colors.status.success,
  },
  accessibilityCopy: {
    flex: 1,
    gap: spacing[1],
  },
  accessibilityTitle: {
    ...typography.body6,
    color: colors.text.primary,
  },
  accessibilityBody: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  footnote: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
