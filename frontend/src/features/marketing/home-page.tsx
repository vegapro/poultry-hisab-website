import { ArrowRight, BarChart3, BellRing, CheckCircle2, Landmark, MessageCircleMore, PackageCheck, ShieldCheck } from 'lucide-react';
import heroImage from '../../assets/poultry-farm-hero.png';
import logoImage from '../../assets/poultryhisab-logo.png';
import { Button } from '../../components/ui/button';

interface HomePageProps {
  mainAppUrl: string;
  onStartTrial: () => void;
}

const outcomes = [
  ['WhatsApp daily entry', 'Workers submit feed, mortality, eggs, and weight without another app.', MessageCircleMore],
  ['Farm health in one view', 'Owners can see shed status, feed stock, missed entries, and alerts.', BarChart3],
  ['Batch profit clarity', 'Connect chick cost, feed, expenses, sales, buyer payments, and final profit.', Landmark],
];

export function HomePage({ mainAppUrl, onStartTrial }: HomePageProps) {
  return <main>
    <section className="hero">
      <img className="hero__image" src={heroImage} alt="Farm worker checking a poultry shed" />
      <div className="hero__shade" />
      <header className="nav"><a className="brand" href="#top"><img className="brand__mark" src={logoImage} alt="PoultryHisab logo" /> <span>PoultryHisab</span></a><nav><a href="#how-it-works">How it works</a><a href="#results">For owners</a><a className="nav__login" href={mainAppUrl}>Login</a><Button onClick={onStartTrial}>Start free trial <ArrowRight size={17} /></Button></nav></header>
      <div className="hero__content" id="top"><p className="eyebrow eyebrow--light">Poultry farm operations, made visible</p><h1>Know what is happening in every shed. Know what every batch earns.</h1><p>Workers enter daily farm data on WhatsApp. You see feed, mortality, missing entries, payments, and final batch profit in one place.</p><div className="hero__actions"><Button onClick={onStartTrial}>Start free trial <ArrowRight size={18} /></Button><a className="text-link text-link--light" href="#how-it-works">See the workflow</a></div></div>
    </section>

    <section className="value-band" id="results"><div><CheckCircle2 size={22} /><span>WhatsApp-first worker workflow</span></div><div><ShieldCheck size={22} /><span>Owner-controlled business records</span></div><div><PackageCheck size={22} /><span>Actual FIFO feed costing</span></div></section>

    <section className="section section--intro" id="how-it-works"><div className="section-label">Built for the daily reality of a poultry farm</div><div className="intro-layout"><h2>Less follow-up. Better stock control. Clear batch economics.</h2><p>Daily entries should not live in calls, notebooks, and scattered chats. PoultryHisab brings operational data and commercial records together so the owner can act before a missed entry, low feed stock, or pending payment becomes a bigger problem.</p></div><div className="outcome-grid">{outcomes.map(([title, description, Icon]) => <article key={title as string} className="outcome"><Icon size={25} /><h3>{title as string}</h3><p>{description as string}</p></article>)}</div></section>

    <section className="section workflow"><div className="workflow__copy"><p className="eyebrow">From WhatsApp to business decision</p><h2>Daily farm work becomes a clear owner picture.</h2><ol><li><span>01</span> Worker receives a reminder and submits a shed entry on WhatsApp.</li><li><span>02</span> Owner dashboard shows live stock, mortality, and missing entries.</li><li><span>03</span> Owner records sales, expenses, and buyer payments.</li><li><span>04</span> Batch close shows actual cost, revenue, pending payment, and profit.</li></ol></div><div className="workflow__signals"><article><BellRing size={24} /><p>Low feed and high mortality alerts help owners react early.</p></article><article><MessageCircleMore size={24} /><p>Workers can use Hinglish or proper Hindi on WhatsApp.</p></article><article><Landmark size={24} /><p>Track who bought, what was received, and what remains pending.</p></article></div></section>

    <section className="trial-cta"><div><p className="eyebrow eyebrow--light">Ready to organise your farm data?</p><h2>Start with your sheds, workers, and current batch.</h2></div><Button onClick={onStartTrial}>Start free trial <ArrowRight size={18} /></Button></section>
  </main>;
}
