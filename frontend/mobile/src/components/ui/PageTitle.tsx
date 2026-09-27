import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/design/tokens';

// 본문 첫 줄에 오는 큰 제목. 헤더가 흰 배경으로 얇아지면서 화면의 제목은 본문이 맡는다.
// 제목 아래 한 줄 설명은 지금 무엇을 하는 화면인지 알린다(DESIGN_SYSTEM §4.1).

export function PageTitle({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.block}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing[2],
  },
  title: {
    ...typography.head3,
    color: colors.text.strong,
  },
  description: {
    ...typography.body4,
    color: colors.text.secondary,
  },
});
