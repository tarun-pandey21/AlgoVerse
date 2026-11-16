import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

// Returns the index of target, or -1 if it is not present
int linearSearch(const vector<int>& arr, int target) {
    for (int i = 0; i < (int)arr.size(); i++) {
        if (arr[i] == target) {
            return i;      // found: stop immediately
        }
    }
    return -1;             // checked every element
}

int main() {
    vector<int> arr = {42, 7, 19, 73, 7, 56};
    cout << "Index of 73: " << linearSearch(arr, 73) << "\n";
    cout << "Index of 7: " << linearSearch(arr, 7) << "\n";
    cout << "Index of 100: " << linearSearch(arr, 100) << "\n";
}`,
      notes: [
        { match: 'return i;      // found', text: 'Returning inside the loop stops the search early; this is the best case, O(1).' },
        { match: 'return -1;', text: 'Reached only after checking all n elements: the worst case, O(n).' },
        { match: 'i < (int)arr.size()', text: '`size()` is unsigned; casting avoids signed/unsigned comparison warnings.' },
      ],
    },
    {
      code: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// arr must be sorted in ascending order
int binarySearch(const vector<int>& arr, int target) {
    int low = 0, high = (int)arr.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;   // avoids int overflow
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid + 1;                  // discard the left half
        } else {
            high = mid - 1;                 // discard the right half
        }
    }
    return -1;
}

// First index whose value is >= target (arr.size() if none)
int lowerBound(const vector<int>& arr, int target) {
    int low = 0, high = (int)arr.size();
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

int main() {
    vector<int> arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    cout << "Index of 23: " << binarySearch(arr, 23) << "\n";
    cout << "Index of 40: " << binarySearch(arr, 40) << "\n";
    cout << "Lower bound of 40: " << lowerBound(arr, 40) << "\n";
    // The standard library version returns an iterator
    cout << "std::lower_bound agrees: " << (lower_bound(arr.begin(), arr.end(), 40) - arr.begin()) << "\n";
}`,
      notes: [
        { match: 'while (low <= high)', text: '`<=` matters: when `low == high` there is still one element left to check.' },
        { match: 'int mid = low + (high - low) / 2;   // avoids', text: 'Same value as `(low + high) / 2`, but cannot overflow for large indices.' },
        { match: 'low = mid + 1;                  // discard', text: '`mid` was already checked, so the new range starts after it. Using `low = mid` can loop forever.' },
        { match: 'lower_bound(arr.begin(), arr.end(), 40)', text: '`std::lower_bound` (in `<algorithm>`) does the same search; subtracting `begin()` turns the iterator into an index.' },
      ],
      output: 'Index of 23: 5\nIndex of 40: -1\nLower bound of 40: 7\nstd::lower_bound agrees: 7',
    },
  ],

  python: [
    {
      code: python`
def linear_search(arr, target):
    """Returns the index of target, or -1 if it is not present."""
    for i, value in enumerate(arr):
        if value == target:
            return i       # found: stop immediately
    return -1              # checked every element


arr = [42, 7, 19, 73, 7, 56]
print("Index of 73:", linear_search(arr, 73))
print("Index of 7:", linear_search(arr, 7))
print("Index of 100:", linear_search(arr, 100))`,
      notes: [
        { match: 'for i, value in enumerate(arr):', text: '`enumerate` yields each index together with its value.' },
        { match: 'return i       # found', text: 'Returning inside the loop stops the search early; this is the best case, O(1).' },
        { match: 'return -1              # checked', text: 'Reached only after checking all n elements: the worst case, O(n). The built-in `list.index` raises `ValueError` instead.' },
      ],
    },
    {
      code: python`
import bisect


def binary_search(arr, target):
    """arr must be sorted in ascending order."""
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2           # Python ints can't overflow
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1                 # discard the left half
        else:
            high = mid - 1                # discard the right half
    return -1


def lower_bound(arr, target):
    """First index whose value is >= target (len(arr) if none)."""
    low, high = 0, len(arr)
    while low < high:
        mid = (low + high) // 2
        if arr[mid] < target:
            low = mid + 1
        else:
            high = mid
    return low


arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
print("Index of 23:", binary_search(arr, 23))
print("Index of 40:", binary_search(arr, 40))
print("Lower bound of 40:", lower_bound(arr, 40))
print("bisect_left agrees:", bisect.bisect_left(arr, 40))`,
      notes: [
        { match: 'while low <= high:', text: '`<=` matters: when `low == high` there is still one element left to check.' },
        { match: 'mid = (low + high) // 2           # Python', text: '`//` is integer division. Python integers never overflow, so the simple formula is safe here.' },
        { match: 'low = mid + 1                 # discard', text: '`mid` was already checked, so the new range starts after it. Using `low = mid` can loop forever.' },
        { match: 'bisect.bisect_left(arr, 40)', text: 'The standard `bisect` module implements lower bound (`bisect_left`) and upper bound (`bisect_right`).' },
      ],
      output: 'Index of 23: 5\nIndex of 40: -1\nLower bound of 40: 7\nbisect_left agrees: 7',
    },
  ],
};
