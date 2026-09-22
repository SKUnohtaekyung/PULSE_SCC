import { useLocalSearchParams } from 'expo-router';

import { FlowPrototype } from '@/prototypes/flow/FlowPrototype';

export default function FlowScreen() {
  const { scenario } = useLocalSearchParams<{ scenario?: string }>();
  return <FlowPrototype initialScenario={scenario === 'saved' ? 'saved' : 'first'} />;
}
