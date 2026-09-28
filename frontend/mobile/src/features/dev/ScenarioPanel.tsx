import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isFixtureMode } from '@/api/config';
import { fixtureScenarios, getFixtureScenario, setFixtureScenario, type FixtureScenario } from '@/api/fixtures/server';
import { Chip } from '@/components/ui/Chip';
import { colors, radii, spacing, strokes, typography } from '@/design/tokens';

// fixture 모드에서만 보이는 개발용 전환 패널이다. 실제 서버에 붙으면 렌더링하지 않는다.
// 사용자에게 보이는 화면이므로 지금 어떤 상황을 재현 중인지 문장으로 적는다.

export function ScenarioPanel({ onChange }: { onChange?: (scenario: FixtureScenario) => void }) {
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState<FixtureScenario>(getFixtureScenario());

  if (!isFixtureMode) return null;

  const current = fixtureScenarios.find((item) => item.key === scenario);

  const select = (next: FixtureScenario) => {
    setFixtureScenario(next);
    setScenario(next);
    onChange?.(next);
  };

  return (
    <View style={styles.panel}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <Text style={styles.title}>가상 서버 상황: {current?.label ?? '첫 분석 성공'}</Text>
        <Text style={styles.toggle}>{open ? '접기' : '바꾸기'}</Text>
      </Pressable>
      {current ? <Text style={styles.note}>{current.note}</Text> : null}
      {open ? (
        <View style={styles.chips}>
          {fixtureScenarios.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              onPress={() => select(item.key)}
              selected={item.key === scenario}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderStyle: 'dashed',
    borderWidth: strokes.hairline,
    gap: spacing[2],
    padding: spacing[4],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
    minHeight: spacing[8],
  },
  pressed: {
    opacity: 0.9,
  },
  title: {
    ...typography.body6,
    color: colors.text.primary,
    flexShrink: 1,
  },
  toggle: {
    ...typography.body7,
    color: colors.text.brand,
  },
  note: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
});
