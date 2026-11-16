/**
 * The 10 sections every lesson page contains, in display order.
 * Progress is tracked per section, so a topic is complete when all are read.
 */
import {
  BookOpen,
  Lightbulb,
  Globe,
  Tags,
  Code2,
  ListOrdered,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Target,
} from 'lucide-react';

const LESSON_SECTIONS = [
  { key: 'introduction', title: 'Introduction', icon: BookOpen },
  { key: 'concepts', title: 'Concept Explanation', icon: Lightbulb },
  { key: 'applications', title: 'Real-World Applications', icon: Globe },
  { key: 'terminology', title: 'Important Terminology', icon: Tags },
  { key: 'code', title: 'Code Examples', icon: Code2 },
  { key: 'algorithm', title: 'Step-by-Step Algorithm', icon: ListOrdered },
  { key: 'complexity', title: 'Time & Space Complexity', icon: Gauge },
  { key: 'mistakes', title: 'Common Mistakes', icon: AlertTriangle },
  { key: 'takeaways', title: 'Key Takeaways', icon: CheckCircle2 },
  { key: 'practice', title: 'Practice Questions', icon: Target },
];

export const SECTION_KEYS = LESSON_SECTIONS.map((s) => s.key);
export const SECTIONS_PER_TOPIC = LESSON_SECTIONS.length;

export function getSectionTitle(key) {
  return LESSON_SECTIONS.find((s) => s.key === key)?.title ?? key;
}

export default LESSON_SECTIONS;
