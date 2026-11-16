import { java } from './helpers.js';

export default {
  summary:
    'A binary search tree keeps its keys ordered so that every comparison discards a whole subtree. It is binary search in a structure that also supports fast inserts and deletes.',

  introduction: [
    'A **binary search tree (BST)** is a binary tree with one ordering rule: for every node, all keys in its **left** subtree are smaller and all keys in its **right** subtree are larger.',
    'That rule means you never need to explore both children. To find a key, compare it with the current node and go left or right, just like binary search on a sorted array. Unlike an array, a BST can also insert and delete without shifting elements.',
  ],

  concepts: [
    {
      heading: 'The BST property',
      paragraphs: [
        'The rule applies to **entire subtrees**, not just immediate children. A node in the left subtree of the root must be smaller than the root even if it sits deep down on a right branch. This is the most common source of bugs when validating BSTs.',
      ],
    },
    {
      heading: 'Search and insert',
      paragraphs: [
        'Both walk a single path from the root. Search stops when it finds the key or runs out of tree. Insert walks the same path and attaches a new leaf where the search ended. Each costs O(h), where h is the tree’s height.',
      ],
    },
    {
      heading: 'Deletion: three cases',
      paragraphs: [],
      points: [
        '**Leaf:** simply remove it.',
        '**One child:** replace the node with its child.',
        '**Two children:** copy in the **inorder successor** (the smallest key in the right subtree), then delete that successor, which has at most one child.',
      ],
    },
    {
      heading: 'Balance',
      paragraphs: [
        'Inserting already-sorted keys (1, 2, 3, 4, …) produces a skewed tree where every operation is O(n). **Self-balancing** BSTs such as AVL and red-black trees rotate nodes to keep the height around log n. Standard libraries provide balanced trees, so in practice you use those (see the notes below).',
      ],
    },
  ],

  languageNotes: {
    java: [
      "`TreeMap` and `TreeSet` are red-black trees with guaranteed O(log n) operations.",
      "They offer `floorKey`, `ceilingKey`, `higherKey`, `lowerKey` and range views such as `subMap`.",
    ],
    cpp: [
      "`std::map` and `std::set` are balanced (red-black) trees with guaranteed O(log n) operations.",
      "`lower_bound(x)` finds the ceiling (first key ≥ x) and `upper_bound(x)` the first key > x.",
    ],
    python: [
      "There is no built-in balanced BST. Use a sorted list with `bisect` for mostly static data, or the third-party `sortedcontainers` package.",
      "Recursive BST code on skewed data can hit the recursion limit; an iterative search avoids it.",
    ],
  },

  applications: [
    { title: 'Ordered maps and sets', description: 'Ordered maps and sets keep keys sorted, supporting range queries such as “all bookings between 2pm and 5pm”.' },
    { title: 'Leaderboards', description: 'Balanced BSTs support rank queries and “next higher score” lookups in O(log n).' },
    { title: 'Database indexes', description: 'B-trees, a generalisation of BSTs, index most relational databases.' },
    { title: 'Event scheduling', description: 'Find the next event after a given time with a “ceiling” lookup on an ordered map.' },
  ],

  terminology: [
    { term: 'BST property', definition: 'Left subtree keys < node key < right subtree keys, for every node.' },
    { term: 'Inorder successor', definition: 'The next larger key: the leftmost node of the right subtree.' },
    { term: 'Inorder predecessor', definition: 'The next smaller key: the rightmost node of the left subtree.' },
    { term: 'Skewed tree', definition: 'A degenerate BST shaped like a linked list, with height n.' },
    { term: 'Self-balancing BST', definition: 'A BST (AVL, red-black) that restructures itself to keep height O(log n).' },
    { term: 'Floor / ceiling', definition: 'Largest key ≤ x / smallest key ≥ x; built into library ordered maps.' },
  ],

  examples: [
    {
      title: 'Insert, search and sorted output',
      description: 'Recursive insert, iterative search, and an inorder traversal that prints the keys in sorted order.',
      code: java`
public class BinarySearchTree {
    static class Node {
        int key;
        Node left, right;
        Node(int key) { this.key = key; }
    }

    Node root;

    void insert(int key) { root = insert(root, key); }

    private Node insert(Node node, int key) {
        if (node == null) return new Node(key);           // found the empty spot
        if (key < node.key) node.left = insert(node.left, key);
        else if (key > node.key) node.right = insert(node.right, key);
        return node;                                       // duplicates are ignored
    }

    boolean contains(int key) {
        Node curr = root;
        while (curr != null) {
            if (key == curr.key) return true;
            curr = key < curr.key ? curr.left : curr.right;   // go one way only
        }
        return false;
    }

    void inorder(Node node, StringBuilder out) {
        if (node == null) return;
        inorder(node.left, out);
        out.append(node.key).append(' ');
        inorder(node.right, out);
    }

    public static void main(String[] args) {
        BinarySearchTree bst = new BinarySearchTree();
        for (int key : new int[]{50, 30, 70, 20, 40, 60, 80}) {
            bst.insert(key);
        }
        StringBuilder sorted = new StringBuilder();
        bst.inorder(bst.root, sorted);
        System.out.println("Inorder: " + sorted.toString().trim());
        System.out.println("Contains 60? " + bst.contains(60));
        System.out.println("Contains 65? " + bst.contains(65));
    }
}`,
      notes: [
        { match: 'if (node == null) return new Node(key);', text: 'When the search path runs out, that empty spot is exactly where the new key belongs.' },
        { match: 'node.left = insert(node.left, key);', text: 'Re-assigning the child links the new node into the tree on the way back up.' },
        { match: 'curr = key < curr.key ? curr.left : curr.right;', text: 'Each comparison discards an entire subtree, which makes search O(h).' },
      ],
      output: 'Inorder: 20 30 40 50 60 70 80\nContains 60? true\nContains 65? false',
      time: 'insert / contains O(h): O(log n) balanced, O(n) skewed',
      space: 'O(h) for recursive insert; O(1) for iterative search',
    },
    {
      title: 'Deleting a node and validating a BST',
      description: 'Deletes the root (which has two children) using its inorder successor, then checks the BST property with min/max bounds.',
      code: java`
public class BstDeleteValidate {
    static class Node {
        int key;
        Node left, right;
        Node(int key) { this.key = key; }
    }

    static Node insert(Node node, int key) {
        if (node == null) return new Node(key);
        if (key < node.key) node.left = insert(node.left, key);
        else if (key > node.key) node.right = insert(node.right, key);
        return node;
    }

    static Node delete(Node node, int key) {
        if (node == null) return null;
        if (key < node.key) {
            node.left = delete(node.left, key);
        } else if (key > node.key) {
            node.right = delete(node.right, key);
        } else {
            // Zero or one child: replace the node with its child
            if (node.left == null) return node.right;
            if (node.right == null) return node.left;
            // Two children: copy the inorder successor, then delete it
            Node successor = node.right;
            while (successor.left != null) successor = successor.left;
            node.key = successor.key;
            node.right = delete(node.right, successor.key);
        }
        return node;
    }

    // Every node must lie strictly between the bounds set by its ancestors
    static boolean isValid(Node node, long min, long max) {
        if (node == null) return true;
        if (node.key <= min || node.key >= max) return false;
        return isValid(node.left, min, node.key) && isValid(node.right, node.key, max);
    }

    static void inorder(Node node, StringBuilder out) {
        if (node == null) return;
        inorder(node.left, out);
        out.append(node.key).append(' ');
        inorder(node.right, out);
    }

    public static void main(String[] args) {
        Node root = null;
        for (int key : new int[]{50, 30, 70, 20, 40, 60, 80}) root = insert(root, key);

        root = delete(root, 50);     // the root has two children
        StringBuilder out = new StringBuilder();
        inorder(root, out);
        System.out.println("After deleting 50: " + out.toString().trim());
        System.out.println("Root is now: " + root.key);
        System.out.println("Valid BST? " + isValid(root, Long.MIN_VALUE, Long.MAX_VALUE));
    }
}`,
      notes: [
        { match: 'if (node.left == null) return node.right;', text: 'Handles both the leaf case (returns null) and the one-child case.' },
        { match: 'while (successor.left != null) successor = successor.left;', text: 'The inorder successor is the leftmost node in the right subtree.' },
        { match: 'node.right = delete(node.right, successor.key);', text: 'Remove the successor’s original copy; it has at most one child, so this is an easy case.' },
        { match: 'isValid(node.left, min, node.key)', text: 'Pass bounds down. Comparing only with direct children misses violations deeper in the tree.' },
      ],
      output: 'After deleting 50: 20 30 40 60 70 80\nRoot is now: 60\nValid BST? true',
      time: 'delete O(h); validate O(n)',
      space: 'O(h) recursion',
    },
  ],

  algorithm: {
    title: 'Deleting a key from a BST',
    steps: [
      'Start at the root. If the key is smaller, recurse left; if larger, recurse right.',
      'If you reach an empty spot, the key is not in the tree. Return unchanged.',
      'Found the node. If it has no left child, replace it with its right child (this also covers leaves).',
      'If it has no right child, replace it with its left child.',
      'If it has two children, find the inorder successor (leftmost node of the right subtree), copy its key into this node, and delete the successor from the right subtree.',
      'Return the (possibly new) subtree root so the parent can relink it.',
    ],
    dryRun: {
      title: 'Delete 50 from 50 → (30 → 20, 40), (70 → 60, 80)',
      lines: [
        '50 matches and has two children',
        'Successor: go right to 70, then left to 60',
        'Copy 60 into the root → 60 → (30 …), (70 → 60, 80)',
        'Delete 60 from the right subtree: it is a leaf, so remove it',
        'Result: 60 → (30 → 20, 40), (70 → 80)',
      ],
    },
  },

  complexity: {
    columns: ['Operation', 'Balanced BST', 'Skewed BST', 'Sorted array'],
    rows: [
      ['Search', 'O(log n)', 'O(n)', 'O(log n)'],
      ['Insert', 'O(log n)', 'O(n)', 'O(n)'],
      ['Delete', 'O(log n)', 'O(n)', 'O(n)'],
      ['Min / max', 'O(log n)', 'O(n)', 'O(1)'],
      ['Inorder (sorted) traversal', 'O(n)', 'O(n)', 'O(n)'],
    ],
    note: 'A BST uses O(n) space. Library ordered maps (red-black trees) guarantee the balanced column.',
  },

  mistakes: [
    { mistake: 'Validating by comparing each node only with its direct children.', fix: 'Pass min/max bounds down the recursion, or check that the inorder traversal is strictly increasing.' },
    { mistake: 'Forgetting to reassign the child link: calling `insert(node.left, key)` without `node.left =`.', fix: 'Always assign the returned subtree back to the parent.' },
    { mistake: 'Using the smallest/largest `int` as validation bounds when keys can equal those values.', fix: 'Use wider bounds (`long`, `long long`), infinity in Python, or “no bound” values.' },
    { mistake: 'Inserting sorted data into a plain BST and expecting O(log n).', fix: 'Use a self-balancing tree (your library’s ordered map) or shuffle the input.' },
    { mistake: 'Not deciding how to handle duplicates.', fix: 'Ignore them, count them in the node, or consistently send them to one side.' },
  ],

  takeaways: [
    'BST rule: left subtree < node < right subtree, for every node.',
    'Search, insert and delete follow one root-to-leaf path: O(h).',
    'Inorder traversal of a BST yields sorted keys.',
    'Delete with two children via the inorder successor.',
    'Balance is everything; in practice, use your library’s ordered map or set.',
  ],

  practice: ['validate-binary-search-tree', 'kth-smallest-element-in-a-bst', 'maximum-depth-of-binary-tree'],
};
