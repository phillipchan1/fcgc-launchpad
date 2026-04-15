import { useState, useEffect } from 'react';

export function usePlaybook() {
  const [playbook, setPlaybook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/playbook.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setPlaybook)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { playbook, loading, error };
}
