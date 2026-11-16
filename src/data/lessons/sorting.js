import { java } from './helpers.js';

export default {
  summary:
    'Sorting puts data in order so it can be searched, compared and presented efficiently. Learn three simple O(n²) sorts by watching them work, then the O(n log n) merge sort.',

  introduction: [
    '**Sorting** arranges elements in a defined order, usually ascending. Sorted data unlocks faster algorithms: binary search, duplicate detection with one pass, merging, and finding medians or ranges.',
    'In practice you will call your language’s built-in sort. Learning how sorting works still matters: the ideas behind it (swapping, invariants, divide and conquer) appear throughout DSA, and interviewers expect you to discuss the trade-offs.',
  ],

  concepts: [
    {
      heading: 'Bubble sort',
      paragraphs: [
        'Repeatedly walk through the array and swap adjacent elements that are out of order. After each pass, the largest remaining element has “bubbled” to the end. If a full pass makes no swaps, the array is already sorted and you can stop early.',
      ],
    },
    {
      heading: 'Selection sort',
      paragraphs: [
        'Divide the array into a sorted left part and an unsorted right part. On each pass, **select** the smallest element in the unsorted part and swap it into the next position. It always does about n²/2 comparisons but at most n − 1 swaps, which helps when writes are expensive.',
      ],
    },
    {
      heading: 'Insertion sort',
      paragraphs: [
        'Build the sorted part one element at a time, like sorting playing cards in your hand. Take the next element (the **key**), shift larger sorted elements one step right, and drop the key into the gap.',
        'On nearly sorted data it does very little shifting and runs close to **O(n)**. That is why real libraries use it for small or almost-sorted ranges.',
      ],
    },
    {
      heading: 'Merge sort: divide and conquer',
      paragraphs: [
        'Split the array in half, sort each half recursively, then **merge** the two sorted halves by repeatedly taking the smaller front element. There are log n levels of splitting and each level does O(n) merging work, so the total is **O(n log n)** in every case.',
      ],
    },
    {
      heading: 'Stability and built-in sorts',
      paragraphs: [
        'A sort is **stable** if equal elements keep their original relative order. That matters when you sort by one field after another (e.g. by name, then by grade).',
      ],
      points: [
        'Built-in sorts run in O(n log n). Python’s sort and Java’s object sort (both TimSort) are stable; C++’s `std::sort` is not, but `std::stable_sort` is.',
        'Use a stable sort whenever you sort records by one key and then another.',
      ],
    },
  ],

  visualizers: ['bubble-sort', 'selection-sort', 'insertion-sort'],

  languageNotes: {
    java: [
      "`Arrays.sort(int[])` uses dual-pivot quicksort: fast, not stable (stability doesn’t matter for primitives).",
      "`Arrays.sort(Object[])` and `Collections.sort` use stable TimSort.",
      "Custom order: `list.sort(Comparator.comparing(Person::age))`, or a lambda using `Integer.compare(a, b)`.",
    ],
    cpp: [
      "`std::sort(v.begin(), v.end())` is an introsort: O(n log n) worst case, not stable.",
      "Use `std::stable_sort` when equal elements must keep their order.",
      "A custom order is a lambda that returns true if `a` goes first: `sort(v.begin(), v.end(), [](int a, int b) { return a > b; })`.",
    ],
    python: [
      "`sorted(xs)` returns a new list and `xs.sort()` sorts in place. Both use stable Timsort.",
      "Sort by a key rather than a comparator: `people.sort(key=lambda p: p.age)`.",
      "Use `reverse=True` for descending order.",
    ],
  },

  applications: [
    { title: 'E-commerce listings', description: 'Sorting products by price, rating or relevance, often by several keys, which is where stable sorting matters.' },
    { title: 'Leaderboards and rankings', description: 'Scores are sorted to assign ranks; ties keep a deterministic order with stable sorts.' },
    { title: 'Databases', description: '`ORDER BY` and merge joins rely on efficient sorting, including external merge sort for data larger than memory.' },
    { title: 'Preprocessing for other algorithms', description: 'Binary search, interval merging and greedy scheduling all start by sorting.' },
  ],

  terminology: [
    { term: 'In-place', definition: 'Sorts using O(1) extra memory by rearranging elements inside the array itself.' },
    { term: 'Stable sort', definition: 'Keeps equal elements in their original relative order.' },
    { term: 'Pass', definition: 'One full sweep through the (unsorted part of the) array.' },
    { term: 'Swap', definition: 'Exchanging two elements using a temporary variable.' },
    { term: 'Inversion', definition: 'A pair of positions `i < j` with `arr[i] > arr[j]`. Insertion sort’s work grows with the number of inversions.' },
    { term: 'Divide and conquer', definition: 'Split a problem into smaller copies, solve them, and combine the results.' },
    { term: 'Comparator', definition: 'A rule for ordering objects, e.g. `(a, b) -> a.age - b.age`.' },
  ],

  examples: [
    {
      title: 'Bubble sort with early exit',
      description: 'The `swapped` flag lets bubble sort finish in a single pass when the input is already sorted.',
      code: java`
import java.util.Arrays;

public class BubbleSort {
    static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int pass = 0; pass < n - 1; pass++) {
            boolean swapped = false;
            // After each pass the largest remaining value is in place,
            // so the inner loop can stop "pass" elements earlier.
            for (int j = 0; j < n - 1 - pass; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    swapped = true;
                }
            }
            if (!swapped) break;   // no swaps: already sorted
        }
    }

    public static void main(String[] args) {
        int[] arr = {5, 1, 4, 2, 8};
        bubbleSort(arr);
        System.out.println(Arrays.toString(arr));
    }
}`,
      notes: [
        { match: 'j < n - 1 - pass', text: 'The last `pass` elements are already in their final positions, so skip them.' },
        { match: 'if (arr[j] > arr[j + 1])', text: 'Strict `>` means equal elements are never swapped, which keeps bubble sort stable.' },
        { match: 'if (!swapped) break;', text: 'Turns the best case (already sorted) into O(n).' },
      ],
      output: '[1, 2, 4, 5, 8]',
      time: 'Best O(n), average/worst O(n²)',
      space: 'O(1), in place',
    },
    {
      title: 'Selection sort and insertion sort',
      description: 'Both build a sorted prefix. Selection sort finds the minimum and swaps once per pass; insertion sort shifts elements to make room for the key.',
      code: java`
import java.util.Arrays;

public class SelectionInsertion {
    static void selectionSort(int[] arr) {
        for (int i = 0; i < arr.length - 1; i++) {
            int minIndex = i;
            for (int j = i + 1; j < arr.length; j++) {
                if (arr[j] < arr[minIndex]) {
                    minIndex = j;
                }
            }
            // One swap per pass puts the smallest remaining value at i
            int temp = arr[i];
            arr[i] = arr[minIndex];
            arr[minIndex] = temp;
        }
    }

    static void insertionSort(int[] arr) {
        for (int i = 1; i < arr.length; i++) {
            int key = arr[i];
            int j = i - 1;
            // Shift larger elements one step right to make room for key
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }

    public static void main(String[] args) {
        int[] a = {64, 25, 12, 22, 11};
        selectionSort(a);
        System.out.println("Selection: " + Arrays.toString(a));

        int[] b = {12, 11, 13, 5, 6};
        insertionSort(b);
        System.out.println("Insertion: " + Arrays.toString(b));
    }
}`,
      notes: [
        { match: 'int minIndex = i;', text: 'Assume the first unsorted element is the minimum, then look for anything smaller.' },
        { match: 'int key = arr[i];', text: 'Save the key first. Shifting will overwrite `arr[i]`.' },
        { match: 'while (j >= 0 && arr[j] > key)', text: 'Check `j >= 0` first so we never read `arr[-1]` (short-circuit evaluation).' },
        { match: 'arr[j + 1] = key;', text: '`j` stopped one position before the gap, so the key goes at `j + 1`.' },
      ],
      output: 'Selection: [11, 12, 22, 25, 64]\nInsertion: [5, 6, 11, 12, 13]',
      time: 'Selection O(n²) always; insertion O(n) best, O(n²) worst',
      space: 'O(1), both in place',
    },
    {
      title: 'Merge sort',
      description: 'Recursive divide and conquer with a temporary array for merging. Guaranteed O(n log n).',
      code: java`
import java.util.Arrays;

public class MergeSort {
    static void mergeSort(int[] arr, int left, int right) {
        if (left >= right) return;            // 0 or 1 element: already sorted
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }

    // Merges the sorted halves arr[left..mid] and arr[mid+1..right]
    static void merge(int[] arr, int left, int mid, int right) {
        int[] temp = new int[right - left + 1];
        int i = left, j = mid + 1, k = 0;
        while (i <= mid && j <= right) {
            // "<=" takes from the left half on ties, keeping the sort stable
            if (arr[i] <= arr[j]) temp[k++] = arr[i++];
            else temp[k++] = arr[j++];
        }
        while (i <= mid) temp[k++] = arr[i++];       // copy any leftovers
        while (j <= right) temp[k++] = arr[j++];
        System.arraycopy(temp, 0, arr, left, temp.length);
    }

    public static void main(String[] args) {
        int[] arr = {38, 27, 43, 3, 9, 82, 10};
        mergeSort(arr, 0, arr.length - 1);
        System.out.println(Arrays.toString(arr));
    }
}`,
      notes: [
        { match: 'if (left >= right) return;', text: 'Base case: a range of 0 or 1 elements is already sorted.' },
        { match: 'if (arr[i] <= arr[j]) temp[k++] = arr[i++];', text: 'Taking from the left half on ties is what makes merge sort stable.' },
        { match: 'System.arraycopy(temp, 0, arr, left, temp.length);', text: 'Copy the merged result back into the original range.' },
      ],
      output: '[3, 9, 10, 27, 38, 43, 82]',
      time: 'O(n log n) in all cases',
      space: 'O(n) for the temporary arrays',
    },
  ],

  algorithm: {
    title: 'Insertion sort',
    steps: [
      'Treat `arr[0]` as a sorted section of length 1.',
      'For each index `i` from 1 to `n − 1`, store `key = arr[i]`.',
      'Set `j = i − 1`. While `j ≥ 0` and `arr[j] > key`, copy `arr[j]` to `arr[j + 1]` and decrement `j`.',
      'Place the key at `arr[j + 1]`. The section `arr[0..i]` is now sorted.',
      'Repeat until every element has been inserted.',
    ],
    dryRun: {
      title: 'Dry run with [12, 11, 13, 5, 6]',
      lines: [
        'i=1, key=11: shift 12 → [11, 12, 13, 5, 6]',
        'i=2, key=13: 12 < 13, no shift → [11, 12, 13, 5, 6]',
        'i=3, key=5: shift 13, 12, 11 → [5, 11, 12, 13, 6]',
        'i=4, key=6: shift 13, 12, 11 → [5, 6, 11, 12, 13]',
      ],
    },
  },

  complexity: {
    columns: ['Algorithm', 'Best', 'Average', 'Worst', 'Space', 'Stable'],
    rows: [
      ['Bubble sort', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'Yes'],
      ['Selection sort', 'O(n²)', 'O(n²)', 'O(n²)', 'O(1)', 'No'],
      ['Insertion sort', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'Yes'],
      ['Merge sort', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(n)', 'Yes'],
      ['Quick sort', 'O(n log n)', 'O(n log n)', 'O(n²)', 'O(log n)', 'No'],
      ['Heap sort', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(1)', 'No'],
    ],
    note: 'No comparison-based sort can beat O(n log n) in the worst case. Counting sort and radix sort go faster by exploiting limited key ranges instead of comparisons.',
  },

  mistakes: [
    { mistake: 'Inner loop bound `j < n` in bubble sort, which reads `arr[j + 1]` out of bounds.', fix: 'Compare `arr[j]` with `arr[j + 1]` only while `j < n − 1 − pass`.' },
    { mistake: 'In insertion sort, forgetting to save `key` before shifting.', fix: 'Store `arr[i]` in `key` first; the shift overwrites that slot.' },
    { mistake: 'Writing `arr[j] > key && j >= 0`.', fix: 'Check `j >= 0` first so the bounds test runs before the array access.' },
    { mistake: 'Comparing by subtraction (`a - b`) in a custom comparator.', fix: 'With fixed-size integers the subtraction can overflow and flip the order. Compare the values directly instead.' },
    { mistake: 'Using an O(n²) sort for large inputs.', fix: 'Use the built-in O(n log n) sort in real code.' },
  ],

  takeaways: [
    'Bubble, selection and insertion sort are O(n²) but simple and in place.',
    'Insertion sort is excellent on small or nearly sorted data.',
    'Merge sort guarantees O(n log n) and is stable, at the cost of O(n) extra memory.',
    'Stability matters when sorting records by multiple keys.',
    'In real code, use the built-in sort and know whether it is stable.',
  ],

  practice: ['merge-intervals', 'kth-largest-element', 'valid-anagram'],
};
