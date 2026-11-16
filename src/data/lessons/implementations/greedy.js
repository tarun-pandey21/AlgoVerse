import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

int main() {
    // Each meeting is {start, end}
    vector<pair<int, int>> meetings = {{1, 4}, {3, 5}, {0, 6}, {5, 7}, {3, 9}, {5, 9},
                                       {6, 10}, {8, 11}, {8, 12}, {2, 14}, {12, 16}};
    // Greedy choice: always take the meeting that finishes earliest
    sort(meetings.begin(), meetings.end(),
         [](const pair<int, int>& a, const pair<int, int>& b) { return a.second < b.second; });

    int count = 0, lastEnd = INT_MIN;
    string chosen;
    for (auto [start, end] : meetings) {
        if (start >= lastEnd) {           // does not overlap the last chosen one
            count++;
            lastEnd = end;
            chosen += "[" + to_string(start) + ", " + to_string(end) + "] ";
        }
    }
    cout << "Meetings scheduled: " << count << "\n";
    cout << "Chosen: " << chosen << "\n";
}`,
      notes: [
        { match: 'return a.second < b.second;', text: 'Sorting by **end** time is the key insight. Sorting by start time or length gives wrong answers.' },
        { match: 'if (start >= lastEnd)', text: 'A meeting may start exactly when the previous one ends.' },
        { match: 'for (auto [start, end] : meetings)', text: 'C++17 structured bindings unpack each pair into named variables.' },
      ],
    },
    {
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

// Greedy: always take as many of the largest coin as fit
int greedyCoins(const vector<int>& coins, int amount) {   // coins sorted descending
    int count = 0;
    for (int coin : coins) {
        count += amount / coin;
        amount %= coin;
    }
    return amount == 0 ? count : -1;
}

int main() {
    vector<int> rupees = {2000, 500, 200, 100, 50, 20, 10, 5, 2, 1};
    cout << "Notes/coins for 2763: " << greedyCoins(rupees, 2763) << "\n";

    // Greedy is NOT always optimal: coins {4, 3, 1}, amount 6
    vector<int> tricky = {4, 3, 1};
    cout << "Greedy for 6 with {4,3,1}: " << greedyCoins(tricky, 6) << "\n";
    cout << "Optimal is 2 (3 + 3), which needs dynamic programming\n";
}`,
      notes: [
        { match: 'count += amount / coin;', text: 'Take as many of this coin as possible in one step.' },
        { match: 'amount %= coin;', text: 'What is left over moves on to the next smaller coin.' },
        { match: 'greedyCoins(tricky, 6)', text: 'Greedy picks 4 first and is then forced into 1 + 1: three coins instead of two.' },
      ],
    },
  ],

  python: [
    {
      code: python`
# Each meeting is (start, end)
meetings = [(1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9),
            (6, 10), (8, 11), (8, 12), (2, 14), (12, 16)]
# Greedy choice: always take the meeting that finishes earliest
meetings.sort(key=lambda m: m[1])

count, last_end = 0, float("-inf")
chosen = []
for start, end in meetings:
    if start >= last_end:                 # does not overlap the last chosen one
        count += 1
        last_end = end
        chosen.append(f"[{start}, {end}]")

print("Meetings scheduled:", count)
print("Chosen:", " ".join(chosen))`,
      notes: [
        { match: 'meetings.sort(key=lambda m: m[1])', text: 'Sorting by **end** time is the key insight. Sorting by start time or length gives wrong answers.' },
        { match: 'if start >= last_end:', text: 'A meeting may start exactly when the previous one ends.' },
        { match: 'chosen.append(f"[{start}, {end}]")', text: 'f-strings insert values straight into text.' },
      ],
    },
    {
      code: python`
def greedy_coins(coins, amount):
    """Greedy: always take as many of the largest coin as fit (coins sorted descending)."""
    count = 0
    for coin in coins:
        count += amount // coin
        amount %= coin
    return count if amount == 0 else -1


rupees = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1]
print("Notes/coins for 2763:", greedy_coins(rupees, 2763))

# Greedy is NOT always optimal: coins {4, 3, 1}, amount 6
tricky = [4, 3, 1]
print("Greedy for 6 with {4,3,1}:", greedy_coins(tricky, 6))
print("Optimal is 2 (3 + 3), which needs dynamic programming")`,
      notes: [
        { match: 'count += amount // coin', text: 'Take as many of this coin as possible in one step (`//` is integer division).' },
        { match: 'amount %= coin', text: 'What is left over moves on to the next smaller coin.' },
        { match: 'greedy_coins(tricky, 6)', text: 'Greedy picks 4 first and is then forced into 1 + 1: three coins instead of two.' },
      ],
    },
  ],
};
