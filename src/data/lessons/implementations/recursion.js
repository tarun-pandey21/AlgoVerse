import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
using namespace std;

long long factorial(int n) {
    if (n <= 1) return 1;            // base case
    return n * factorial(n - 1);     // recursive case: smaller input
}

int sumDigits(int n) {
    if (n < 10) return n;            // a single digit
    return n % 10 + sumDigits(n / 10);
}

// Prints n down to 1, then 1 back up to n
void countDownUp(int n) {
    if (n == 0) return;
    cout << n << " ";               // runs before the recursive call
    countDownUp(n - 1);
    cout << n << " ";               // runs after the call returns
}

int main() {
    cout << "5! = " << factorial(5) << "\n";
    cout << "Digit sum of 4096 = " << sumDigits(4096) << "\n";
    countDownUp(3);
    cout << "\n";
}`,
      notes: [
        { match: 'if (n <= 1) return 1;', text: 'Without this base case the calls would never stop and the program would crash with a stack overflow.' },
        { match: 'return n % 10 + sumDigits(n / 10);', text: '`n % 10` is the last digit; `n / 10` drops it, which is the smaller subproblem.' },
        { match: 'cout << n << " ";               // runs after', text: 'This line waits until the deeper calls finish, so the numbers print in reverse.' },
      ],
    },
    {
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

void backtrack(const vector<int>& nums, size_t index, vector<int>& current, vector<vector<int>>& result) {
    if (index == nums.size()) {
        result.push_back(current);              // push_back stores a copy
        return;
    }
    // Choice 1: skip nums[index]
    backtrack(nums, index + 1, current, result);
    // Choice 2: include nums[index]
    current.push_back(nums[index]);
    backtrack(nums, index + 1, current, result);
    current.pop_back();                         // undo the choice (backtrack)
}

int main() {
    vector<vector<int>> result;
    vector<int> current;
    backtrack({1, 2, 3}, 0, current, result);

    cout << "[";
    for (size_t i = 0; i < result.size(); i++) {
        cout << "[";
        for (size_t j = 0; j < result[i].size(); j++) cout << result[i][j] << (j + 1 < result[i].size() ? ", " : "");
        cout << "]" << (i + 1 < result.size() ? ", " : "");
    }
    cout << "]\n";
}`,
      notes: [
        { match: 'if (index == nums.size())', text: 'Base case: a decision has been made for every element, so record this subset.' },
        { match: 'result.push_back(current);', text: 'C++ containers copy by value, so the stored subset won’t change when `current` does.' },
        { match: 'current.pop_back();', text: 'Undo the “include” choice before returning. This is the heart of backtracking.' },
        { match: 'vector<int>& current', text: 'Passing `current` by reference shares one vector across all calls instead of copying it at every level.' },
      ],
    },
  ],

  python: [
    {
      code: python`
def factorial(n):
    if n <= 1:
        return 1                     # base case
    return n * factorial(n - 1)      # recursive case: smaller input


def sum_digits(n):
    if n < 10:
        return n                     # a single digit
    return n % 10 + sum_digits(n // 10)


def count_down_up(n):
    """Prints n down to 1, then 1 back up to n."""
    if n == 0:
        return
    print(n, end=" ")                # runs before the recursive call
    count_down_up(n - 1)
    print(n, end=" ")                # runs after the call returns


print("5! =", factorial(5))
print("Digit sum of 4096 =", sum_digits(4096))
count_down_up(3)
print()`,
      notes: [
        { match: 'return 1                     # base case', text: 'Without a base case Python raises `RecursionError` after about 1000 nested calls.' },
        { match: 'return n % 10 + sum_digits(n // 10)', text: '`n % 10` is the last digit; `n // 10` (integer division) drops it, giving the smaller subproblem.' },
        { match: 'print(n, end=" ")                # runs after', text: 'This line waits until the deeper calls finish, so the numbers print in reverse.' },
      ],
    },
    {
      code: python`
def backtrack(nums, index, current, result):
    if index == len(nums):
        result.append(current[:])               # copy: current keeps changing
        return
    # Choice 1: skip nums[index]
    backtrack(nums, index + 1, current, result)
    # Choice 2: include nums[index]
    current.append(nums[index])
    backtrack(nums, index + 1, current, result)
    current.pop()                               # undo the choice (backtrack)


result = []
backtrack([1, 2, 3], 0, [], result)
print(result)`,
      notes: [
        { match: 'if index == len(nums):', text: 'Base case: a decision has been made for every element, so record this subset.' },
        { match: 'result.append(current[:])', text: '`current[:]` stores a copy. Appending `current` itself would leave every entry pointing at the same list.' },
        { match: 'current.pop()                               # undo', text: 'Undo the “include” choice before returning. This is the heart of backtracking.' },
      ],
    },
  ],
};
