import { java } from './helpers.js';

export default {
  summary:
    'A heap always knows its smallest (or largest) element. It powers priority queues, top-k problems, scheduling and Dijkstra’s shortest-path algorithm.',

  introduction: [
    'A **heap** is a complete binary tree with the **heap property**: in a **min-heap**, every parent is smaller than or equal to its children, so the minimum sits at the root. A **max-heap** is the mirror image.',
    'A heap is only partially ordered. Siblings can be in any order, so it is *not* sorted. That looser rule is exactly what makes it fast: you can read the minimum in O(1) and insert or remove in O(log n).',
  ],

  concepts: [
    {
      heading: 'Stored as an array',
      paragraphs: [
        'Because a heap is a **complete** tree, it fits perfectly in an array with no gaps and no pointers. For the node at index `i`:',
      ],
      points: [
        'Parent: `(i − 1) / 2`',
        'Left child: `2i + 1`',
        'Right child: `2i + 2`',
      ],
    },
    {
      heading: 'Sift up (insert)',
      paragraphs: [
        'Place the new element at the end of the array (the next free spot in the bottom level), then repeatedly swap it with its parent while it is smaller than the parent. It rises at most `log n` levels.',
      ],
    },
    {
      heading: 'Sift down (extract)',
      paragraphs: [
        'Remove the root, move the last element into the root position, then repeatedly swap it with its **smaller** child while it is larger than that child. This also takes at most `log n` swaps.',
      ],
    },
    {
      heading: 'Heaps in standard libraries',
      paragraphs: [
        'You rarely write a heap yourself: Java, C++ and Python all ship one (see the notes below). Watch for two differences: some libraries give a min-heap by default and others a max-heap, and iterating over a heap’s storage does **not** give sorted order. Only repeatedly removing the top does.',
      ],
    },
  ],

  languageNotes: {
    java: [
      "`PriorityQueue<Integer>` is a min-heap: `offer`, `poll` and `peek`.",
      "For a max-heap: `new PriorityQueue<>(Collections.reverseOrder())`.",
      "Printing or iterating a `PriorityQueue` does not give sorted order.",
    ],
    cpp: [
      "`std::priority_queue<int>` is a **max-heap** by default: `push`, `top` and `pop`.",
      "For a min-heap: `priority_queue<int, vector<int>, greater<int>>`.",
      "`pop()` returns nothing, so read `top()` first.",
    ],
    python: [
      "`heapq` turns a plain list into a min-heap: `heappush`, `heappop`, and `heap[0]` to peek.",
      "There is no max-heap: push negated values (`-x`) and negate them again when popping.",
      "`heapq.nlargest(k, xs)` and `heapq.nsmallest(k, xs)` solve top-k directly.",
    ],
  },

  applications: [
    { title: 'Task and CPU scheduling', description: 'Run the highest-priority job next; operating systems and job queues use priority queues.' },
    { title: 'Shortest paths and routing', description: 'Dijkstra’s and A* algorithms repeatedly take the closest unexplored node from a min-heap.' },
    { title: 'Top-k and streaming', description: 'Keep the k largest values seen so far (trending topics, top scores) with a size-k heap.' },
    { title: 'Merging sorted data', description: 'Merging k sorted files or lists takes the smallest head from a heap each step.' },
  ],

  terminology: [
    { term: 'Heap property', definition: 'Each parent ≤ its children (min-heap) or ≥ its children (max-heap).' },
    { term: 'Complete binary tree', definition: 'All levels full except possibly the last, which fills left to right.' },
    { term: 'Sift up / bubble up', definition: 'Move an element towards the root until the heap property holds.' },
    { term: 'Sift down / heapify', definition: 'Move an element towards the leaves until the heap property holds.' },
    { term: 'Priority queue', definition: 'An abstract queue that removes the highest-priority element first; usually implemented with a heap.' },
    { term: 'Build-heap', definition: 'Turning an arbitrary array into a heap in O(n) by sifting down from the last parent.' },
  ],

  examples: [
    {
      title: 'Library heaps: min-heap, max-heap and kth largest',
      description: 'The standard-library heap, plus the “keep a min-heap of size k” trick for the kth largest element.',
      code: java`
import java.util.Collections;
import java.util.PriorityQueue;

public class HeapBasics {
    public static void main(String[] args) {
        int[] values = {5, 1, 8, 3, 9, 2};
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        for (int x : values) {
            minHeap.offer(x);
            maxHeap.offer(x);
        }
        System.out.println("Smallest: " + minHeap.peek());
        System.out.println("Largest: " + maxHeap.peek());

        StringBuilder order = new StringBuilder();
        while (!minHeap.isEmpty()) order.append(minHeap.poll()).append(' ');
        System.out.println("Polled in order: " + order.toString().trim());

        // Kth largest: keep a min-heap of the k largest values seen so far
        int k = 3;
        PriorityQueue<Integer> topK = new PriorityQueue<>();
        for (int x : values) {
            topK.offer(x);
            if (topK.size() > k) topK.poll();   // drop the smallest
        }
        System.out.println(k + "rd largest: " + topK.peek());
    }
}`,
      notes: [
        { match: 'new PriorityQueue<>(Collections.reverseOrder())', text: 'Reversing the comparator turns Java’s min-heap into a max-heap.' },
        { match: 'minHeap.poll()', text: 'Each `poll` removes the current minimum in O(log n), so repeated polling yields sorted order (heap sort).' },
        { match: 'if (topK.size() > k) topK.poll();', text: 'The heap never holds more than k items, and its root is the kth largest so far: O(n log k) total.' },
      ],
      output: 'Smallest: 1\nLargest: 9\nPolled in order: 1 2 3 5 8 9\n3rd largest: 5',
      time: 'push/pop O(log n), peek O(1); top-k O(n log k)',
      space: 'O(n), or O(k) for the top-k heap',
    },
    {
      title: 'A min-heap from scratch',
      description: 'Array-based heap with sift-up on insert and sift-down on extract.',
      code: java`
import java.util.Arrays;

public class MinHeap {
    private int[] heap = new int[16];
    private int size = 0;

    // For a node at index i: parent (i-1)/2, children 2i+1 and 2i+2
    void insert(int value) {
        if (size == heap.length) heap = Arrays.copyOf(heap, size * 2);
        heap[size] = value;
        int i = size++;
        while (i > 0 && heap[(i - 1) / 2] > heap[i]) {   // sift up
            swap(i, (i - 1) / 2);
            i = (i - 1) / 2;
        }
    }

    int extractMin() {
        if (size == 0) throw new IllegalStateException("Heap is empty");
        int min = heap[0];
        heap[0] = heap[--size];          // move the last element to the root
        int i = 0;
        while (true) {                   // sift down
            int left = 2 * i + 1, right = 2 * i + 2, smallest = i;
            if (left < size && heap[left] < heap[smallest]) smallest = left;
            if (right < size && heap[right] < heap[smallest]) smallest = right;
            if (smallest == i) break;
            swap(i, smallest);
            i = smallest;
        }
        return min;
    }

    private void swap(int a, int b) { int t = heap[a]; heap[a] = heap[b]; heap[b] = t; }

    public static void main(String[] args) {
        MinHeap h = new MinHeap();
        for (int x : new int[]{40, 10, 30, 5, 20}) h.insert(x);
        System.out.println("Heap array: " + Arrays.toString(Arrays.copyOf(h.heap, h.size)));
        System.out.print("Extracted: ");
        for (int i = 0; i < 5; i++) System.out.print(h.extractMin() + " ");
        System.out.println();
    }
}`,
      notes: [
        { match: 'while (i > 0 && heap[(i - 1) / 2] > heap[i])', text: 'Sift up: swap with the parent while the parent is larger.' },
        { match: 'heap[0] = heap[--size];', text: 'Moving the last element to the root keeps the tree complete; sift-down then repairs the order.' },
        { match: 'if (smallest == i) break;', text: 'Stop when the node is no larger than both children: the heap property is restored.' },
      ],
      output: 'Heap array: [5, 10, 30, 40, 20]\nExtracted: 5 10 20 30 40',
      time: 'insert and extractMin O(log n)',
      space: 'O(n)',
    },
  ],

  algorithm: {
    title: 'Inserting into a min-heap (sift up)',
    steps: [
      'Append the new value at index `size` (the next free leaf position) and increase `size`.',
      'Let `i` be the new element’s index.',
      'While `i > 0` and the parent at `(i − 1) / 2` is larger than `heap[i]`, swap them.',
      'Set `i` to the parent index and repeat.',
      'Stop when the parent is smaller or `i` reaches the root. The heap property holds again.',
    ],
    dryRun: {
      title: 'Insert 5 into [10, 40, 30]',
      lines: [
        'Append → [10, 40, 30, 5], i = 3',
        'Parent index 1 holds 40 > 5 → swap → [10, 5, 30, 40], i = 1',
        'Parent index 0 holds 10 > 5 → swap → [5, 10, 30, 40], i = 0',
        'At the root: stop. Minimum is 5',
      ],
    },
  },

  complexity: {
    columns: ['Operation', 'Time'],
    rows: [
      ['peek (min/max)', 'O(1)'],
      ['insert / push', 'O(log n)'],
      ['extract / pop', 'O(log n)'],
      ['Build heap from n items', 'O(n)'],
      ['Heap sort', 'O(n log n)'],
      ['Search for an arbitrary value', 'O(n)'],
      ['Top-k of n items with a size-k heap', 'O(n log k)'],
    ],
    note: 'Heaps use O(n) space in a plain array, with no per-node pointers.',
  },

  mistakes: [
    { mistake: 'Expecting a heap to iterate or print in sorted order.', fix: 'Only repeatedly removing the top returns elements in priority order.' },
    { mistake: 'Building a max-heap with a subtraction comparator.', fix: 'Subtraction can overflow with fixed-size ints. Use a proper reverse comparator, or negate values (Python).' },
    { mistake: 'Using a max-heap for “k largest”.', fix: 'Use a min-heap of size k: its root is the smallest of the top k, which is the one to evict.' },
    { mistake: 'Swapping with any child during sift-down.', fix: 'Always swap with the smaller child (min-heap), or the order breaks.' },
  ],

  takeaways: [
    'A heap gives O(1) access to the min (or max) and O(log n) insert/remove.',
    'It is stored compactly in an array: parent `(i − 1) / 2`, children `2i + 1`, `2i + 2`.',
    'Heaps are partially ordered, not sorted.',
    'Know your library’s default: a min-heap in Java and Python, a max-heap in C++.',
    'Size-k heaps solve top-k problems in O(n log k).',
  ],

  practice: ['kth-largest-element', 'last-stone-weight', 'sliding-window-maximum'],
};
