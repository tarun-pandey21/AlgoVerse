import { java } from './helpers.js';

export default {
  summary:
    'Searching answers “is it here, and where?”. Linear search works on any data; binary search is dramatically faster but needs the data to be sorted.',

  introduction: [
    '**Searching** means finding the position of a target value in a collection, or reporting that it is not there. It is one of the most frequent operations in software, from looking up a contact to checking whether a username is taken.',
    'This lesson covers the two fundamental approaches. **Linear search** checks elements one by one. **Binary search** repeatedly halves a sorted range. On a million sorted items, linear search may need a million comparisons; binary search needs at most 20.',
  ],

  concepts: [
    {
      heading: 'Linear search',
      paragraphs: [
        'Walk through the collection from the start and compare each element with the target. Stop as soon as you find it. Linear search works on **unsorted** data and on structures without random access, such as linked lists.',
      ],
      points: [
        'Best case: the target is first, so **O(1)**.',
        'Worst case: the target is last or missing, so **O(n)**.',
      ],
    },
    {
      heading: 'Binary search',
      paragraphs: [
        'On a **sorted** array, compare the target with the middle element. If they are equal, you are done. If the target is larger, it can only be in the right half; if it is smaller, only in the left half. Each comparison discards half of the remaining range.',
        'Halving `n` repeatedly reaches 1 after about `log₂ n` steps, so binary search is **O(log n)**.',
      ],
    },
    {
      heading: 'Computing the middle safely',
      paragraphs: [
        'With fixed-size integers (Java, C++), `(low + high) / 2` can overflow when `low` and `high` are both large. `low + (high - low) / 2` gives the same result without overflow. This bug famously sat unnoticed in widely used library code for years. Python integers cannot overflow, so `(low + high) // 2` is safe there.',
      ],
    },
    {
      heading: 'Binary search beyond exact matches',
      paragraphs: [
        'The same halving idea finds **boundaries**: the first element `≥ target` (lower bound), the first element `> target` (upper bound) or the insertion point. It also applies to any **monotonic** yes/no question, such as “what is the smallest speed that finishes in time?”. This is called *binary search on the answer*.',
      ],
    },
  ],

  visualizers: ['linear-search', 'binary-search'],

  languageNotes: {
    java: [
      "`Arrays.binarySearch(arr, x)` and `Collections.binarySearch(list, x)` are built in. For a missing key they return `-(insertionPoint) - 1`.",
      "`list.indexOf(x)` and `list.contains(x)` are linear searches: O(n).",
    ],
    cpp: [
      "`std::lower_bound` and `std::upper_bound` (in `<algorithm>`) return iterators; subtract `begin()` to get an index.",
      "`std::binary_search` only answers yes or no; `std::find` is a linear search.",
    ],
    python: [
      "The `bisect` module provides lower bound (`bisect_left`), upper bound (`bisect_right`) and `insort` to insert while keeping a list sorted.",
      "`x in lst` and `lst.index(x)` are linear searches: O(n). `lst.index` raises `ValueError` if the value is missing.",
    ],
  },

  applications: [
    { title: 'Database indexes', description: 'B-tree indexes use the same halving principle to find rows among millions in a few disk reads.' },
    { title: 'Version control', description: '`git bisect` binary-searches through commits to find the one that introduced a bug.' },
    { title: 'Autocomplete', description: 'A sorted word list plus lower-bound search finds the first word with a given prefix.' },
    { title: 'Small or unsorted data', description: 'Linear search is the right tool for short lists, streams and data that changes constantly.' },
  ],

  terminology: [
    { term: 'Target / key', definition: 'The value being searched for.' },
    { term: 'Search space', definition: 'The range of positions that could still contain the target, `[low, high]` in binary search.' },
    { term: 'Sorted order', definition: 'Elements arranged in non-decreasing (or non-increasing) order. Required for binary search.' },
    { term: 'Lower bound', definition: 'The first index whose value is `≥ target`; also the position where the target would be inserted.' },
    { term: 'Logarithmic time', definition: 'O(log n): work grows by one step each time the input doubles.' },
    { term: 'Sentinel value', definition: 'A special return value such as `−1` that means “not found”.' },
  ],

  examples: [
    {
      title: 'Linear search',
      description: 'Returns the index of the first match, or −1. Notice it finds the **first** 7 even though 7 appears twice.',
      code: java`
public class LinearSearch {
    // Returns the index of target, or -1 if it is not present
    static int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return i;      // found: stop immediately
            }
        }
        return -1;             // checked every element
    }

    public static void main(String[] args) {
        int[] arr = {42, 7, 19, 73, 7, 56};
        System.out.println("Index of 73: " + linearSearch(arr, 73));
        System.out.println("Index of 7: " + linearSearch(arr, 7));
        System.out.println("Index of 100: " + linearSearch(arr, 100));
    }
}`,
      notes: [
        { match: 'return i;      // found', text: 'Returning inside the loop stops the search early; this is the best case, O(1).' },
        { match: 'return -1;', text: 'Reached only after checking all n elements: the worst case, O(n).' },
      ],
      output: 'Index of 73: 3\nIndex of 7: 1\nIndex of 100: -1',
      time: 'Best O(1), average and worst O(n)',
      space: 'O(1)',
    },
    {
      title: 'Binary search and lower bound',
      description: 'The classic iterative binary search, plus a lower-bound variant that finds where a missing value would go.',
      code: java`
public class BinarySearch {
    // arr must be sorted in ascending order
    static int binarySearch(int[] arr, int target) {
        int low = 0, high = arr.length - 1;
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

    // First index whose value is >= target (arr.length if none)
    static int lowerBound(int[] arr, int target) {
        int low = 0, high = arr.length;
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

    public static void main(String[] args) {
        int[] arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        System.out.println("Index of 23: " + binarySearch(arr, 23));
        System.out.println("Index of 40: " + binarySearch(arr, 40));
        System.out.println("Lower bound of 40: " + lowerBound(arr, 40));
    }
}`,
      notes: [
        { match: 'while (low <= high)', text: '`<=` matters: when `low == high` there is still one element left to check.' },
        { match: 'int mid = low + (high - low) / 2;   // avoids', text: 'Same value as `(low + high) / 2` but cannot overflow for large indices.' },
        { match: 'low = mid + 1;                  // discard', text: '`mid` was already checked, so the new range starts after it. Using `low = mid` can loop forever.' },
        { match: 'high = mid;', text: 'In lower bound, `mid` might be the answer, so it stays in the range (note `high` starts at `arr.length`).' },
      ],
      output: 'Index of 23: 5\nIndex of 40: -1\nLower bound of 40: 7',
      time: 'O(log n)',
      space: 'O(1) iterative',
    },
  ],

  algorithm: {
    title: 'Binary search on a sorted array',
    steps: [
      'Set `low = 0` and `high = n − 1`. The target, if present, lies in `arr[low..high]`.',
      'While `low ≤ high`, compute `mid = low + (high − low) / 2`.',
      'If `arr[mid] == target`, return `mid`.',
      'If `arr[mid] < target`, the target must be to the right: set `low = mid + 1`.',
      'Otherwise the target must be to the left: set `high = mid − 1`.',
      'If the loop ends (`low > high`), the range is empty: return −1.',
    ],
    dryRun: {
      title: 'Search for 23 in [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]',
      lines: [
        'low=0, high=9 → mid=4, arr[4]=16 < 23 → low=5',
        'low=5, high=9 → mid=7, arr[7]=56 > 23 → high=6',
        'low=5, high=6 → mid=5, arr[5]=23 → found at index 5 (3 comparisons)',
      ],
    },
  },

  complexity: {
    columns: ['Algorithm', 'Best', 'Average', 'Worst', 'Space', 'Needs sorted data?'],
    rows: [
      ['Linear search', 'O(1)', 'O(n)', 'O(n)', 'O(1)', 'No'],
      ['Binary search (iterative)', 'O(1)', 'O(log n)', 'O(log n)', 'O(1)', 'Yes'],
      ['Binary search (recursive)', 'O(1)', 'O(log n)', 'O(log n)', 'O(log n)', 'Yes'],
    ],
    note: 'Sorting first costs O(n log n). That only pays off if you search the same data many times; for a single search on unsorted data, linear search is faster overall.',
  },

  mistakes: [
    { mistake: 'Running binary search on unsorted data.', fix: 'Sort first, or use linear search.' },
    { mistake: 'Writing `while (low < high)` for exact-match search.', fix: 'Use `low <= high`, or the last remaining element is never checked.' },
    { mistake: 'Updating with `low = mid` or `high = mid` in the exact-match version.', fix: 'Use `mid + 1` / `mid − 1`; otherwise the range can stop shrinking and loop forever.' },
    { mistake: 'Computing `(low + high) / 2` on huge arrays.', fix: 'Use `low + (high − low) / 2` (or `(low + high) >>> 1`).' },
    { mistake: 'Expecting the first occurrence when duplicates exist.', fix: 'Plain binary search returns **some** match. Use the lower-bound version for the first one.' },
  ],

  takeaways: [
    'Linear search works anywhere and is O(n).',
    'Binary search needs sorted, random-access data and is O(log n).',
    'Each binary search step halves the search space: ~20 steps for a million items.',
    'Get the loop condition and the `mid ± 1` updates right; they cause most bugs.',
    'Lower bound and binary search on the answer extend the idea to many more problems.',
  ],

  practice: ['binary-search', 'search-in-rotated-sorted-array', 'two-sum'],
};
