/**
 * DSA curriculum: the 16 topics in learning order.
 * This file holds metadata only. The lesson content for each topic lives in
 * src/data/lessons/<id>.js, and learner progress lives in
 * LearningProgressContext (saved to localStorage).
 */
import {
  Terminal,
  Brackets,
  Type,
  Search,
  ArrowUpDown,
  Link2,
  Layers,
  Rows3,
  Repeat,
  Hash,
  Network,
  GitFork,
  Triangle,
  Share2,
  Coins,
  Grid3x3,
} from 'lucide-react';

export const LEVELS = [
  {
    id: 'Beginner',
    title: 'Beginner',
    description: 'Build your foundation: core syntax, linear data structures and the classic search and sort algorithms.',
  },
  {
    id: 'Intermediate',
    title: 'Intermediate',
    description: 'Pointer-based structures, LIFO/FIFO thinking, hashing and hierarchical data.',
  },
  {
    id: 'Advanced',
    title: 'Advanced',
    description: 'Priority structures, graph algorithms and the problem-solving strategies interviews love.',
  },
];

const topics = [
  {
    id: 'fundamentals',
    name: 'Programming Fundamentals',
    description: 'Variables, types, loops, methods and Big-O: the toolkit every algorithm is built from.',
    icon: Terminal,
    tone: 'slate',
    level: 'Beginner',
    readingTime: 15,
    keywords: ['variables', 'loops', 'methods', 'big o', 'overflow', 'java basics'],
  },
  {
    id: 'arrays',
    name: 'Arrays',
    description: 'Indexing, insertion and deletion, two pointers and prefix sums.',
    icon: Brackets,
    tone: 'indigo',
    level: 'Beginner',
    readingTime: 18,
    keywords: ['index', 'two pointers', 'prefix sum', 'contiguous', 'shift'],
  },
  {
    id: 'strings',
    name: 'Strings',
    description: 'Immutability, StringBuilder, palindromes and character counting.',
    icon: Type,
    tone: 'blue',
    level: 'Beginner',
    readingTime: 16,
    keywords: ['palindrome', 'anagram', 'stringbuilder', 'immutable', 'characters'],
  },
  {
    id: 'searching',
    name: 'Searching Algorithms',
    description: 'Linear search, binary search and the lower-bound pattern.',
    icon: Search,
    tone: 'cyan',
    level: 'Beginner',
    readingTime: 16,
    keywords: ['linear search', 'binary search', 'lower bound', 'logarithmic'],
  },
  {
    id: 'sorting',
    name: 'Sorting Algorithms',
    description: 'Bubble, selection, insertion and merge sort, plus stability.',
    icon: ArrowUpDown,
    tone: 'green',
    level: 'Beginner',
    readingTime: 22,
    keywords: ['bubble sort', 'selection sort', 'insertion sort', 'merge sort', 'stable', 'quick sort'],
  },
  {
    id: 'recursion',
    name: 'Recursion',
    description: 'Base cases, the call stack and backtracking.',
    icon: Repeat,
    tone: 'violet',
    level: 'Beginner',
    readingTime: 18,
    keywords: ['base case', 'call stack', 'backtracking', 'subsets', 'factorial'],
  },
  {
    id: 'linked-lists',
    name: 'Linked Lists',
    description: 'Nodes and pointers, reversal and fast/slow pointers.',
    icon: Link2,
    tone: 'violet',
    level: 'Intermediate',
    readingTime: 18,
    keywords: ['node', 'pointer', 'reverse', 'fast slow', 'singly', 'doubly'],
  },
  {
    id: 'stacks',
    name: 'Stacks',
    description: 'Last in, first out: push, pop and bracket matching.',
    icon: Layers,
    tone: 'amber',
    level: 'Intermediate',
    readingTime: 14,
    keywords: ['lifo', 'push', 'pop', 'peek', 'brackets', 'undo'],
  },
  {
    id: 'queues',
    name: 'Queues',
    description: 'First in, first out: circular queues and deques.',
    icon: Rows3,
    tone: 'cyan',
    level: 'Intermediate',
    readingTime: 14,
    keywords: ['fifo', 'enqueue', 'dequeue', 'circular', 'deque'],
  },
  {
    id: 'hashing',
    name: 'Hashing',
    description: 'Hash functions, collisions, HashMap and HashSet.',
    icon: Hash,
    tone: 'rose',
    level: 'Intermediate',
    readingTime: 16,
    keywords: ['hashmap', 'hashset', 'collision', 'hash function', 'frequency', 'chaining'],
  },
  {
    id: 'trees',
    name: 'Trees',
    description: 'Binary trees, traversals and recursive tree thinking.',
    icon: Network,
    tone: 'green',
    level: 'Intermediate',
    readingTime: 18,
    keywords: ['binary tree', 'preorder', 'inorder', 'postorder', 'level order', 'height'],
  },
  {
    id: 'bst',
    name: 'Binary Search Trees',
    description: 'Ordered trees: search, insert, delete and validation.',
    icon: GitFork,
    tone: 'blue',
    level: 'Intermediate',
    readingTime: 16,
    keywords: ['bst', 'inorder successor', 'delete', 'balanced', 'treemap'],
  },
  {
    id: 'heaps',
    name: 'Heaps',
    description: 'Priority queues, sift up/down and top-k problems.',
    icon: Triangle,
    tone: 'orange',
    level: 'Advanced',
    readingTime: 16,
    keywords: ['priority queue', 'min heap', 'max heap', 'heapify', 'top k'],
  },
  {
    id: 'graphs',
    name: 'Graphs',
    description: 'Representations, BFS, DFS and shortest paths.',
    icon: Share2,
    tone: 'rose',
    level: 'Advanced',
    readingTime: 22,
    keywords: ['bfs', 'dfs', 'dijkstra', 'adjacency list', 'shortest path', 'vertex', 'edge'],
  },
  {
    id: 'greedy',
    name: 'Greedy Algorithms',
    description: 'Locally best choices, and when they are globally best.',
    icon: Coins,
    tone: 'amber',
    level: 'Advanced',
    readingTime: 14,
    keywords: ['activity selection', 'coin change', 'interval', 'greedy choice'],
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    description: 'Overlapping subproblems, memoization and tabulation.',
    icon: Grid3x3,
    tone: 'orange',
    level: 'Advanced',
    readingTime: 24,
    keywords: ['memoization', 'tabulation', 'knapsack', 'lcs', 'fibonacci', 'dp'],
  },
];

export default topics;

/** Find a topic by its URL id. Returns undefined when not found. */
export function getTopicById(id) {
  return topics.find((topic) => topic.id === id);
}

/** 0-based position of a topic in the learning path. */
export function getTopicIndex(id) {
  return topics.findIndex((topic) => topic.id === id);
}
