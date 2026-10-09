import ConsoleShell from './ui/ConsoleShell';
import './console.css';

export const metadata = { title: 'Console · Corvinth', robots: { index: false, follow: false } };

export default function ConsoleLayout({ children }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
