import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
#include <queue>
using namespace std;

struct Node {
    int val;
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(int val) : val(val) {}
};

void preorder(Node* node) {      // node, left, right
    if (node == nullptr) return;
    cout << node->val << " ";
    preorder(node->left);
    preorder(node->right);
}

void inorder(Node* node) {       // left, node, right
    if (node == nullptr) return;
    inorder(node->left);
    cout << node->val << " ";
    inorder(node->right);
}

void postorder(Node* node) {     // left, right, node
    if (node == nullptr) return;
    postorder(node->left);
    postorder(node->right);
    cout << node->val << " ";
}

void levelOrder(Node* root) {    // breadth-first, using a queue
    queue<Node*> q;
    q.push(root);
    while (!q.empty()) {
        Node* node = q.front();
        q.pop();
        cout << node->val << " ";
        if (node->left != nullptr) q.push(node->left);
        if (node->right != nullptr) q.push(node->right);
    }
}

void destroy(Node* node) {       // postorder is also how you free a tree
    if (node == nullptr) return;
    destroy(node->left);
    destroy(node->right);
    delete node;
}

int main() {
    /*
            1
           / \
          2   3
         / \   \
        4   5   6
    */
    Node* root = new Node(1);
    root->left = new Node(2);
    root->right = new Node(3);
    root->left->left = new Node(4);
    root->left->right = new Node(5);
    root->right->right = new Node(6);

    cout << "Preorder:    "; preorder(root);   cout << "\n";
    cout << "Inorder:     "; inorder(root);    cout << "\n";
    cout << "Postorder:   "; postorder(root);  cout << "\n";
    cout << "Level order: "; levelOrder(root); cout << "\n";
    destroy(root);
}`,
      notes: [
        { match: 'if (node == nullptr) return;', text: 'The base case for every recursive traversal: an empty subtree has nothing to visit.' },
        { match: 'queue<Node*> q;', text: 'Level order needs a queue (FIFO) so nodes are visited in the order they were discovered.' },
        { match: 'void destroy(Node* node)', text: 'Children must be freed before their parent, which is exactly postorder.' },
      ],
    },
    {
      code: cpp`
#include <algorithm>
#include <iostream>
using namespace std;

struct Node {
    int val;
    Node* left;
    Node* right;
    Node(int val, Node* left, Node* right) : val(val), left(left), right(right) {}
};

// Height = number of nodes on the longest root-to-leaf path
int height(Node* node) {
    if (node == nullptr) return 0;
    return 1 + max(height(node->left), height(node->right));
}

int countLeaves(Node* node) {
    if (node == nullptr) return 0;
    if (node->left == nullptr && node->right == nullptr) return 1;
    return countLeaves(node->left) + countLeaves(node->right);
}

void destroy(Node* node) {
    if (node == nullptr) return;
    destroy(node->left);
    destroy(node->right);
    delete node;
}

int main() {
    Node* root = new Node(1,
            new Node(2, new Node(4, nullptr, nullptr), new Node(5, nullptr, nullptr)),
            new Node(3, nullptr, new Node(6, new Node(7, nullptr, nullptr), nullptr)));
    cout << "Height: " << height(root) << "\n";
    cout << "Leaves: " << countLeaves(root) << "\n";
    destroy(root);
}`,
      notes: [
        { match: 'return 1 + max(height(node->left), height(node->right));', text: 'This node adds 1 to the taller of its two subtrees. That is postorder thinking.' },
        { match: 'if (node->left == nullptr && node->right == nullptr) return 1;', text: 'A leaf has no children; it counts as one.' },
      ],
    },
  ],

  python: [
    {
      code: python`
from collections import deque


class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def preorder(node, out):         # node, left, right
    if node is None:
        return out
    out.append(node.val)
    preorder(node.left, out)
    preorder(node.right, out)
    return out


def inorder(node, out):          # left, node, right
    if node is None:
        return out
    inorder(node.left, out)
    out.append(node.val)
    inorder(node.right, out)
    return out


def postorder(node, out):        # left, right, node
    if node is None:
        return out
    postorder(node.left, out)
    postorder(node.right, out)
    out.append(node.val)
    return out


def level_order(root):           # breadth-first, using a queue
    out, queue = [], deque([root])
    while queue:
        node = queue.popleft()
        out.append(node.val)
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    return out


#        1
#       / \
#      2   3
#     / \   \
#    4   5   6
root = Node(1, Node(2, Node(4), Node(5)), Node(3, None, Node(6)))

print("Preorder:   ", *preorder(root, []))
print("Inorder:    ", *inorder(root, []))
print("Postorder:  ", *postorder(root, []))
print("Level order:", *level_order(root))`,
      notes: [
        { match: 'if node is None:\n        return out\n    out.append(node.val)\n    preorder', text: 'The base case for every recursive traversal: an empty subtree has nothing to visit.' },
        { match: 'out, queue = [], deque([root])', text: 'Level order needs a queue (FIFO); `deque.popleft()` is O(1).' },
        { match: 'print("Preorder:   ", *preorder(root, []))', text: 'The `*` unpacks the list, so `print` separates the values with spaces.' },
      ],
    },
    {
      code: python`
class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def height(node):
    """Height = number of nodes on the longest root-to-leaf path."""
    if node is None:
        return 0
    return 1 + max(height(node.left), height(node.right))


def count_leaves(node):
    if node is None:
        return 0
    if node.left is None and node.right is None:
        return 1
    return count_leaves(node.left) + count_leaves(node.right)


root = Node(1,
            Node(2, Node(4), Node(5)),
            Node(3, None, Node(6, Node(7))))
print("Height:", height(root))
print("Leaves:", count_leaves(root))`,
      notes: [
        { match: 'return 1 + max(height(node.left), height(node.right))', text: 'This node adds 1 to the taller of its two subtrees. That is postorder thinking.' },
        { match: 'if node.left is None and node.right is None:', text: 'A leaf has no children; it counts as one.' },
      ],
    },
  ],
};
