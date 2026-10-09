import { notFound } from 'next/navigation';
import Overview from '../ui/Overview';
import Pulse from '../ui/Pulse';
import { Cases, CaseDetail, DetectionCase } from '../ui/Reports';
import Detections from '../ui/Detections';
import ReportForm from '../ui/ReportForm';
import { PreparationDetail, PreparationList } from '../ui/ReferencePreparation';
import { Scans, NewScan, ScanDetail } from '../ui/Scans';
import { HistoricalScans, NewHistoricalScan, HistoricalScanDetail, StartHistoricalScan } from '../ui/HistoricalScans';
import ApiReference, { ApiHub } from '../ui/ApiReference';
import Integration from '../ui/Integration';
import { API_CATALOG } from '../../lib/console-catalog.mjs';

export default async function ConsolePage({ params }) {
  const { screen = [] } = await params;
  const [section, kind, id, detail] = screen;
  if (!screen.length || (screen.length === 1 && section === 'login')) return <Overview/>;
  if (section === 'pulse' && screen.length === 1) return <Pulse/>;
  if (section === 'report' && screen.length === 2 && ['pdq', 'pulse'].includes(kind)) return <ReportForm key={kind} kind={kind}/>;
  if (section === 'references' && screen.length === 2) return <PreparationDetail key={kind} id={kind}/>;
  if (section === 'references' && screen.length === 1) return <PreparationList/>;
  if (section === 'cases') {
    if (screen.length === 1) return <Cases/>;
    if (['pdq', 'pulse'].includes(kind) && id && (screen.length === 3 || (screen.length === 4 && detail === 'matches'))) return <CaseDetail key={`${kind}:${id}:${detail}`} kind={kind} reference={id} matchesOnly={detail === 'matches'}/>;
  }
  if (section === 'detections') {
    if (screen.length === 1) return <Detections/>;
    if (screen.length === 2) return <DetectionCase key={kind} reference={kind}/>;
  }
  if (section === 'scans') {
    if (screen.length === 1) return <HistoricalScans/>;
    if (screen.length === 2 && kind === 'new') return <NewHistoricalScan/>;
    if (screen.length === 3 && kind === 'new') return <StartHistoricalScan key={id} complaintId={id}/>;
    if (screen.length === 2 && kind === 'legacy') return <Scans/>;
    if (screen.length === 2 && kind === 'manual') return <NewScan/>;
    if (screen.length === 3 && kind === 'logical') return <HistoricalScanDetail key={id} id={id}/>;
    if (screen.length === 3 && ['storage', 'url'].includes(kind)) return <ScanDetail key={`${kind}:${id}`} kind={kind} id={id}/>;
  }
  if (section === 'api') {
    if (screen.length === 1) return <ApiHub/>;
    if (Object.hasOwn(API_CATALOG, kind) && (screen.length === 2 || (screen.length === 3 && API_CATALOG[kind].some(item => item.id === id)))) return <ApiReference family={kind} endpointId={id}/>;
  }
  if (section === 'integration' && screen.length === 1) return <Integration/>;
  notFound();
}
