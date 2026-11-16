import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

vector<long long> memo(91, -1);

// Top-down: recursion + cache
long long fibMemo(int n) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];          // already solved
    return memo[n] = fibMemo(n - 1) + fibMemo(n - 2);
}

// Bottom-up: fill a table from the smallest subproblem
long long fibTable(int n) {
    if (n <= 1) return n;
    vector<long long> dp(n + 1, 0);
    dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}

// Only the last two values are ever needed
long long fibOptimized(int n) {
    if (n == 0) return 0;
    long long prev = 0, curr = 1;
    for (int i = 2; i <= n; i++) {
        long long next = prev + curr;
        prev = curr;
        curr = next;
    }
    return curr;
}

int main() {
    cout << "fibMemo(50)      = " << fibMemo(50) << "\n";
    cout << "fibTable(50)     = " << fibTable(50) << "\n";
    cout << "fibOptimized(90) = " << fibOptimized(90) << "\n";
}`,
      notes: [
        { match: 'if (memo[n] != -1) return memo[n];', text: 'The memo check: each state is computed only once, collapsing 2ⁿ calls into n.' },
        { match: 'for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];', text: 'Bottom-up order guarantees both smaller values exist before they are used.' },
        { match: 'long long next = prev + curr;', text: 'Keeping just two variables cuts space from O(n) to O(1).' },
        { match: 'vector<long long> memo(91, -1);', text: '`long long` (64-bit) is needed: fib(47) already exceeds the `int` range, and fib(93) would overflow even this.' },
      ],
    },
    {
      code: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// dp[a] = fewest coins that make amount a
int minCoins(const vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, amount + 1);   // "infinity": more than any real answer
    dp[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int coin : coins) {
            if (coin <= a) {
                dp[a] = min(dp[a], dp[a - coin] + 1);
            }
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}

// dp[i][j] = LCS length of a's first i chars and b's first j chars
int lcs(const string& a, const string& b) {
    vector<vector<int>> dp(a.size() + 1, vector<int>(b.size() + 1, 0));
    for (size_t i = 1; i <= a.size(); i++) {
        for (size_t j = 1; j <= b.size(); j++) {
            if (a[i - 1] == b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;        // characters match
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[a.size()][b.size()];
}

int main() {
    cout << "Min coins for 6 with {1,3,4}: " << minCoins({1, 3, 4}, 6) << "\n";
    cout << "Min coins for 11 with {1,2,5}: " << minCoins({1, 2, 5}, 11) << "\n";
    cout << "Min coins for 3 with {2}: " << minCoins({2}, 3) << "\n";
    cout << "LCS of ABCBDAB and BDCABA: " << lcs("ABCBDAB", "BDCABA") << "\n";
}`,
      notes: [
        { match: 'vector<int> dp(amount + 1, amount + 1);', text: 'No answer can need more than `amount` coins, so `amount + 1` safely means “impossible” without overflow risk.' },
        { match: 'dp[a] = min(dp[a], dp[a - coin] + 1);', text: 'Try every coin as the last one used; the rest is a smaller, already-solved amount.' },
        { match: 'vector<vector<int>> dp(a.size() + 1, vector<int>(b.size() + 1, 0));', text: 'A 2D table of (m + 1) × (n + 1) zeros; row 0 and column 0 represent empty prefixes.' },
        { match: 'dp[i][j] = dp[i - 1][j - 1] + 1;', text: 'Matching characters extend the LCS of both shorter prefixes by one.' },
      ],
    },
  ],

  python: [
    {
      code: python`
from functools import lru_cache


@lru_cache(maxsize=None)
def fib_memo(n):
    """Top-down: plain recursion, cached automatically by lru_cache."""
    if n <= 1:
        return n
    return fib_memo(n - 1) + fib_memo(n - 2)


def fib_table(n):
    """Bottom-up: fill a table from the smallest subproblem."""
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]


def fib_optimized(n):
    """Only the last two values are ever needed."""
    prev, curr = 0, 1
    for _ in range(n):
        prev, curr = curr, prev + curr
    return prev


print("fibMemo(50)      =", fib_memo(50))
print("fibTable(50)     =", fib_table(50))
print("fibOptimized(90) =", fib_optimized(90))`,
      notes: [
        { match: '@lru_cache(maxsize=None)', text: 'The decorator stores every result, so each `n` is computed only once: memoization in one line.' },
        { match: 'dp[i] = dp[i - 1] + dp[i - 2]', text: 'Bottom-up order guarantees both smaller values exist before they are used.' },
        { match: 'prev, curr = curr, prev + curr', text: 'Tuple assignment updates both values at once, keeping O(1) space.' },
      ],
    },
    {
      code: python`
def min_coins(coins, amount):
    """dp[a] = fewest coins that make amount a."""
    INF = amount + 1                      # more than any real answer
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for coin in coins:
            if coin <= a:
                dp[a] = min(dp[a], dp[a - coin] + 1)
    return -1 if dp[amount] == INF else dp[amount]


def lcs(a, b):
    """dp[i][j] = LCS length of a's first i chars and b's first j chars."""
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1          # characters match
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[len(a)][len(b)]


print("Min coins for 6 with {1,3,4}:", min_coins([1, 3, 4], 6))
print("Min coins for 11 with {1,2,5}:", min_coins([1, 2, 5], 11))
print("Min coins for 3 with {2}:", min_coins([2], 3))
print("LCS of ABCBDAB and BDCABA:", lcs("ABCBDAB", "BDCABA"))`,
      notes: [
        { match: 'dp = [0] + [INF] * amount', text: '`dp[0] = 0` is the base case; every other amount starts as “impossible”.' },
        { match: 'dp[a] = min(dp[a], dp[a - coin] + 1)', text: 'Try every coin as the last one used; the rest is a smaller, already-solved amount.' },
        { match: 'dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]', text: 'Build each row separately. `[[0] * m] * n` would make every row the same list.' },
        { match: 'dp[i][j] = dp[i - 1][j - 1] + 1', text: 'Matching characters extend the LCS of both shorter prefixes by one.' },
      ],
    },
  ],
};
