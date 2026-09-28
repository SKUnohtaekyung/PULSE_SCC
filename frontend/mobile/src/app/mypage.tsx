import { Redirect } from 'expo-router';

import { MyPageScreen } from '@/features/mypage/MyPageScreen';
import { useSession } from '@/session/SessionProvider';

export default function MyPageRoute() {
  const { phase } = useSession();
  if (phase !== 'signedIn') return <Redirect href="/" />;
  return <MyPageScreen />;
}
