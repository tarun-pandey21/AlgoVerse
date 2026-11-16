/**
 * AlgoVerse's AI features. Each one calls Claude through our own backend
 * (server/routes/ai.js); the overview cards link to the feature pages.
 */
import { Bot, FileCode2, Gauge, Wand2, Route } from 'lucide-react';

const aiFeatures = [
  {
    id: 'ai-tutor',
    title: 'AI DSA Tutor',
    description: 'Ask questions in plain language and get step-by-step explanations, code in your language, and hints before solutions.',
    icon: Bot,
    tone: 'indigo',
    path: '/ai-tutor',
  },
  {
    id: 'code-reviewer',
    title: 'AI Code Reviewer',
    description: 'Find bugs and logical mistakes, and get feedback on readability and coding practices in Java, C++ or Python.',
    icon: FileCode2,
    tone: 'blue',
    path: '/code-analyzer',
  },
  {
    id: 'complexity-analyzer',
    title: 'Complexity Analyzer',
    description: 'Estimate the time and space complexity of your code, with the reasoning and possible optimizations.',
    icon: Gauge,
    tone: 'green',
    path: '/code-analyzer?mode=complexity',
  },
  {
    id: 'question-generator',
    title: 'AI Question Generator',
    description: 'Generate original practice problems by topic, difficulty and language, with examples, constraints and hints.',
    icon: Wand2,
    tone: 'violet',
    path: '/ai-questions',
  },
  {
    id: 'ai-roadmap',
    title: 'Personalized AI Roadmap',
    description: 'A week-by-week study plan built from your real lesson progress, solved problems and weak areas.',
    icon: Route,
    tone: 'amber',
    path: '/ai-roadmap',
  },
];

export default aiFeatures;
