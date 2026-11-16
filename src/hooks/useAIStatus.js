import { useCallback, useEffect, useState } from 'react';
import { getAIStatus } from '../services/aiApi';

/**
 * Whether the backend can reach Claude.
 * status.state: 'checking' | 'ready' | 'not_configured' | 'unavailable'
 */
export default function useAIStatus() {
  const [status, setStatus] = useState({ state: 'checking' });

  const refresh = useCallback(async () => {
    setStatus((s) => ({ ...s, state: 'checking' }));
    setStatus(await getAIStatus());
  }, []);

  useEffect(() => {
    let alive = true;
    getAIStatus().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);

  return { status, refresh };
}
