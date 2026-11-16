import { java } from './helpers.js';

export default {
  summary:
    'Recursion solves a problem by solving smaller copies of the same problem. It is the foundation for trees, divide and conquer, backtracking and dynamic programming.',

  introduction: [
    'A **recursive** method is one that calls itself. Each call works on a smaller version of the problem, until it reaches a case simple enough to answer directly: the **base case**.',
    'Recursion can feel like magic at first. The trick is to trust that the recursive call correctly solves the smaller problem, and focus only on how to use that answer. Once this clicks, trees, merge sort and backtracking become much easier to write.',
  ],

  concepts: [
    {
      heading: 'Base case and recursive case',
      paragraphs: ['Every correct recursive method has two parts:'],
      points: [
        '**Base case:** the smallest input, answered without recursion (e.g. `factorial(1) = 1`).',
        '**Recursive case:** reduce the problem and call yourself (e.g. `factorial(n) = n × factorial(n − 1)`).',
        'Each call must move **closer** to the base case. Otherwise the recursion never ends.',
      ],
    },
    {
      heading: 'The call stack',
      paragraphs: [
        'Each call gets its own **stack frame** holding its parameters and local variables. Calls pile up until a base case returns, then the frames unwind in reverse order. Code written **before** the recursive call runs on the way down; code **after** it runs on the way back up.',
        'The call stack is limited. Recursing too deeply crashes the program with a **stack overflow** (Java and C++) or raises `RecursionError` (Python, after about 1000 calls by default). Very deep recursion is often rewritten as a loop.',
      ],
    },
    {
      heading: 'Recursion vs iteration',
      paragraphs: [
        'Anything recursive can be written with loops and an explicit stack, and vice versa. Recursion shines when the problem is naturally self-similar (trees, nested structures, divide and conquer). Iteration is usually better for simple counting loops because it avoids the per-call overhead.',
      ],
    },
    {
      heading: 'Backtracking',
      paragraphs: [
        'Backtracking explores choices recursively: make a choice, recurse, then **undo** the choice and try the next one. It systematically generates subsets, permutations and solutions to puzzles like Sudoku or N-Queens.',
      ],
    },
  ],

  languageNotes: {
    java: [
      "Very deep recursion throws `StackOverflowError`; the default stack allows several thousand frames for small methods.",
      "Copy lists before storing them: `result.add(new ArrayList<>(current))`.",
    ],
    cpp: [
      "Deep recursion overflows the stack and usually crashes with a segmentation fault and no helpful message.",
      "Pass containers by reference (`vector<int>&`) so each call doesn’t copy them; `push_back(current)` stores a copy automatically.",
    ],
    python: [
      "The default recursion limit is about 1000 calls (`sys.getrecursionlimit()`); exceeding it raises `RecursionError`.",
      "Store copies with `current[:]` or `list(current)`.",
      "`@functools.lru_cache` adds memoization to a recursive function in one line.",
    ],
  },

  applications: [
    { title: 'File systems', description: 'Listing every file in a folder and all its subfolders is naturally recursive.' },
    { title: 'Parsing', description: 'Compilers and JSON parsers recursively process nested expressions and objects.' },
    { title: 'Divide-and-conquer algorithms', description: 'Merge sort, quicksort and binary search split problems recursively.' },
    { title: 'Puzzle and game solvers', description: 'Backtracking solves Sudoku, mazes and move searches in games like chess.' },
  ],

  terminology: [
    { term: 'Base case', definition: 'The condition under which the method returns without recursing.' },
    { term: 'Recursive case', definition: 'The part that calls the method again on a smaller input.' },
    { term: 'Call stack', definition: 'The stack of active method calls, one frame per call.' },
    { term: 'Stack overflow', definition: 'An error raised when recursion is too deep for the available stack memory.' },
    { term: 'Recursion tree', definition: 'A diagram of all calls made, useful for estimating running time.' },
    { term: 'Backtracking', definition: 'Recursive search that undoes each choice after exploring it.' },
    { term: 'Tail recursion', definition: 'The recursive call is the very last action. Some compilers can turn it into a loop, but Java and Python never do, so don’t rely on it.' },
  ],

  examples: [
    {
      title: 'Base cases, return values and the call stack',
      description: 'Three small recursive methods. `countDownUp` shows that code before the call runs on the way down and code after it runs on the way back up.',
      code: java`
public class RecursionBasics {
    static long factorial(int n) {
        if (n <= 1) return 1;            // base case
        return n * factorial(n - 1);     // recursive case: smaller input
    }

    static int sumDigits(int n) {
        if (n < 10) return n;            // a single digit
        return n % 10 + sumDigits(n / 10);
    }

    // Prints n down to 1, then 1 back up to n
    static void countDownUp(int n) {
        if (n == 0) return;
        System.out.print(n + " ");      // runs before the recursive call
        countDownUp(n - 1);
        System.out.print(n + " ");      // runs after the call returns
    }

    public static void main(String[] args) {
        System.out.println("5! = " + factorial(5));
        System.out.println("Digit sum of 4096 = " + sumDigits(4096));
        countDownUp(3);
        System.out.println();
    }
}`,
      notes: [
        { match: 'if (n <= 1) return 1;', text: 'Without this base case the calls would never stop and Java would throw `StackOverflowError`.' },
        { match: 'return n % 10 + sumDigits(n / 10);', text: '`n % 10` is the last digit; `n / 10` drops it, which is the smaller subproblem.' },
        { match: 'System.out.print(n + " ");      // runs after', text: 'This line waits until the deeper calls finish, so the numbers print in reverse.' },
      ],
      output: '5! = 120\nDigit sum of 4096 = 19\n3 2 1 1 2 3',
      time: 'O(n) for factorial; O(digits) for sumDigits',
      space: 'O(n) call-stack depth',
    },
    {
      title: 'Backtracking: generating all subsets',
      description: 'For each element, branch on two choices: leave it out or put it in. After exploring “include”, undo it so the list is clean for the next branch.',
      code: java`
import java.util.ArrayList;
import java.util.List;

public class Subsets {
    static void generate(int[] nums, int index, List<Integer> current, List<List<Integer>> result) {
        if (index == nums.length) {
            result.add(new ArrayList<>(current));   // copy: current keeps changing
            return;
        }
        // Choice 1: skip nums[index]
        generate(nums, index + 1, current, result);
        // Choice 2: include nums[index]
        current.add(nums[index]);
        generate(nums, index + 1, current, result);
        current.remove(current.size() - 1);         // undo the choice (backtrack)
    }

    public static void main(String[] args) {
        List<List<Integer>> result = new ArrayList<>();
        generate(new int[]{1, 2, 3}, 0, new ArrayList<>(), result);
        System.out.println(result);
    }
}`,
      notes: [
        { match: 'if (index == nums.length)', text: 'Base case: a decision has been made for every element, so record this subset.' },
        { match: 'new ArrayList<>(current)', text: 'Store a copy. Storing `current` itself would leave every entry pointing at the same (eventually empty) list.' },
        { match: 'current.remove(current.size() - 1);', text: 'Undo the “include” choice before returning. This is the heart of backtracking.' },
      ],
      output: '[[], [3], [2], [2, 3], [1], [1, 3], [1, 2], [1, 2, 3]]',
      time: 'O(n · 2ⁿ): 2ⁿ subsets, each copied in O(n)',
      space: 'O(n) recursion depth (plus the output)',
    },
  ],

  algorithm: {
    title: 'Designing a recursive solution',
    steps: [
      'Define precisely what the method returns for an input, e.g. “`sumDigits(n)` returns the sum of the digits of `n`”.',
      'Find the base case(s): the smallest inputs you can answer directly.',
      'Express the answer for `n` in terms of the answer for a smaller input (the recursive case).',
      'Check that every recursive call moves strictly towards a base case.',
      'Trust the recursive call, combine its result, and return.',
      'Trace a tiny input by hand (or draw the recursion tree) to confirm it works.',
    ],
    dryRun: {
      title: 'Call stack for factorial(4)',
      lines: [
        'factorial(4) → 4 × factorial(3)',
        '  factorial(3) → 3 × factorial(2)',
        '    factorial(2) → 2 × factorial(1)',
        '      factorial(1) → 1 (base case)',
        '    returns 2 × 1 = 2',
        '  returns 3 × 2 = 6',
        'returns 4 × 6 = 24',
      ],
    },
  },

  complexity: {
    columns: ['Recursive pattern', 'Time', 'Space (stack)'],
    rows: [
      ['One call, input shrinks by 1 (factorial)', 'O(n)', 'O(n)'],
      ['One call, input halves (binary search)', 'O(log n)', 'O(log n)'],
      ['Two calls, input shrinks by 1 (naive Fibonacci)', 'O(2ⁿ)', 'O(n)'],
      ['Two calls on halves + O(n) merge (merge sort)', 'O(n log n)', 'O(n)'],
      ['Subsets via include/exclude', 'O(n · 2ⁿ)', 'O(n)'],
    ],
    note: 'Time ≈ number of calls × work per call. Space is the maximum depth of the call stack, not the total number of calls.',
  },

  mistakes: [
    { mistake: 'Missing or unreachable base case.', fix: 'Write the base case first and make sure every path reaches it.' },
    { mistake: 'Recursing on an input that doesn’t shrink (e.g. `f(n)` calls `f(n)`).', fix: 'Each call must make the problem strictly smaller.' },
    { mistake: 'Forgetting to `return` the recursive result.', fix: 'Write `return f(n - 1) + x;`, not just `f(n - 1);`.' },
    { mistake: 'Adding a shared list to the results without copying it.', fix: 'Store a copy of the current list, not the list itself.' },
    { mistake: 'Recomputing the same subproblems exponentially (naive Fibonacci).', fix: 'Cache results with memoization (see Dynamic Programming).' },
  ],

  takeaways: [
    'Every recursive method needs a base case and a recursive case that moves towards it.',
    'Each call has its own stack frame; deep recursion can overflow the stack.',
    'Trust the recursive call to solve the smaller problem and focus on combining.',
    'Backtracking = choose, explore, un-choose.',
    'Estimate cost by counting calls × work per call.',
  ],

  practice: ['fibonacci-number', 'generate-parentheses', 'climbing-stairs'],
};
