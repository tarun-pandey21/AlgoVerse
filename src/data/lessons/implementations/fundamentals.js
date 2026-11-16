import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iomanip>
#include <iostream>
#include <vector>
using namespace std;

// Returns the sum of all values in the vector
int sum(const vector<int>& values) {
    int total = 0;
    for (int v : values) {
        total += v;
    }
    return total;
}

// Returns the largest value; assumes the vector is not empty
int maxValue(const vector<int>& values) {
    int best = values[0];
    for (size_t i = 1; i < values.size(); i++) {
        if (values[i] > best) {
            best = values[i];
        }
    }
    return best;
}

int main() {
    vector<int> marks = {72, 88, 95, 64, 81};
    int total = sum(marks);
    double average = static_cast<double>(total) / marks.size();

    cout << "Total: " << total << "\n";
    cout << "Average: " << fixed << setprecision(1) << average << "\n";
    cout << "Highest: " << maxValue(marks) << "\n";
}`,
      notes: [
        { match: 'const vector<int>& values', text: 'Passing by `const` reference avoids copying the whole vector and promises not to modify it.' },
        { match: 'int best = values[0];', text: 'Start with a real element rather than 0, so the function also works when every value is negative.' },
        { match: 'static_cast<double>(total)', text: 'Converting to `double` first avoids integer division, which would discard the decimal part.' },
        { match: 'fixed << setprecision(1)', text: 'Formats the number with one decimal place, so 80 prints as `80.0`.' },
      ],
    },
    {
      code: cpp`
#include <climits>
#include <iostream>
using namespace std;

int main() {
    int big = INT_MAX;
    cout << "int max: " << big << "\n";
    cout << "int min: " << INT_MIN << "\n";

    // Signed overflow is undefined behaviour in C++, so widen first
    long long safe = static_cast<long long>(big) + 1;
    cout << "as long long: " << safe << "\n";

    // Integer division drops the fractional part
    cout << "7 / 2 = " << 7 / 2 << "\n";
    cout << "7 / 2.0 = " << 7 / 2.0 << "\n";
    cout << "7 % 2 = " << 7 % 2 << "\n";
}`,
      notes: [
        { match: 'int big = INT_MAX;', text: '`INT_MAX` (from `<climits>`) is the largest `int`, 2,147,483,647 on all mainstream platforms.' },
        { match: '// Signed overflow is undefined behaviour', text: 'Unlike Java, C++ does not promise wrap-around: `big + 1` on an `int` is undefined behaviour, so the program could do anything.' },
        { match: 'static_cast<long long>(big) + 1', text: 'Widening one operand to `long long` makes the addition happen in 64-bit arithmetic.' },
      ],
      output: 'int max: 2147483647\nint min: -2147483648\nas long long: 2147483648\n7 / 2 = 3\n7 / 2.0 = 3.5\n7 % 2 = 1',
    },
  ],

  python: [
    {
      code: python`
def total_of(values):
    """Returns the sum of all values in the list."""
    total = 0
    for v in values:
        total += v
    return total


def max_of(values):
    """Returns the largest value; assumes the list is not empty."""
    best = values[0]
    for v in values[1:]:
        if v > best:
            best = v
    return best


marks = [72, 88, 95, 64, 81]
total = total_of(marks)
average = total / len(marks)    # "/" is always true division in Python 3

print("Total:", total)
print("Average:", average)
print("Highest:", max_of(marks))
print("Built-ins agree:", sum(marks), max(marks))`,
      notes: [
        { match: 'for v in values:', text: 'Python loops directly over the items; use `enumerate` when you also need the index.' },
        { match: 'best = values[0]', text: 'Start with a real element rather than 0, so the function also works when every value is negative.' },
        { match: 'average = total / len(marks)', text: '`/` always returns a float in Python 3, so there is no accidental integer division.' },
        { match: 'sum(marks), max(marks)', text: 'In real code, use the built-ins `sum()` and `max()`. They do the same O(n) work.' },
      ],
      output: 'Total: 400\nAverage: 80.0\nHighest: 95\nBuilt-ins agree: 400 95',
    },
    {
      code: python`
big = 2**31 - 1                   # the largest 32-bit int in Java and C++
print("2^31 - 1:", big)
print("plus 1:", big + 1)         # Python ints grow as needed: no overflow
print("2^100:", 2**100)

# "/" always gives a float; "//" is integer (floor) division
print("7 / 2 =", 7 / 2)
print("7 // 2 =", 7 // 2)
print("7 % 2 =", 7 % 2)
print("-7 // 2 =", -7 // 2)       # floors towards negative infinity`,
      notes: [
        { match: 'print("plus 1:", big + 1)', text: 'Python integers have arbitrary precision, so they never overflow. They just use more memory as they grow.' },
        { match: 'print("7 // 2 =", 7 // 2)', text: '`//` is floor division. Use it when you want a whole-number result, e.g. `mid = (low + high) // 2`.' },
        { match: 'print("-7 // 2 =", -7 // 2)', text: 'Floor division rounds down (to −4), unlike Java and C++, which truncate towards zero (−3).' },
      ],
      output: '2^31 - 1: 2147483647\nplus 1: 2147483648\n2^100: 1267650600228229401496703205376\n7 / 2 = 3.5\n7 // 2 = 3\n7 % 2 = 1\n-7 // 2 = -4',
    },
  ],
};
