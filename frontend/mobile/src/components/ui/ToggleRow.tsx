import { StyleSheet, Switch, Text, View } from 'react-native';

import { colors, layout, spacing, typography } from '@/design/tokens';

// 설정 토글 한 줄. 2026-09-23 Step 9 결정(DESIGN_SYSTEM §13):
// - 켜짐·꺼짐을 색만으로 알리지 않는다. 오른쪽에 `켜짐`/`꺼짐` 글자를 함께 둔다.
// - 바꾸는 중에는 조작을 막고 `바꾸는 중` 문구를 보여준다(중복 토글 방지, SCREEN_STATES §8 SETTING-UPDATING).
// - 트랙 색은 brand.primary, 끈 상태는 border.strong을 쓴다.

export function ToggleRow({
  label,
  description,
  value,
  onChange,
  updating = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  updating?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={styles.control}>
        <Text style={styles.state}>{updating ? '바꾸는 중' : value ? '켜짐' : '꺼짐'}</Text>
        <Switch
          accessibilityLabel={label}
          accessibilityState={{ checked: value, disabled: updating, busy: updating }}
          disabled={updating}
          ios_backgroundColor={colors.border.strong}
          onValueChange={onChange}
          thumbColor={colors.background.surface}
          trackColor={{ false: colors.border.strong, true: colors.brand.primary }}
          value={value}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: layout.touchTargetMin,
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
  label: {
    ...typography.body4,
    color: colors.text.primary,
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  control: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  state: {
    ...typography.body7,
    color: colors.text.secondary,
  },
});
