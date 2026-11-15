import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { appMaxWidth } from '@/demo/appFrame';

// 팝업(Modal)을 앱 기둥 안에만 띄운다(시연 앱, 2026-11-15).
// 웹의 Modal은 앱 기둥이 아니라 브라우저 창 전체에 붙는다. 그대로 두면 PC에서 어두운 덮개가 창 전체를 덮고
// 대화상자가 휴대폰 폭보다 넓어져 "앱"이 아니라 웹 페이지처럼 보인다.
// 바깥(PC 배경)은 그대로 비워 두고, 덮개·대화상자는 가운데 휴대폰 폭 기둥 안에서만 그린다. 휴대폰에서는 화면 전체와 같다.
export function ModalColumn({ children }: { children: ReactNode }) {
  return (
    <View style={styles.window}>
      <View style={styles.column}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  window: {
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: appMaxWidth,
  },
});
