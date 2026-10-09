import { useEffect, useState } from 'react';

import { loadPersonaImage, type PersonaImageSource } from '@/api/personaImages';

export function usePersonaImage(source: PersonaImageSource, retryCount = 0) {
  const client = source.kind === 'remote' ? source.client : null;
  const path = source.kind === 'remote' ? source.path : null;
  const [state, setState] = useState<{
    uri: string | null;
    failed: boolean;
    requestKey: string;
  }>({ uri: null, failed: source.kind !== 'remote', requestKey: '' });
  const requestKey = `${path ?? 'unavailable'}:${retryCount}`;

  useEffect(() => {
    let cancelled = false;
    if (!client || !path) {
      return () => {
        cancelled = true;
      };
    }

    void loadPersonaImage({ kind: 'remote', client, path })
      .then((uri) => {
        if (!cancelled) setState({ uri, failed: false, requestKey });
      })
      .catch(() => {
        if (!cancelled) setState({ uri: null, failed: true, requestKey });
      });

    return () => {
      cancelled = true;
    };
  }, [client, path, requestKey]);

  if (!client || !path) return { uri: null, loading: false, failed: true };
  if (state.requestKey !== requestKey) return { uri: null, loading: true, failed: false };
  return { ...state, loading: false };
}
