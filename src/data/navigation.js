/**
 * Sidebar navigation, grouped into sections.
 * `end: true` means the link is only active on an exact path match.
 */
import {
  LayoutDashboard,
  BookOpen,
  Code2,
  Bot,
  ScanSearch,
  Map,
  Wand2,
  BarChart3,
  Settings,
} from 'lucide-react';

export const navSections = [
  {
    title: 'Learn',
    items: [
      { label: 'Overview', path: '/', icon: LayoutDashboard, end: true },
      { label: 'Learn DSA', path: '/learn', icon: BookOpen },
      { label: 'Practice Problems', path: '/practice', icon: Code2 },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      { label: 'AI Tutor', path: '/ai-tutor', icon: Bot },
      { label: 'Code Analyzer', path: '/code-analyzer', icon: ScanSearch },
      { label: 'Question Generator', path: '/ai-questions', icon: Wand2 },
      { label: 'AI Roadmap', path: '/ai-roadmap', icon: Map },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'My Progress', path: '/progress', icon: BarChart3 },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

/** Flat list – handy for looking up the current page title. */
export const navItems = navSections.flatMap((section) => section.items);
