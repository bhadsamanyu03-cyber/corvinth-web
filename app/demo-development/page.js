import { notFound } from 'next/navigation';

export const metadata = { title: 'Demo development preview', robots: { index: false, follow: false } };

export default async function DemoDevelopmentPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { default: Preview } = await import('./Preview');
  return <Preview />;
}
