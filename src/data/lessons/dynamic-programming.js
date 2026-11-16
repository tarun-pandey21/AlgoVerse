import { java } from './helpers.js';

export default {
  summary:
    'Dynamic programming solves problems with overlapping subproblems by solving each subproblem once and reusing the answer, turning exponential brute force into polynomial time.',

  introduction: [
    '**Dynamic programming (DP)** is a technique for problems that break into smaller subproblems which **repeat**. Instead of recomputing the same subproblem again and again, you store each answer the first time and look it up afterwards.',
    'Naive recursive Fibonacci makes over a billion calls for `fib(45)`; with DP it takes 45 steps. DP has a reputation for being hard, but most problems follow the same recipe: define the state, write the recurrence, set the base cases, and choose an order to fill the table.',
  ],

  concepts: [
    {
      heading: 'Overlapping subproblems and optimal substructure',
      paragraphs: ['DP applies when a problem has both:'],
      points: [
        '**Overlapping subproblems:** the same smaller problems are solved many times (fib(3) is needed by fib(4) and fib(5)).',
        '**Optimal substructure:** the best answer can be built from best answers to subproblems.',
      ],
    },
    {
      heading: 'Top-down: memoization',
      paragraphs: [
        'Write the natural recursive solution, then add a cache. Before computing, check whether the answer is already stored; after computing, store it. It is easy to derive from recursion and only computes the states that are actually needed.',
      ],
    },
    {
      heading: 'Bottom-up: tabulation',
      paragraphs: [
        'Create a table (`dp` array) and fill it iteratively from the smallest subproblems up, so every value you need has already been computed. There is no recursion (so no stack overflow), and it is often easy to reduce memory by keeping only the rows you still need.',
      ],
    },
    {
      heading: 'Defining the state',
      paragraphs: [
        'The hardest step is deciding what `dp[i]` (or `dp[i][j]`) **means**. Write it in a full sentence, e.g. “`dp[a]` = the fewest coins that make amount `a`” or “`dp[i][j]` = length of the LCS of the first `i` characters of A and the first `j` of B”. A clear definition makes the recurrence almost write itself.',
      ],
    },
  ],

  languageNotes: {
    java: [
      "Use `long` for large results (Fibonacci overflows `int` at n = 47) and fill memo arrays with `Arrays.fill(memo, -1)`.",
      "Memoize with an array or a `HashMap`; deep top-down recursion can overflow the stack.",
    ],
    cpp: [
      "Use `long long` for large values. 2D table: `vector<vector<int>> dp(m + 1, vector<int>(n + 1))`.",
      "Deep top-down recursion can overflow the stack; bottom-up avoids it.",
    ],
    python: [
      "`@functools.lru_cache(maxsize=None)` (or `@functools.cache`) memoizes a function in one line.",
      "Build 2D tables with a comprehension: `[[0] * (n + 1) for _ in range(m + 1)]`, never `[[0] * (n + 1)] * (m + 1)`.",
      "Python ints never overflow, but top-down recursion is limited to about 1000 levels.",
    ],
  },

  applications: [
    { title: 'Diff tools and version control', description: 'Longest common subsequence powers `diff` and the line-by-line comparison in Git.' },
    { title: 'Spell check and DNA alignment', description: 'Edit distance measures how similar two words or genetic sequences are.' },
    { title: 'Resource allocation', description: 'Knapsack-style DP chooses the best set of projects or ads within a budget.' },
    { title: 'Route planning and finance', description: 'Shortest paths with constraints and option pricing models are solved with DP.' },
  ],

  terminology: [
    { term: 'State', definition: 'The parameters that identify a subproblem, e.g. `dp[i][j]`.' },
    { term: 'Recurrence / transition', definition: 'The formula computing a state from smaller states.' },
    { term: 'Base case', definition: 'The smallest states, whose values are known directly.' },
    { term: 'Memoization', definition: 'Top-down DP: recursion plus a cache of computed results.' },
    { term: 'Tabulation', definition: 'Bottom-up DP: filling a table iteratively from the base cases.' },
    { term: 'Space optimisation', definition: 'Keeping only the previous row(s) of the table when that is all the recurrence needs.' },
  ],

  examples: [
    {
      title: 'Fibonacci three ways',
      description: 'The same problem solved with memoization, tabulation and constant-space iteration. All three are O(n) time, unlike the O(2ⁿ) naive recursion.',
      code: java`
import java.util.Arrays;

public class FibonacciDP {
    static long[] memo = new long[91];

    // Top-down: recursion + cache
    static long fibMemo(int n) {
        if (n <= 1) return n;
        if (memo[n] != -1) return memo[n];          // already solved
        return memo[n] = fibMemo(n - 1) + fibMemo(n - 2);
    }

    // Bottom-up: fill a table from the smallest subproblem
    static long fibTable(int n) {
        if (n <= 1) return n;
        long[] dp = new long[n + 1];
        dp[1] = 1;
        for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
        return dp[n];
    }

    // Only the last two values are ever needed
    static long fibOptimized(int n) {
        if (n == 0) return 0;
        long prev = 0, curr = 1;
        for (int i = 2; i <= n; i++) {
            long next = prev + curr;
            prev = curr;
            curr = next;
        }
        return curr;
    }

    public static void main(String[] args) {
        Arrays.fill(memo, -1);
        System.out.println("fibMemo(50)      = " + fibMemo(50));
        System.out.println("fibTable(50)     = " + fibTable(50));
        System.out.println("fibOptimized(90) = " + fibOptimized(90));
    }
}`,
      notes: [
        { match: 'if (memo[n] != -1) return memo[n];', text: 'The memo check: each state is computed only once, collapsing 2ⁿ calls into n.' },
        { match: 'for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];', text: 'Bottom-up order guarantees both smaller values exist before they are used.' },
        { match: 'long next = prev + curr;', text: 'Keeping just two variables cuts space from O(n) to O(1).' },
        { match: 'static long[] memo = new long[91];', text: '`long` is needed: fib(47) already exceeds the `int` range.' },
      ],
      output: 'fibMemo(50)      = 12586269025\nfibTable(50)     = 12586269025\nfibOptimized(90) = 2880067194370816120',
      time: 'O(n) for all three',
      space: 'O(n) for memo and table; O(1) optimised',
    },
    {
      title: 'Coin change and longest common subsequence',
      description: 'A 1D DP that fixes the greedy coin problem, and the classic 2D DP behind diff tools.',
      code: java`
import java.util.Arrays;

public class DPClassics {
    // dp[a] = fewest coins that make amount a
    static int minCoins(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);          // "infinity": more than any real answer
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int coin : coins) {
                if (coin <= a) {
                    dp[a] = Math.min(dp[a], dp[a - coin] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }

    // dp[i][j] = LCS length of a's first i chars and b's first j chars
    static int lcs(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;        // characters match
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        return dp[a.length()][b.length()];
    }

    public static void main(String[] args) {
        System.out.println("Min coins for 6 with {1,3,4}: " + minCoins(new int[]{1, 3, 4}, 6));
        System.out.println("Min coins for 11 with {1,2,5}: " + minCoins(new int[]{1, 2, 5}, 11));
        System.out.println("Min coins for 3 with {2}: " + minCoins(new int[]{2}, 3));
        System.out.println("LCS of ABCBDAB and BDCABA: " + lcs("ABCBDAB", "BDCABA"));
    }
}`,
      notes: [
        { match: 'Arrays.fill(dp, amount + 1);', text: 'No answer can need more than `amount` coins, so `amount + 1` safely means “impossible”. It also avoids the overflow you would get adding 1 to `Integer.MAX_VALUE`.' },
        { match: 'dp[a] = Math.min(dp[a], dp[a - coin] + 1);', text: 'Try every coin as the last one used; the rest is a smaller, already-solved amount.' },
        { match: 'dp[i][j] = dp[i - 1][j - 1] + 1;', text: 'Matching characters extend the LCS of both shorter prefixes by one.' },
        { match: 'Math.max(dp[i - 1][j], dp[i][j - 1])', text: 'Otherwise drop one character from either string and keep the better result.' },
      ],
      output: 'Min coins for 6 with {1,3,4}: 2\nMin coins for 11 with {1,2,5}: 3\nMin coins for 3 with {2}: -1\nLCS of ABCBDAB and BDCABA: 4',
      time: 'Coin change O(amount × coins); LCS O(m × n)',
      space: 'Coin change O(amount); LCS O(m × n)',
    },
  ],

  algorithm: {
    title: 'A five-step recipe for any DP problem',
    steps: [
      'Define the state in words: what does `dp[i]` (or `dp[i][j]`) represent?',
      'Write the recurrence: how is a state computed from smaller states? Consider every possible last choice.',
      'Set the base cases: the smallest states whose answers are known directly.',
      'Choose an evaluation order (bottom-up) or add memoization (top-down) so dependencies are ready before use.',
      'Read the final answer from the right state, then look for space optimisations.',
    ],
    dryRun: {
      title: 'Coin change, coins {1, 3, 4}, amount 6',
      lines: [
        'dp[0] = 0',
        'dp[1] = dp[0] + 1 = 1   (1)',
        'dp[2] = dp[1] + 1 = 2   (1 + 1)',
        'dp[3] = min(dp[2]+1, dp[0]+1) = 1   (3)',
        'dp[4] = min(dp[3]+1, dp[1]+1, dp[0]+1) = 1   (4)',
        'dp[5] = min(dp[4]+1, dp[2]+1, dp[1]+1) = 2   (4 + 1)',
        'dp[6] = min(dp[5]+1, dp[3]+1, dp[2]+1) = 2   (3 + 3)',
      ],
    },
  },

  complexity: {
    columns: ['Problem', 'Naive recursion', 'With DP', 'DP space'],
    rows: [
      ['Fibonacci', 'O(2ⁿ)', 'O(n)', 'O(1) optimised'],
      ['Climbing stairs', 'O(2ⁿ)', 'O(n)', 'O(1) optimised'],
      ['Coin change (min coins)', 'Exponential', 'O(amount × k)', 'O(amount)'],
      ['Longest common subsequence', 'O(2^(m+n))', 'O(m × n)', 'O(m × n), or O(min(m, n))'],
      ['0/1 knapsack', 'O(2ⁿ)', 'O(n × W)', 'O(W) optimised'],
    ],
    note: 'DP running time ≈ (number of states) × (work per state). Count the states first: that is usually the whole analysis.',
  },

  mistakes: [
    { mistake: 'Starting to code before defining what `dp[i]` means.', fix: 'Write the state definition as a sentence first.' },
    { mistake: 'Wrong or missing base cases, e.g. forgetting `dp[0] = 0`.', fix: 'Check the smallest inputs by hand.' },
    { mistake: 'Filling the table in an order where a needed state isn’t computed yet.', fix: 'Make sure every dependency comes earlier in the loop order.' },
    { mistake: 'Using the largest int as “infinity” and then adding 1.', fix: 'With fixed-size ints it overflows to a negative number. Use a safe sentinel like `amount + 1`.' },
    { mistake: 'Off-by-one between string indices and table indices.', fix: 'Table row `i` usually corresponds to character `i − 1` of the string.' },
  ],

  takeaways: [
    'DP = recursion + reuse: solve each subproblem once.',
    'Look for overlapping subproblems and optimal substructure.',
    'Memoization (top-down) is easy to derive; tabulation (bottom-up) avoids recursion.',
    'The state definition is the most important decision.',
    'Complexity = number of states × work per state.',
  ],

  practice: ['climbing-stairs', 'coin-change', 'longest-common-subsequence', 'maximum-subarray'],
};
