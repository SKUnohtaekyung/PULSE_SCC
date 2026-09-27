import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { colors, layout, radii, spacing, typography } from '@/design/tokens';

// 확인 대화상자. 되돌릴 수 없는 행동의 최종 확인에 쓴다(DESIGN_SYSTEM §5.4).
// 최종 확인 버튼만 destructive를 쓰고, 취소는 언제나 있다.

export type DialogAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'destructive';
  loading?: boolean;
  loadingLabel?: string;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  actions,
  onDismiss,
}: {
  visible: boolean;
  title: string;
  message?: string;
  actions: DialogAction[];
  onDismiss: () => void;
}) {
  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={onDismiss}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      {/* 배경과 본문 래퍼는 접근성 초점을 갖지 않는다. 가지면 안쪽 제목·버튼이 개별 초점을 받지 못한다.
          초점을 받지 않는 노드에는 role을 두지 않는다. 읽히지 않는다. */}
      <Pressable accessible={false} onPress={onDismiss} style={styles.backdrop}>
        {/* 본문은 터치를 삼킨다. 핸들러 없는 View로 두면 배경의 onPress가 발화해 눌러도 닫힌다. */}
        <Pressable accessible={false} onPress={() => undefined} style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            {actions.map((action) =>
              action.variant === 'destructive' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: action.loading, busy: action.loading }}
                  disabled={action.loading}
                  key={action.label}
                  onPress={action.onPress}
                  style={({ pressed }) => [styles.destructive, pressed && styles.pressed]}
                >
                  <Text style={styles.destructiveLabel}>
                    {action.loading ? (action.loadingLabel ?? action.label) : action.label}
                  </Text>
                </Pressable>
              ) : (
                <Button
                  key={action.label}
                  label={action.label}
                  loading={action.loading}
                  loadingLabel={action.loadingLabel}
                  onPress={action.onPress}
                  variant={action.variant ?? 'ghost'}
                />
              ),
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.brand.strongOverlay,
    justifyContent: 'center',
    padding: spacing[5],
  },
  dialog: {
    width: '100%',
    maxWidth: layout.readingMaxWidth,
    backgroundColor: colors.background.surface,
    borderRadius: radii.panel,
    gap: spacing[3],
    padding: spacing[5],
  },
  title: {
    ...typography.head5,
    color: colors.text.strong,
  },
  message: {
    ...typography.body7,
    color: colors.text.primary,
  },
  actions: {
    gap: spacing[2],
    paddingTop: spacing[2],
  },
  destructive: {
    alignItems: 'center',
    backgroundColor: colors.destructive.primary,
    borderRadius: radii.control,
    justifyContent: 'center',
    minHeight: layout.touchTargetMin,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  destructiveLabel: {
    ...typography.buttonMain,
    color: colors.destructive.onPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
});
