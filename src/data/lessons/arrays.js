import { java } from './helpers.js';

export default {
  summary:
    'An array stores elements side by side in memory, which makes reading any position instant but inserting in the middle expensive. Mastering that trade-off is the first step in DSA.',

  introduction: [
    'An **array** is a fixed-size, ordered collection of elements of the same type, stored in one **contiguous** block of memory. Each element is identified by its **index**, starting at 0.',
    'Because elements sit next to each other, the computer can calculate the address of `arr[i]` directly, so reading any element takes the same tiny amount of time. The cost comes when you insert or delete in the middle: other elements have to shift to keep the block contiguous.',
  ],

  concepts: [
    {
      heading: 'Memory layout and O(1) access',
      paragraphs: [
        'If an `int` array starts at memory address `base` and each `int` takes 4 bytes, then `arr[i]` lives at `base + i × 4`. That is a single calculation no matter how large the array is, which is why indexing is **O(1)**.',
      ],
    },
    {
      heading: 'Fixed size vs dynamic arrays',
      paragraphs: [
        'A plain array’s length is fixed when it is created. A **dynamic array** (Java’s `ArrayList`, C++’s `vector`, Python’s `list`) grows automatically: when it fills up, it allocates a bigger block (typically 1.5–2× larger) and copies the elements across. Copying is O(n), but it happens rarely, so adding to the end is **amortised O(1)**.',
      ],
    },
    {
      heading: 'Insertion and deletion require shifting',
      paragraphs: [
        'To insert at index `i`, every element from `i` onwards moves one step right to make room. To delete at `i`, every later element moves one step left to close the gap. In the worst case (index 0) that is all `n` elements, so both are **O(n)**.',
      ],
      points: [
        'Insert or delete at the **end**: O(1) when there is spare capacity.',
        'Insert or delete at the **beginning or middle**: O(n) because of shifting.',
        'Search an **unsorted** array: O(n). Search a **sorted** array with binary search: O(log n).',
      ],
    },
    {
      heading: 'Core array patterns',
      paragraphs: ['Many interview problems are solved with a handful of reusable techniques:'],
      points: [
        '**Two pointers:** move indices from both ends (or at two speeds) to avoid nested loops, e.g. reversing an array or finding a pair with a given sum in a sorted array.',
        '**Prefix sums:** precompute running totals so that the sum of any range is a single subtraction.',
        '**Sliding window:** keep a moving range `[left, right]` and update it incrementally instead of recomputing it.',
      ],
    },
  ],

  visualizers: ['array-operations'],

  languageNotes: {
    java: [
      "`int[]` arrays have a fixed `length`; use `ArrayList<Integer>` when the size changes (`add`, `get`, `set`, `remove`).",
      "Print with `Arrays.toString(arr)`. `System.out.println(arr)` prints a reference like `[I@1b6d3586`.",
      "`int[] b = a;` shares the array. Copy with `a.clone()` or `Arrays.copyOf(a, n)`.",
      "Remove while iterating with an `Iterator` or `list.removeIf(...)`.",
    ],
    cpp: [
      "Prefer `std::vector<int>` to raw arrays: it knows its size and grows with `push_back`.",
      "`v[i]` does no bounds check; `v.at(i)` throws `std::out_of_range` instead of reading garbage.",
      "Assigning one vector to another copies every element. Pass vectors as `const vector<int>&` to avoid copies.",
      "`v.insert(v.begin() + i, x)` and `v.erase(v.begin() + i)` shift elements: O(n).",
    ],
    python: [
      "A `list` is a dynamic array: `append` is amortised O(1), while `insert(i, x)` and `pop(i)` are O(n).",
      "Negative indices count from the end: `arr[-1]` is the last element.",
      "Slicing (`arr[a:b]`) creates a copy, which costs O(b − a).",
      "`b = a` shares the list; copy with `a[:]` or `list(a)`.",
    ],
  },

  applications: [
    { title: 'Images', description: 'A photo is a 2D array of pixels; filters loop over the grid and adjust each value.' },
    { title: 'Leaderboards and tables', description: 'Ordered rows of scores or records are stored in arrays and accessed by position.' },
    { title: 'Audio and sensor data', description: 'Samples arrive at fixed intervals and are stored in arrays for fast, sequential processing.' },
    { title: 'Building other structures', description: 'Stacks, queues, heaps and hash tables are usually implemented on top of arrays.' },
  ],

  terminology: [
    { term: 'Index', definition: 'The position of an element. Arrays are 0-indexed in Java, C++ and Python, so the last index is `n − 1`.' },
    { term: 'Contiguous memory', definition: 'Elements are stored next to each other with no gaps.' },
    { term: 'Capacity vs size', definition: 'Capacity is the number of slots allocated; size is the number currently in use.' },
    { term: 'Dynamic array', definition: 'A resizable array (`ArrayList`, `vector`, Python `list`) that grows by allocating and copying.' },
    { term: 'Amortised O(1)', definition: 'An operation that is occasionally slow but O(1) on average over many calls.' },
    { term: 'Subarray', definition: 'A contiguous slice of an array, such as `arr[2..5]`.' },
    { term: 'Prefix sum', definition: '`prefix[i]` is the total of the first `i` elements, so it enables O(1) range-sum queries.' },
  ],

  examples: [
    {
      title: 'Insert and delete by shifting',
      description: 'A manual implementation shows exactly why middle insertions and deletions cost O(n). `size` tracks how many slots are in use.',
      code: java`
import java.util.Arrays;

public class ArrayOperations {
    // Inserts value at index, shifting later elements right.
    // Assumes size < arr.length (there is a free slot). Returns the new size.
    static int insert(int[] arr, int size, int index, int value) {
        for (int i = size; i > index; i--) {
            arr[i] = arr[i - 1];
        }
        arr[index] = value;
        return size + 1;
    }

    // Removes the element at index, shifting later elements left.
    static int delete(int[] arr, int size, int index) {
        for (int i = index; i < size - 1; i++) {
            arr[i] = arr[i + 1];
        }
        return size - 1;
    }

    public static void main(String[] args) {
        int[] arr = new int[10];          // capacity 10
        int size = 0;
        for (int v : new int[]{10, 20, 30, 40}) {
            arr[size++] = v;
        }
        System.out.println("Start:  " + Arrays.toString(Arrays.copyOf(arr, size)));

        size = insert(arr, size, 1, 15);
        System.out.println("Insert: " + Arrays.toString(Arrays.copyOf(arr, size)));

        size = delete(arr, size, 3);
        System.out.println("Delete: " + Arrays.toString(Arrays.copyOf(arr, size)));

        System.out.println("arr[2] = " + arr[2]);
    }
}`,
      notes: [
        { match: 'for (int i = size; i > index; i--)', text: 'Shift from the **end** backwards. Going forwards would overwrite values before they are moved.' },
        { match: 'arr[i] = arr[i + 1];', text: 'Deleting pulls each later element one slot left, overwriting the removed value.' },
        { match: 'arr[size++] = v;', text: 'Writes into the next free slot, then increments `size`: the same idea as `ArrayList.add`.' },
        { match: 'Arrays.copyOf(arr, size)', text: 'Prints only the slots in use, not the unused capacity.' },
      ],
      output: 'Start:  [10, 20, 30, 40]\nInsert: [10, 15, 20, 30, 40]\nDelete: [10, 15, 20, 40]\narr[2] = 20',
      time: 'Insert/delete O(n), access O(1)',
      space: 'O(1) extra: works in place',
    },
    {
      title: 'Two pointers and prefix sums',
      description: 'Two of the most common array patterns: reversing in place by moving pointers inward, and answering range-sum queries instantly.',
      code: java`
import java.util.Arrays;

public class ArrayPatterns {
    // Two pointers: swap the ends and move inward
    static void reverse(int[] arr) {
        int left = 0, right = arr.length - 1;
        while (left < right) {
            int temp = arr[left];
            arr[left] = arr[right];
            arr[right] = temp;
            left++;
            right--;
        }
    }

    // prefix[i] = sum of arr[0..i-1], so prefix[0] = 0
    static int[] prefixSums(int[] arr) {
        int[] prefix = new int[arr.length + 1];
        for (int i = 0; i < arr.length; i++) {
            prefix[i + 1] = prefix[i] + arr[i];
        }
        return prefix;
    }

    public static void main(String[] args) {
        int[] nums = {3, 1, 4, 1, 5, 9};
        int[] prefix = prefixSums(nums);
        // Sum of nums[1..4] = prefix[5] - prefix[1]
        System.out.println("Prefix: " + Arrays.toString(prefix));
        System.out.println("Sum of index 1..4: " + (prefix[5] - prefix[1]));

        reverse(nums);
        System.out.println("Reversed: " + Arrays.toString(nums));
    }
}`,
      notes: [
        { match: 'while (left < right)', text: 'Stop when the pointers meet. For odd lengths the middle element stays where it is.' },
        { match: 'int[] prefix = new int[arr.length + 1];', text: 'One extra slot so `prefix[0] = 0`, which removes special cases for ranges starting at 0.' },
        { match: '(prefix[5] - prefix[1])', text: 'Sum of `nums[l..r]` = `prefix[r + 1] − prefix[l]`, an O(1) query after O(n) setup.' },
      ],
      output: 'Prefix: [0, 3, 4, 8, 9, 14, 23]\nSum of index 1..4: 11\nReversed: [9, 5, 1, 4, 1, 3]',
      time: 'Reverse O(n); prefix build O(n); each range query O(1)',
      space: 'Reverse O(1); prefix array O(n)',
    },
  ],

  algorithm: {
    title: 'Inserting a value at index i',
    steps: [
      'Check there is a free slot (`size < capacity`) and that `0 ≤ i ≤ size`. Otherwise the insert is invalid.',
      'Start a pointer `j` at `size`, the first free slot.',
      'While `j > i`: copy `arr[j − 1]` into `arr[j]` and decrement `j`. Each element moves one step right.',
      'The slot at index `i` is now free. Write the new value there.',
      'Increase `size` by 1.',
    ],
    dryRun: {
      title: 'Insert 15 at index 1 into [10, 20, 30, 40]',
      lines: [
        'size = 4 → arr[4] = arr[3] → [10, 20, 30, 40, 40]',
        'arr[3] = arr[2] → [10, 20, 30, 30, 40]',
        'arr[2] = arr[1] → [10, 20, 20, 30, 40]',
        'arr[1] = 15 → [10, 15, 20, 30, 40], size = 5',
      ],
    },
  },

  complexity: {
    columns: ['Operation', 'Time', 'Notes'],
    rows: [
      ['Access / update by index', 'O(1)', 'Address is computed directly'],
      ['Search (unsorted)', 'O(n)', 'May need to check every element'],
      ['Search (sorted)', 'O(log n)', 'Binary search'],
      ['Insert / delete at end', 'O(1)', 'Amortised for dynamic arrays'],
      ['Insert / delete at index', 'O(n)', 'Elements must shift'],
      ['Range sum with prefix sums', 'O(1)', 'After O(n) preprocessing'],
    ],
    note: 'An array of n elements uses O(n) space. In-place algorithms like reverse need only O(1) extra space.',
  },

  mistakes: [
    { mistake: 'Reading past the end of the array, e.g. at index `n`.', fix: 'The last valid index is `n − 1`. Java throws an exception, Python raises `IndexError`, and C++ silently reads whatever memory is there.' },
    { mistake: 'Shifting in the wrong direction during insert, which overwrites values.', fix: 'For insert, shift from the end backwards; for delete, shift from the index forwards.' },
    { mistake: 'Inserting at the front of a large array inside a loop.', fix: 'Each insert shifts everything, so the loop is O(n²). Append and reverse at the end, or use a deque.' },
    { mistake: 'Assuming `b = a` copies the array.', fix: 'In Java and Python both names now refer to the same array or list, so copy explicitly. In C++, assigning a `vector` does copy it, which can be slow.' },
    { mistake: 'Removing elements while looping forwards over the same array.', fix: 'Indices shift under you and elements get skipped. Loop backwards, or build a new filtered array.' },
  ],

  takeaways: [
    'Arrays give O(1) access by index because elements are contiguous.',
    'Inserting or deleting anywhere except the end costs O(n) because elements shift.',
    'Use a dynamic array when the size changes. Appending is amortised O(1).',
    'Two pointers, prefix sums and sliding windows turn many O(n²) problems into O(n).',
    'Always reason about index bounds: 0 to `length − 1`.',
  ],

  practice: ['two-sum', 'best-time-to-buy-and-sell-stock', 'maximum-subarray', 'trapping-rain-water'],
};
