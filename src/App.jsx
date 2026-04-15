import { useState, useCallback } from 'react';
import { usePlaybook } from './hooks/usePlaybook';
import { useMarketData } from './hooks/useMarketData';
import { useSessionClock } from './hooks/useSessionClock';
import Header from './components/Header';
import SyncButton from './components/SyncButton';
import PreMarketPanel from './components/PreMarketPanel';
import LevelGrid from './components/LevelGrid';
import MacroWindows from './components/MacroWindows';
import SetupCards from './components/SetupCards';
import FVGCChecklist from './components/FVGCChecklist';

export default function App() {
  const { playbook, loading: pbLoading, error: pbError } = usePlaybook();
  const { data: marketData, loading: mdLoading, error: mdError } = useMarketData();
  const clock = useSessionClock(playbook);

  const [inputs, setInputs] = useState(null);
  const [checklistSetup, setChecklistSetup] = useState(null);

  const handleConfirm = useCallback((data) => {
    setInputs(data);
  }, []);

  const handleSignalFired = useCallback((combo) => {
    setChecklistSetup(combo);
  }, []);

  const handleCloseChecklist = useCallback(() => {
    setChecklistSetup(null);
  }, []);

  if (pbLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="font-mono text-sm text-text-dim">Loading playbook...</span>
      </div>
    );
  }

  if (pbError) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="font-mono text-sm text-red">Error: {pbError}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header
        currentTime={clock.currentTime}
        sessionState={clock.sessionState}
        timeUntilNext={clock.timeUntilNext}
      />

      <SyncButton lastUpdated={playbook?.last_updated} />

      <main className="pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 max-w-[1600px] mx-auto">
          {/* Left column */}
          <div className="md:col-span-4">
            <PreMarketPanel
              playbook={playbook}
              marketData={marketData}
              onConfirm={handleConfirm}
            />
            {mdError && (
              <p className="text-[10px] text-yellow-400 mt-2 px-1">
                Auto-fill unavailable — enter manually
              </p>
            )}
          </div>

          {/* Center column */}
          <div className="md:col-span-5 space-y-4">
            <LevelGrid playbook={playbook} inputs={inputs} marketData={marketData} />
            <SetupCards
              playbook={playbook}
              inputs={inputs}
              activeMacroWindow={clock.activeMacroWindow}
              onSignalFired={handleSignalFired}
            />
          </div>

          {/* Right column */}
          <div className="md:col-span-3">
            <MacroWindows
              playbook={playbook}
              inputs={inputs}
              sessionState={clock.sessionState}
              activeMacroWindow={clock.activeMacroWindow}
              timeUntilNext={clock.timeUntilNext}
            />
          </div>
        </div>
      </main>

      {checklistSetup && (
        <FVGCChecklist
          setup={checklistSetup}
          playbook={playbook}
          onClose={handleCloseChecklist}
        />
      )}
    </div>
  );
}
