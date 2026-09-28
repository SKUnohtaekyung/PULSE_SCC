// 보드를 만드는 쪽(generate.mjs)과 검사하는 쪽(check.mjs)이 같이 쓰는 값.
// 글자 폭 근사식이 둘로 갈라지면 검사가 조용히 무의미해진다.

export const PHONE_W = 360;
export const PHONE_H = 800;

/** 글자 폭 근사: 한글·전각은 글자 크기, 라틴·숫자는 0.56배. */
export const measure = (value, size) =>
  [...String(value)].reduce(
    (sum, ch) => sum + (/[ᄀ-ᇿ㄰-㆏가-힯　-〿·—…]/.test(ch) ? size : size * 0.56),
    0,
  );
