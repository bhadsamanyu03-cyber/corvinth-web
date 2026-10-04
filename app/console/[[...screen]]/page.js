import { notFound } from 'next/navigation';
import Overview from '../ui/Overview';
import { Cases, CaseDetail, DetectionCase } from '../ui/Reports';
import ReportForm from '../ui/ReportForm';
import { Scans, NewScan, ScanDetail } from '../ui/Scans';
import ApiReference, { ApiHub } from '../ui/ApiReference';
import Integration from '../ui/Integration';
import { API_CATALOG } from '../../lib/console-catalog.mjs';

export default async function ConsolePage({ params }) {
  const { screen = [] } = await params;
  const [section, kind, id, detail] = screen;
  if (!screen.length || (screen.length === 1 && section === 'login')) return <Overview/>;
  if (section === 'report' && screen.length === 2 && ['pdq', 'pulse'].includes(kind)) return <ReportForm key={kind} kind={kind}/>;
  if (section === 'cases') {
    if (screen.length === 1) return <Cases/>;
    if (['pdq', 'pulse'].includes(kind) && id && (screen.length === 3 || (screen.length === 4 && detail === 'matches'))) return <CaseDetail key={`${kind}:${id}:${detail}`} kind={kind} reference={id} matchesOnly={detail === 'matches'}/>;
  }
  if (section === 'detections' && screen.length === 2) return <DetectionCase reference={kind}/>;
  if (section === 'scans') {
    if (screen.length === 1) return <Scans/>;
    if (screen.length === 2 && kind === 'new') return <NewScan/>;
    if (screen.length === 3 && ['storage', 'url'].includes(kind)) return <ScanDetail key={`${kind}:${id}`} kind={kind} id={id}/>;
  }
  if (section === 'api') {
    if (screen.length === 1) return <ApiHub/>;
    if (Object.hasOwn(API_CATALOG, kind) && (screen.length === 2 || (screen.length === 3 && API_CATALOG[kind].some(item => item.id === id)))) return <ApiReference family={kind} endpointId={id}/>;
  }
  if (section === 'integration' && screen.length === 1) return <Integration/>;
  notFound();
}
