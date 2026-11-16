import { java } from './helpers.js';

export default {
  summary:
    'A linked list chains nodes together with pointers. You trade O(1) random access for cheap insertion and removal, and you learn the pointer manipulation that trees and graphs rely on.',

  introduction: [
    'A **linked list** is a sequence of **nodes**, where each node stores a value and a reference to the next node. Unlike an array, the nodes can live anywhere in memory; the references are what hold the list together.',
    'There is no index arithmetic, so reaching the 500th element means following 500 links. In exchange, once you are at a position, inserting or removing a node is just a couple of pointer updates, with no shifting.',
  ],

  concepts: [
    {
      heading: 'Nodes and the head',
      paragraphs: [
        'The list is accessed through a reference to its first node, the **head**. The last node’s `next` is empty (`null` in Java, `nullptr` in C++, `None` in Python), which marks the end. An empty list has no head at all.',
      ],
    },
    {
      heading: 'Singly vs doubly linked',
      paragraphs: [],
      points: [
        '**Singly linked:** each node points to the next node only. Simple and memory-light.',
        '**Doubly linked:** nodes also point to the previous node, so you can traverse backwards and delete a node in O(1) when you hold a reference to it. Library linked lists (Java’s `LinkedList`, C++’s `std::list`) are doubly linked.',
        '**Circular:** the last node points back to the first. Useful for round-robin scheduling.',
      ],
    },
    {
      heading: 'Pointer manipulation',
      paragraphs: [
        'Almost every linked list operation is about changing `next` references in the right order. Losing the only reference to a node means losing the rest of the list, so a common habit is to save `curr.next` in a temporary variable before overwriting it.',
        'A **dummy (sentinel) node** placed before the head removes special cases when the head itself might change, for example while deleting or merging.',
      ],
    },
    {
      heading: 'Fast and slow pointers',
      paragraphs: [
        'Move one pointer one step at a time and another two steps at a time. When the fast pointer reaches the end, the slow pointer is in the middle. If the list has a cycle, the fast pointer eventually laps the slow one and they meet (Floyd’s cycle detection).',
      ],
    },
  ],

  languageNotes: {
    java: [
      "`java.util.LinkedList` is doubly linked; `get(i)` walks the list, so it is O(n).",
      "Removed nodes are freed automatically by the garbage collector.",
    ],
    cpp: [
      "Every node created with `new` must be freed with `delete`, or the program leaks memory. Smart pointers (`std::unique_ptr`) can automate this.",
      "`std::list` is a doubly linked list and `std::forward_list` is singly linked.",
      "Dereferencing `nullptr` (e.g. `curr->next` when `curr` is null) crashes the program.",
    ],
    python: [
      "Build nodes with a small class; `None` marks the end of the list.",
      "There is no built-in linked list type, but `collections.deque` covers most queue and stack needs.",
      "Test for the end with `is None` / `is not None`.",
    ],
  },

  applications: [
    { title: 'Browser history', description: 'Back/forward navigation maps naturally to a doubly linked list of pages.' },
    { title: 'Music playlists', description: 'Next/previous track and repeat-all (a circular list) are linked list operations.' },
    { title: 'LRU caches', description: 'A doubly linked list plus a hash map gives O(1) “move to front” and eviction.' },
    { title: 'Hash table buckets', description: 'Separate chaining stores colliding keys in short linked lists.' },
  ],

  terminology: [
    { term: 'Node', definition: 'An element holding data plus a reference to the next (and maybe previous) node.' },
    { term: 'Head / tail', definition: 'The first and last nodes of the list.' },
    { term: 'Null reference', definition: 'A reference to nothing (`null`, `nullptr`, `None`); marks the end of a singly linked list.' },
    { term: 'Traversal', definition: 'Visiting each node by following `next` references from the head.' },
    { term: 'Dummy node', definition: 'A placeholder before the head that simplifies edge cases.' },
    { term: 'Cycle', definition: 'A node’s `next` points back to an earlier node, so traversal never reaches the end.' },
  ],

  examples: [
    {
      title: 'Building a singly linked list',
      description: 'Insert at the head and tail, delete by value, and print. Pay attention to the empty-list and delete-the-head cases.',
      code: java`
public class LinkedListDemo {
    static class Node {
        int data;
        Node next;
        Node(int data) { this.data = data; }
    }

    static Node head;

    static void addFirst(int value) {
        Node node = new Node(value);
        node.next = head;     // new node points to the old head
        head = node;
    }

    static void addLast(int value) {
        Node node = new Node(value);
        if (head == null) { head = node; return; }
        Node curr = head;
        while (curr.next != null) curr = curr.next;   // walk to the tail
        curr.next = node;
    }

    static void delete(int value) {
        if (head == null) return;
        if (head.data == value) { head = head.next; return; }
        Node curr = head;
        while (curr.next != null && curr.next.data != value) curr = curr.next;
        if (curr.next != null) curr.next = curr.next.next;  // skip the node
    }

    static void print() {
        StringBuilder sb = new StringBuilder();
        for (Node curr = head; curr != null; curr = curr.next) {
            sb.append(curr.data).append(" -> ");
        }
        System.out.println(sb.append("null"));
    }

    public static void main(String[] args) {
        addLast(20);
        addLast(30);
        addFirst(10);
        print();
        delete(20);
        print();
    }
}`,
      notes: [
        { match: 'node.next = head;', text: 'Link the new node to the old head *before* moving `head`, or the old list would be lost.' },
        { match: 'while (curr.next != null) curr = curr.next;', text: 'Reaching the tail is O(n). Keeping a separate `tail` reference makes `addLast` O(1).' },
        { match: 'if (head.data == value) { head = head.next; return; }', text: 'Deleting the head is a special case because no previous node points to it.' },
        { match: 'curr.next = curr.next.next;', text: 'Bypassing the node removes it; Java’s garbage collector frees it.' },
      ],
      output: '10 -> 20 -> 30 -> null\n10 -> 30 -> null',
      time: 'addFirst O(1); addLast, delete O(n)',
      space: 'O(n) for n nodes; O(1) extra per operation',
    },
    {
      title: 'Reversing a list and finding the middle',
      description: 'Two essential techniques: three-pointer reversal, and fast/slow pointers.',
      code: java`
public class ReverseList {
    static class Node {
        int data;
        Node next;
        Node(int data, Node next) { this.data = data; this.next = next; }
    }

    static Node reverse(Node head) {
        Node prev = null, curr = head;
        while (curr != null) {
            Node next = curr.next;   // save the rest of the list
            curr.next = prev;        // reverse this pointer
            prev = curr;
            curr = next;
        }
        return prev;                 // prev is the new head
    }

    // Fast moves 2 steps, slow moves 1: slow ends in the middle
    static Node middle(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }

    static String format(Node head) {
        StringBuilder sb = new StringBuilder();
        for (Node n = head; n != null; n = n.next) {
            sb.append(n.data);
            if (n.next != null) sb.append(" -> ");
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        Node head = new Node(1, new Node(2, new Node(3, new Node(4, new Node(5, null)))));
        System.out.println("Middle: " + middle(head).data);
        head = reverse(head);
        System.out.println("Reversed: " + format(head));
    }
}`,
      notes: [
        { match: 'Node next = curr.next;   // save', text: 'Save the next node first. The following line breaks the only link to it.' },
        { match: 'curr.next = prev;', text: 'Point the current node backwards: the actual reversal.' },
        { match: 'while (fast != null && fast.next != null)', text: 'Both checks are needed so `fast.next.next` never dereferences `null`.' },
      ],
      output: 'Middle: 3\nReversed: 5 -> 4 -> 3 -> 2 -> 1',
      time: 'O(n) each',
      space: 'O(1) extra',
    },
  ],

  algorithm: {
    title: 'Reversing a singly linked list in place',
    steps: [
      'Set `prev` to empty (null) and `curr = head`.',
      'While `curr` is not null: save `next = curr.next`.',
      'Point the current node backwards: `curr.next = prev`.',
      'Advance both pointers: `prev = curr`, then `curr = next`.',
      'When `curr` becomes null, `prev` is the new head. Return it.',
    ],
    dryRun: {
      title: 'Reverse 1 → 2 → 3',
      lines: [
        'prev=null, curr=1 → 1.next=null, prev=1, curr=2',
        'curr=2 → 2.next=1, prev=2, curr=3',
        'curr=3 → 3.next=2, prev=3, curr=null',
        'Return prev: 3 → 2 → 1 → null',
      ],
    },
  },

  complexity: {
    columns: ['Operation', 'Singly linked', 'Array (for comparison)'],
    rows: [
      ['Access k-th element', 'O(n)', 'O(1)'],
      ['Search by value', 'O(n)', 'O(n)'],
      ['Insert / delete at head', 'O(1)', 'O(n)'],
      ['Insert at tail', 'O(n), or O(1) with a tail pointer', 'O(1) amortised'],
      ['Insert / delete after a known node', 'O(1)', 'O(n)'],
      ['Reverse', 'O(n) time, O(1) space', 'O(n) time, O(1) space'],
    ],
    note: 'Each node also stores a reference, so a linked list uses more memory per element than an array and has poorer cache locality.',
  },

  mistakes: [
    { mistake: 'Following a link that doesn’t exist, e.g. `curr.next.next` when `curr.next` is empty.', fix: 'Check each link before following it. Java throws `NullPointerException`, Python raises `AttributeError`, and C++ crashes.' },
    { mistake: 'Overwriting `curr.next` before saving it during reversal.', fix: 'Always store `Node next = curr.next;` first.' },
    { mistake: 'Forgetting to update `head` when the first node changes.', fix: 'Return the new head, or use a dummy node in front of the list.' },
    { mistake: 'Moving `head` itself to traverse the list.', fix: 'Use a separate `curr` pointer so you don’t lose the start.' },
    { mistake: 'Assuming a library linked list supports fast indexing.', fix: 'Getting the i-th element is O(n). Iterate through the list instead of indexing.' },
  ],

  takeaways: [
    'Nodes linked by references; no contiguous memory and no O(1) indexing.',
    'Insertion and deletion are O(1) once you have a reference to the right node.',
    'Save `next` before rewiring pointers, and check every link exists before following it.',
    'Dummy nodes and fast/slow pointers solve a large class of list problems.',
    'Prefer a dynamic array unless you need frequent inserts/removals at known positions.',
  ],

  practice: ['reverse-linked-list', 'merge-two-sorted-lists'],
};
