import { java } from './helpers.js';

export default {
  summary:
    'A stack is a pile: you add and remove only at the top. That simple Last-In-First-Out rule powers undo buttons, the call stack and expression parsing.',

  introduction: [
    'A **stack** is a collection where the last element added is the first one removed: **LIFO** (Last In, First Out). Think of a stack of plates: you put plates on top and take them from the top.',
    'Stacks support three core operations, all in O(1): **push** (add to the top), **pop** (remove the top) and **peek** (look at the top without removing it). Whenever a problem involves “the most recent unfinished thing”, a stack is usually the answer.',
  ],

  concepts: [
    {
      heading: 'LIFO behaviour',
      paragraphs: [
        'Because only the top is accessible, the order of removal is the reverse of the order of insertion. Pushing A, B, C and then popping three times gives C, B, A. That makes stacks a natural tool for reversing sequences and for matching nested structures.',
      ],
    },
    {
      heading: 'Implementations',
      paragraphs: [],
      points: [
        '**Array-based:** keep an array and an index `top`. Push writes at `++top`; pop reads at `top--`. Very fast, with a fixed or growable capacity.',
        '**Linked-list-based:** push and pop at the head of a linked list. No capacity limit.',
        'Every language ships one, so you rarely build your own (see the notes for your language below).',
      ],
    },
    {
      heading: 'Overflow and underflow',
      paragraphs: [
        'Pushing onto a full fixed-size stack is **overflow**; popping from an empty stack is **underflow**. Always check that the stack isn’t empty before popping.',
      ],
    },
    {
      heading: 'Monotonic stacks',
      paragraphs: [
        'A **monotonic stack** keeps its elements in increasing or decreasing order by popping anything that breaks the order. It answers “next greater element” style questions for every position in O(n) total, because each element is pushed and popped at most once.',
      ],
    },
  ],

  languageNotes: {
    java: [
      "Use `ArrayDeque<Integer>` as a stack: `push`, `pop`, `peek`. The legacy `Stack` class is synchronised and slower.",
      "`pop()` on an empty `ArrayDeque` throws `NoSuchElementException`.",
      "Don’t mix stack methods (`push`/`pop`) with queue methods (`offer`/`poll`) on the same deque: they work at different ends.",
    ],
    cpp: [
      "`std::stack<int>` provides `push`, `pop`, `top`, `empty` and `size`.",
      "`pop()` returns nothing, so read `top()` first. Calling either on an empty stack is undefined behaviour.",
      "A `std::vector` with `push_back` / `pop_back` / `back` works as a stack too.",
    ],
    python: [
      "A plain `list` is the stack: `append` to push, `pop()` to pop, `stack[-1]` to peek.",
      "`pop()` on an empty list raises `IndexError`.",
      "Never use `pop(0)` or `insert(0, x)` for a stack: they are O(n).",
    ],
  },

  applications: [
    { title: 'Undo / redo', description: 'Each action is pushed; undo pops the most recent one (and pushes it onto a redo stack).' },
    { title: 'Function calls', description: 'The JVM call stack stores a frame for each active method call.' },
    { title: 'Syntax checking', description: 'Editors and compilers match brackets, tags and blocks with a stack.' },
    { title: 'Expression evaluation', description: 'Calculators convert and evaluate expressions (e.g. postfix notation) using stacks.' },
  ],

  terminology: [
    { term: 'LIFO', definition: 'Last In, First Out: the most recently added element is removed first.' },
    { term: 'Push', definition: 'Add an element to the top.' },
    { term: 'Pop', definition: 'Remove and return the top element.' },
    { term: 'Peek / top', definition: 'Return the top element without removing it.' },
    { term: 'Underflow', definition: 'Attempting to pop or peek an empty stack.' },
    { term: 'Overflow', definition: 'Attempting to push onto a full, fixed-capacity stack.' },
    { term: 'Monotonic stack', definition: 'A stack kept in sorted order, used for next-greater/smaller problems.' },
  ],

  examples: [
    {
      title: 'Array-based stack',
      description: 'A minimal stack built on an array, with explicit overflow and underflow checks.',
      code: java`
public class ArrayStack {
    private final int[] data;
    private int top = -1;              // index of the top element; -1 = empty

    ArrayStack(int capacity) { data = new int[capacity]; }

    void push(int value) {
        if (top == data.length - 1) throw new IllegalStateException("Stack overflow");
        data[++top] = value;
    }

    int pop() {
        if (isEmpty()) throw new IllegalStateException("Stack underflow");
        return data[top--];
    }

    int peek() {
        if (isEmpty()) throw new IllegalStateException("Stack is empty");
        return data[top];
    }

    boolean isEmpty() { return top == -1; }

    public static void main(String[] args) {
        ArrayStack stack = new ArrayStack(5);
        stack.push(10);
        stack.push(20);
        stack.push(30);
        System.out.println("Peek: " + stack.peek());
        System.out.println("Pop: " + stack.pop());
        System.out.println("Pop: " + stack.pop());
        System.out.println("Empty? " + stack.isEmpty());
    }
}`,
      notes: [
        { match: 'private int top = -1;', text: '`top` is the index of the current top element, so `-1` means the stack is empty.' },
        { match: 'data[++top] = value;', text: 'Pre-increment: move `top` up first, then write into the new slot.' },
        { match: 'return data[top--];', text: 'Post-decrement: read the top value, then move `top` down.' },
      ],
      output: 'Peek: 30\nPop: 30\nPop: 20\nEmpty? false',
      time: 'push, pop, peek, isEmpty: O(1)',
      space: 'O(capacity)',
    },
    {
      title: 'Balanced brackets',
      description: 'Push every opening bracket; each closing bracket must match the most recent unclosed opening bracket, which is the top of the stack.',
      code: java`
import java.util.ArrayDeque;
import java.util.Deque;

public class BalancedBrackets {
    // Assumes s contains only bracket characters
    static boolean isBalanced(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;     // closing with nothing open
                char open = stack.pop();
                if ((c == ')' && open != '(') ||
                    (c == ']' && open != '[') ||
                    (c == '}' && open != '{')) {
                    return false;                      // wrong type of bracket
                }
            }
        }
        return stack.isEmpty();                        // anything left is unclosed
    }

    public static void main(String[] args) {
        System.out.println(isBalanced("{[()]}"));
        System.out.println(isBalanced("([)]"));
        System.out.println(isBalanced("(("));
    }
}`,
      notes: [
        { match: 'Deque<Character> stack = new ArrayDeque<>();', text: '`ArrayDeque` is the recommended stack in modern Java.' },
        { match: 'if (stack.isEmpty()) return false;', text: 'Guards against underflow and handles input like ")(".' },
        { match: 'return stack.isEmpty();', text: 'Leftover opening brackets mean the string is unbalanced, e.g. "((".' },
      ],
      output: 'true\nfalse\nfalse',
      time: 'O(n)',
      space: 'O(n) in the worst case (all opening brackets)',
    },
  ],

  algorithm: {
    title: 'Checking balanced brackets',
    steps: [
      'Create an empty stack.',
      'Scan the string from left to right.',
      'If the character is an opening bracket, push it.',
      'If it is a closing bracket: if the stack is empty, return false. Otherwise pop the top and check that it is the matching opening bracket; if not, return false.',
      'After the scan, return true only if the stack is empty.',
    ],
    dryRun: {
      title: 'Dry run with "{[()]}"',
      lines: [
        "'{' push → [ { ]",
        "'[' push → [ {, [ ]",
        "'(' push → [ {, [, ( ]",
        "')' pop '(' ✓ → [ {, [ ]",
        "']' pop '[' ✓ → [ { ]",
        "'}' pop '{' ✓ → [ ] → empty, return true",
      ],
    },
  },

  complexity: {
    columns: ['Operation', 'Time', 'Notes'],
    rows: [
      ['push', 'O(1)', 'Amortised O(1) for a growable array'],
      ['pop', 'O(1)', ''],
      ['peek', 'O(1)', ''],
      ['isEmpty / size', 'O(1)', ''],
      ['search for a value', 'O(n)', 'Stacks are not built for searching'],
    ],
    note: 'A stack holding n elements uses O(n) space.',
  },

  mistakes: [
    { mistake: 'Popping without checking whether the stack is empty.', fix: 'Check `isEmpty()` first, or handle the exception deliberately.' },
    { mistake: 'Using a stack when the problem needs the oldest item first.', fix: 'That is FIFO behaviour: use a queue instead.' },
    { mistake: 'Pushing and popping at the front of an array-based list.', fix: 'Every operation shifts all elements: O(n). Push and pop at the end instead.' },
    { mistake: 'Returning true without checking that the stack is empty at the end.', fix: 'Unmatched opening brackets remain on the stack, so check it.' },
  ],

  takeaways: [
    'Stacks are LIFO: push, pop and peek in O(1).',
    'Use a stack whenever you need “the most recent unfinished item”.',
    'Use your language’s built-in stack: `ArrayDeque`, `std::stack` or a Python list.',
    'Matching brackets, undo history and the call stack are classic stack uses.',
    'Monotonic stacks solve next-greater-element problems in O(n).',
  ],

  practice: ['valid-parentheses', 'daily-temperatures'],
};
