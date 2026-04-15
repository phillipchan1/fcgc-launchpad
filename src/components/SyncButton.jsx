import { useState } from 'react';

export default function SyncButton({ lastUpdated }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed top-16 right-4 z-40 text-xs text-text-dim hover:text-text transition-colors font-mono px-2 py-1 rounded border border-border bg-surface"
      >
        Synced: {lastUpdated || '—'}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <div className="bg-surface border border-border rounded-lg p-6 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-text mb-3">Sync Playbook</h3>
            <p className="text-xs text-text-dim leading-relaxed mb-4">
              To sync, run:<br />
              <code className="font-mono text-cyan">node scripts/sync-from-notion.js</code><br /><br />
              Or regenerate <code className="font-mono text-cyan">playbook.json</code> from your research repos and redeploy.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="text-xs px-3 py-1.5 bg-border rounded hover:bg-text-dim/30 transition-colors text-text"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
