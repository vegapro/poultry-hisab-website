import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from './components/ui/button';
import { HomePage } from './features/marketing/home-page';
import { TrialForm } from './features/trial/trial-form';

export default function App() {
  const [showTrial, setShowTrial] = useState(false);
  const mainAppUrl = import.meta.env.VITE_MAIN_APP_URL || '#';

  if (showTrial) return <main className="trial-page"><header className="trial-page__nav"><a className="brand" href="/">PoultryHisab</a><Button tone="ghost" onClick={() => setShowTrial(false)}><ArrowLeft size={18} /> Back to site</Button></header><TrialForm /></main>;
  return <HomePage mainAppUrl={mainAppUrl} onStartTrial={() => setShowTrial(true)} />;
}
