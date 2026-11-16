import { java } from './helpers.js';

export default {
  summary:
    'Trees store hierarchical data: a root with children, grandchildren and so on. Binary trees and their four traversals are the gateway to BSTs, heaps and many recursive algorithms.',

  introduction: [
    'A **tree** is a hierarchy of **nodes** connected by edges, with one special node at the top called the **root**. Every other node has exactly one **parent**, and nodes with no children are **leaves**. Folders on your computer and an organisation chart are both trees.',
    'A **binary tree** limits each node to at most two children, called **left** and **right**. Because every subtree is itself a tree, most tree algorithms are short recursive functions: solve the left subtree, solve the right subtree, combine.',
  ],

  concepts: [
    {
      heading: 'Anatomy of a binary tree',
      paragraphs: [
        'Each node stores a value plus references to its left and right children (either may be empty). The **depth** of a node is its distance from the root; the **height** of the tree is the length of its longest root-to-leaf path.',
      ],
      points: [
        '**Full:** every node has 0 or 2 children.',
        '**Complete:** every level is full except possibly the last, which fills from left to right (heaps use this shape).',
        '**Balanced:** left and right subtree heights differ by at most 1 everywhere, so height ≈ log n.',
        '**Skewed:** every node has only one child, so the tree behaves like a linked list (height n).',
      ],
    },
    {
      heading: 'Depth-first traversals',
      paragraphs: ['The three depth-first orders differ only in **when** you visit the current node:'],
      points: [
        '**Preorder** (node, left, right): copy or serialise a tree.',
        '**Inorder** (left, node, right): gives sorted order for a binary search tree.',
        '**Postorder** (left, right, node): delete a tree or compute values that depend on children (like height).',
      ],
    },
    {
      heading: 'Breadth-first (level-order) traversal',
      paragraphs: [
        'Visit nodes level by level, left to right, using a **queue**: dequeue a node, visit it, enqueue its children. Use it for questions about levels, such as the minimum depth or the rightmost node at each level.',
      ],
    },
    {
      heading: 'Thinking recursively about trees',
      paragraphs: [
        'Most tree problems follow one template: handle the empty tree (the base case), recursively solve the left and right subtrees, then combine the two answers with the current node. Height, size, sum and “is it balanced?” all fit this pattern.',
      ],
    },
  ],

  languageNotes: {
    java: [
      "Represent nodes with a small class holding `left` and `right` references; `null` means no child.",
      "Use `ArrayDeque<Node>` as the queue for level-order traversal.",
    ],
    cpp: [
      "Use a `struct` with `Node*` children and `nullptr` for “no child”. Free nodes in postorder (children before parent), or use `std::unique_ptr`.",
      "Use `std::queue<Node*>` for level-order traversal.",
    ],
    python: [
      "A tiny class with `left` / `right` attributes works well; `None` means no child.",
      "Use `collections.deque` for level-order traversal; `list.pop(0)` would be O(n).",
      "Very deep (skewed) trees can hit the recursion limit: use an explicit stack for those.",
    ],
  },

  applications: [
    { title: 'File systems', description: 'Folders contain files and subfolders, forming a tree rooted at the drive.' },
    { title: 'HTML DOM', description: 'Browsers parse web pages into a tree of elements that scripts traverse and modify.' },
    { title: 'Compilers', description: 'Source code is parsed into an abstract syntax tree before being analysed and compiled.' },
    { title: 'Decision trees', description: 'Machine-learning models and troubleshooting guides branch on one question at a time.' },
  ],

  terminology: [
    { term: 'Root', definition: 'The topmost node; it has no parent.' },
    { term: 'Parent / child', definition: 'A node directly above / below another node.' },
    { term: 'Leaf', definition: 'A node with no children.' },
    { term: 'Subtree', definition: 'A node together with all of its descendants.' },
    { term: 'Depth', definition: 'Number of edges from the root to a node (the root has depth 0).' },
    { term: 'Height', definition: 'Length of the longest root-to-leaf path. Some sources count edges, others nodes, so check the convention.' },
    { term: 'Traversal', definition: 'Visiting every node exactly once in a defined order.' },
  ],

  examples: [
    {
      title: 'All four traversals',
      description: 'The same six-node tree visited in preorder, inorder, postorder and level order.',
      code: java`
import java.util.ArrayDeque;
import java.util.Queue;

public class TreeTraversals {
    static class Node {
        int val;
        Node left, right;
        Node(int val) { this.val = val; }
    }

    static void preorder(Node node) {      // node, left, right
        if (node == null) return;
        System.out.print(node.val + " ");
        preorder(node.left);
        preorder(node.right);
    }

    static void inorder(Node node) {       // left, node, right
        if (node == null) return;
        inorder(node.left);
        System.out.print(node.val + " ");
        inorder(node.right);
    }

    static void postorder(Node node) {     // left, right, node
        if (node == null) return;
        postorder(node.left);
        postorder(node.right);
        System.out.print(node.val + " ");
    }

    static void levelOrder(Node root) {    // breadth-first, using a queue
        Queue<Node> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            Node node = queue.poll();
            System.out.print(node.val + " ");
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }

    public static void main(String[] args) {
        //        1
        //       / \
        //      2   3
        //     / \   \
        //    4   5   6
        Node root = new Node(1);
        root.left = new Node(2);
        root.right = new Node(3);
        root.left.left = new Node(4);
        root.left.right = new Node(5);
        root.right.right = new Node(6);

        System.out.print("Preorder:    "); preorder(root);   System.out.println();
        System.out.print("Inorder:     "); inorder(root);    System.out.println();
        System.out.print("Postorder:   "); postorder(root);  System.out.println();
        System.out.print("Level order: "); levelOrder(root); System.out.println();
    }
}`,
      notes: [
        { match: 'if (node == null) return;', text: 'The base case for every recursive traversal: an empty subtree has nothing to visit.' },
        { match: 'Queue<Node> queue = new ArrayDeque<>();', text: 'Level order needs a queue (FIFO) so that nodes are visited in the order they were discovered.' },
        { match: 'if (node.left != null) queue.offer(node.left);', text: 'Enqueue left before right to read each level from left to right.' },
      ],
      output: 'Preorder:    1 2 4 5 3 6\nInorder:     4 2 5 1 3 6\nPostorder:   4 5 2 6 3 1\nLevel order: 1 2 3 4 5 6',
      time: 'O(n) for every traversal',
      space: 'O(h) recursion stack for DFS; O(w) queue for BFS (w = max width)',
    },
    {
      title: 'Height and leaf count',
      description: 'Two problems solved with the same recursive template: answer for the left subtree, answer for the right subtree, combine.',
      code: java`
public class TreeMetrics {
    static class Node {
        int val;
        Node left, right;
        Node(int val, Node left, Node right) { this.val = val; this.left = left; this.right = right; }
    }

    // Height = number of nodes on the longest root-to-leaf path
    static int height(Node node) {
        if (node == null) return 0;
        return 1 + Math.max(height(node.left), height(node.right));
    }

    static int countLeaves(Node node) {
        if (node == null) return 0;
        if (node.left == null && node.right == null) return 1;
        return countLeaves(node.left) + countLeaves(node.right);
    }

    public static void main(String[] args) {
        Node root = new Node(1,
                new Node(2, new Node(4, null, null), new Node(5, null, null)),
                new Node(3, null, new Node(6, new Node(7, null, null), null)));
        System.out.println("Height: " + height(root));
        System.out.println("Leaves: " + countLeaves(root));
    }
}`,
      notes: [
        { match: 'return 1 + Math.max(height(node.left), height(node.right));', text: 'This node adds 1 to the taller of its two subtrees. That is postorder thinking.' },
        { match: 'if (node.left == null && node.right == null) return 1;', text: 'A leaf has no children; it counts as one.' },
      ],
      output: 'Height: 4\nLeaves: 3',
      time: 'O(n): each node visited once',
      space: 'O(h) for the recursion stack',
    },
  ],

  algorithm: {
    title: 'Level-order (breadth-first) traversal',
    steps: [
      'If the tree is empty, there is nothing to visit.',
      'Create an empty queue and enqueue the root.',
      'While the queue is not empty, dequeue the front node and visit it.',
      'Enqueue its left child (if any), then its right child (if any).',
      'Repeat until the queue is empty. Nodes come out level by level, left to right.',
    ],
    dryRun: {
      title: 'Tree 1 → (2 → 4, 5), (3 → 6)',
      lines: [
        'queue [1] → visit 1, enqueue 2, 3',
        'queue [2, 3] → visit 2, enqueue 4, 5',
        'queue [3, 4, 5] → visit 3, enqueue 6',
        'queue [4, 5, 6] → visit 4, 5, 6 (no children)',
        'Output: 1 2 3 4 5 6',
      ],
    },
  },

  complexity: {
    columns: ['Operation', 'Time', 'Space'],
    rows: [
      ['Preorder / inorder / postorder', 'O(n)', 'O(h) stack'],
      ['Level-order traversal', 'O(n)', 'O(w) queue'],
      ['Height, size, sum, leaf count', 'O(n)', 'O(h)'],
      ['Search in a general binary tree', 'O(n)', 'O(h)'],
    ],
    note: 'h is the height: about log n for a balanced tree but n for a skewed one. That is why balance matters for both speed and stack depth.',
  },

  mistakes: [
    { mistake: 'Forgetting the empty-tree base case.', fix: 'Start every recursive tree function by handling an empty node.' },
    { mistake: 'Mixing up the traversal orders.', fix: 'Remember where the node goes: **pre** = before children, **in** = between, **post** = after.' },
    { mistake: 'Using a stack for level-order traversal.', fix: 'BFS needs a queue; a stack gives a depth-first order.' },
    { mistake: 'Off-by-one confusion over height (edges vs nodes).', fix: 'Pick one definition, state it, and make the base case match (empty tree → 0 for nodes, −1 for edges).' },
    { mistake: 'Assuming tree operations are O(log n).', fix: 'Only for balanced trees. A general or skewed tree can be O(n).' },
  ],

  takeaways: [
    'Trees model hierarchies: a root, parent/child links and leaves.',
    'Binary tree problems are usually: base case, recurse left, recurse right, combine.',
    'Preorder, inorder and postorder are DFS; level order is BFS with a queue.',
    'Traversals are O(n) time; space depends on the height h.',
    'Balanced trees keep h ≈ log n; skewed trees degrade to linked lists.',
  ],

  practice: ['maximum-depth-of-binary-tree', 'binary-tree-level-order-traversal', 'validate-binary-search-tree'],
};
