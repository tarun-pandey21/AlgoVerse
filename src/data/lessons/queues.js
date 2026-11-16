import { java } from './helpers.js';

export default {
  summary:
    'A queue is a line: first come, first served. Queues schedule work fairly, buffer data between producers and consumers, and drive breadth-first search.',

  introduction: [
    'A **queue** removes elements in the same order they were added: **FIFO** (First In, First Out). Like a line at a ticket counter, people join at the back (the **rear**) and are served from the front.',
    'The two core operations are **enqueue** (add at the rear) and **dequeue** (remove from the front), both O(1) when implemented well. Queues are everywhere in systems that process requests in arrival order.',
  ],

  concepts: [
    {
      heading: 'FIFO behaviour',
      paragraphs: [
        'Elements leave in the order they arrived. Enqueue A, B, C and dequeue three times: you get A, B, C. Compare this with a stack, which would return C, B, A.',
      ],
    },
    {
      heading: 'The circular array trick',
      paragraphs: [
        'A naive array queue that removes from index 0 must shift every element left: O(n) per dequeue. A **circular queue** instead keeps a `front` index and wraps around using the modulo operator, reusing freed slots at the beginning. Both operations become O(1).',
      ],
    },
    {
      heading: 'Variations',
      paragraphs: [],
      points: [
        '**Deque** (double-ended queue): add or remove at both ends. Can act as both a stack and a queue.',
        '**Priority queue:** removes the highest-priority element first rather than the oldest (covered in the Heaps lesson).',
        '**Blocking queue:** waits when empty or full; used to coordinate threads.',
      ],
    },
    {
      heading: 'Library queues',
      paragraphs: [
        'Every mainstream language ships an efficient queue, usually built on a circular buffer or linked blocks, with O(1) operations at both ends. The notes below show which type to use in your language and its method names.',
      ],
    },
  ],

  languageNotes: {
    java: [
      "Declare `Queue<Integer> q = new ArrayDeque<>();` and use `offer`, `poll` and `peek`.",
      "`offer` / `poll` / `peek` return `false` or `null` on failure; `add` / `remove` / `element` throw exceptions instead.",
      "`ArrayDeque` is usually faster than `LinkedList` as a queue.",
    ],
    cpp: [
      "`std::queue<int>` provides `push`, `front`, `pop`, `empty` and `size`.",
      "`pop()` returns nothing, so read `front()` first.",
      "`std::deque` supports `push_front`, `push_back`, `pop_front`, `pop_back` and indexing.",
    ],
    python: [
      "Use `collections.deque`: `append` to enqueue and `popleft` to dequeue, both O(1).",
      "Avoid `list.pop(0)` as a dequeue: it shifts every element, O(n).",
      "`queue.Queue` is a thread-safe queue for producer/consumer programs.",
    ],
  },

  applications: [
    { title: 'Task scheduling', description: 'Operating systems queue processes for CPU time; printers queue print jobs.' },
    { title: 'Web servers and message brokers', description: 'Incoming requests and messages wait in queues until a worker is free.' },
    { title: 'Breadth-first search', description: 'BFS explores a graph level by level using a queue, e.g. to find shortest paths in unweighted maps.' },
    { title: 'Streaming buffers', description: 'Video and audio players buffer chunks in a queue to smooth out network delays.' },
  ],

  terminology: [
    { term: 'FIFO', definition: 'First In, First Out: the oldest element is removed first.' },
    { term: 'Enqueue', definition: 'Add an element at the rear.' },
    { term: 'Dequeue', definition: 'Remove and return the element at the front.' },
    { term: 'Front / rear', definition: 'The positions where elements leave and join.' },
    { term: 'Circular queue', definition: 'An array-based queue whose indices wrap around to reuse space.' },
    { term: 'Deque', definition: 'Double-ended queue supporting insertion and removal at both ends.' },
  ],

  examples: [
    {
      title: 'Circular queue on a fixed array',
      description: 'The rear position is computed from `front + size`, wrapped with `%`. After a dequeue, the freed slot is reused immediately.',
      code: java`
public class CircularQueue {
    private final int[] data;
    private int front = 0, size = 0;

    CircularQueue(int capacity) { data = new int[capacity]; }

    void enqueue(int value) {
        if (size == data.length) throw new IllegalStateException("Queue is full");
        int rear = (front + size) % data.length;   // wrap around the end
        data[rear] = value;
        size++;
    }

    int dequeue() {
        if (size == 0) throw new IllegalStateException("Queue is empty");
        int value = data[front];
        front = (front + 1) % data.length;
        size--;
        return value;
    }

    public static void main(String[] args) {
        CircularQueue q = new CircularQueue(3);
        q.enqueue(1);
        q.enqueue(2);
        q.enqueue(3);
        System.out.println("Dequeued: " + q.dequeue());
        q.enqueue(4);            // reuses the slot freed at index 0
        while (q.size > 0) {
            System.out.println("Dequeued: " + q.dequeue());
        }
    }
}`,
      notes: [
        { match: 'private int front = 0, size = 0;', text: 'Tracking `size` makes it easy to tell “full” from “empty”, which both have the same `front`/`rear` pattern.' },
        { match: 'int rear = (front + size) % data.length;', text: 'Modulo wraps the index back to 0 after the last slot.' },
        { match: 'front = (front + 1) % data.length;', text: 'Dequeue just moves `front` forward; nothing is shifted.' },
      ],
      output: 'Dequeued: 1\nDequeued: 2\nDequeued: 3\nDequeued: 4',
      time: 'enqueue, dequeue: O(1)',
      space: 'O(capacity)',
    },
    {
      title: 'Using the standard library queue and deque',
      description: 'Everyday use of the standard library: a print-job queue, and a deque that adds at both ends.',
      code: java`
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Queue;

public class QueueApi {
    public static void main(String[] args) {
        Queue<String> printJobs = new ArrayDeque<>();
        printJobs.offer("report.pdf");           // enqueue at the rear
        printJobs.offer("photo.png");
        printJobs.offer("notes.txt");
        System.out.println("Next job: " + printJobs.peek());
        System.out.println("Printing: " + printJobs.poll());   // dequeue the front
        System.out.println("Waiting: " + printJobs);

        // A deque adds and removes at both ends
        Deque<Integer> deque = new ArrayDeque<>();
        deque.offerFirst(2);
        deque.offerLast(3);
        deque.offerFirst(1);
        System.out.println("Deque: " + deque);
        System.out.println("Removed from back: " + deque.pollLast());
    }
}`,
      notes: [
        { match: 'printJobs.peek()', text: '`peek` looks at the front without removing it (returns `null` if empty).' },
        { match: 'printJobs.poll()', text: '`poll` removes the front: the oldest job, “report.pdf”.' },
        { match: 'deque.offerFirst(1);', text: 'A deque can add at the front too, so 1 ends up before 2.' },
      ],
      output: 'Next job: report.pdf\nPrinting: report.pdf\nWaiting: [photo.png, notes.txt]\nDeque: [1, 2, 3]\nRemoved from back: 3',
      time: 'Add, remove and peek at either end: O(1)',
      space: 'O(n)',
    },
  ],

  algorithm: {
    title: 'Enqueue and dequeue in a circular queue',
    steps: [
      'Keep an array of capacity `c`, an index `front` and a counter `size`.',
      'Enqueue: if `size == c` the queue is full. Otherwise write at `(front + size) % c` and increment `size`.',
      'Dequeue: if `size == 0` the queue is empty. Otherwise read `data[front]`, set `front = (front + 1) % c`, decrement `size` and return the value.',
      'Peek: return `data[front]` without changing anything.',
    ],
    dryRun: {
      title: 'Capacity 3: enqueue 1, 2, 3 → dequeue → enqueue 4',
      lines: [
        'enqueue 1, 2, 3 → data=[1, 2, 3], front=0, size=3 (full)',
        'dequeue → returns 1, front=1, size=2',
        'enqueue 4 → rear=(1+2)%3=0 → data=[4, 2, 3], size=3',
        'dequeue order from here: 2, 3, 4',
      ],
    },
  },

  complexity: {
    columns: ['Operation', 'Circular array', 'Naive array (shift on dequeue)'],
    rows: [
      ['enqueue', 'O(1)', 'O(1)'],
      ['dequeue', 'O(1)', 'O(n)'],
      ['peek', 'O(1)', 'O(1)'],
      ['search', 'O(n)', 'O(n)'],
    ],
    note: 'Library deques (Java `ArrayDeque`, C++ `std::deque`, Python `collections.deque`) give O(1) operations at both ends.',
  },

  mistakes: [
    { mistake: 'Dequeuing by removing index 0 of a dynamic array.', fix: 'That shifts every element: O(n). Use a real queue or deque.' },
    { mistake: 'Forgetting the modulo, so indices run past the array end.', fix: 'Always wrap: `(index + 1) % capacity`.' },
    { mistake: 'Confusing full and empty when tracking only `front` and `rear`.', fix: 'Track `size` too, or leave one slot permanently empty.' },
    { mistake: 'Dequeuing from an empty queue.', fix: 'Check that the queue isn’t empty first. Depending on the language you get an exception, a `null`, or undefined behaviour.' },
  ],

  takeaways: [
    'Queues are FIFO: enqueue at the rear, dequeue from the front, both O(1).',
    'A circular array avoids shifting by wrapping indices with `%`.',
    'Use the library deque for queues: `ArrayDeque`, `std::queue` / `std::deque` or `collections.deque`.',
    'Breadth-first search, scheduling and buffering all rely on queues.',
  ],

  practice: ['number-of-recent-calls', 'sliding-window-maximum', 'binary-tree-level-order-traversal'],
};
