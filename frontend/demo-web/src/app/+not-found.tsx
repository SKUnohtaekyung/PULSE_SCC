import { Redirect } from 'expo-router';

// 없는 주소로 들어오면 앱 처음으로 보낸다(시연 앱, 2026-11-15).
// 기본 화면은 앱 기둥 밖에 영어로 뜨는 Expo 안내라, 결과물을 보는 사람이 주소를 잘못 열면 앱이 아닌 페이지를 보게 된다.
// GitHub Pages는 없는 경로에 404.html(= 이 화면의 정적 빌드)을 돌려주므로 여기서 처음 화면으로 넘긴다.
export default function NotFoundRoute() {
  return <Redirect href="/" />;
}
