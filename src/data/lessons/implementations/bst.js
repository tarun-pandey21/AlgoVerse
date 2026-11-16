import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
#include <string>
using namespace std;

struct Node {
    int key;
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(int key) : key(key) {}
};

Node* insert(Node* node, int key) {
    if (node == nullptr) return new Node(key);         // found the empty spot
    if (key < node->key) node->left = insert(node->left, key);
    else if (key > node->key) node->right = insert(node->right, key);
    return node;                                        // duplicates are ignored
}

bool contains(Node* root, int key) {
    Node* curr = root;
    while (curr != nullptr) {
        if (key == curr->key) return true;
        curr = key < curr->key ? curr->left : curr->right;   // go one way only
    }
    return false;
}

void inorder(Node* node, string& out) {
    if (node == nullptr) return;
    inorder(node->left, out);
    out += to_string(node->key) + " ";
    inorder(node->right, out);
}

void destroy(Node* node) {
    if (node == nullptr) return;
    destroy(node->left);
    destroy(node->right);
    delete node;
}

int main() {
    Node* root = nullptr;
    for (int key : {50, 30, 70, 20, 40, 60, 80}) {
        root = insert(root, key);
    }
    string sorted;
    inorder(root, sorted);
    cout << boolalpha;
    cout << "Inorder: " << sorted << "\n";
    cout << "Contains 60? " << contains(root, 60) << "\n";
    cout << "Contains 65? " << contains(root, 65) << "\n";
    destroy(root);
}`,
      notes: [
        { match: 'if (node == nullptr) return new Node(key);', text: 'When the search path runs out, that empty spot is exactly where the new key belongs.' },
        { match: 'node->left = insert(node->left, key);', text: 'Re-assigning the child links the new node into the tree on the way back up.' },
        { match: 'curr = key < curr->key ? curr->left : curr->right;', text: 'Each comparison discards an entire subtree, which makes search O(h).' },
      ],
    },
    {
      code: cpp`
#include <climits>
#include <iostream>
#include <string>
using namespace std;

struct Node {
    int key;
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(int key) : key(key) {}
};

Node* insert(Node* node, int key) {
    if (node == nullptr) return new Node(key);
    if (key < node->key) node->left = insert(node->left, key);
    else if (key > node->key) node->right = insert(node->right, key);
    return node;
}

Node* deleteKey(Node* node, int key) {
    if (node == nullptr) return nullptr;
    if (key < node->key) {
        node->left = deleteKey(node->left, key);
    } else if (key > node->key) {
        node->right = deleteKey(node->right, key);
    } else {
        // Zero or one child: replace the node with its child
        if (node->left == nullptr) { Node* child = node->right; delete node; return child; }
        if (node->right == nullptr) { Node* child = node->left; delete node; return child; }
        // Two children: copy the inorder successor, then delete it
        Node* successor = node->right;
        while (successor->left != nullptr) successor = successor->left;
        node->key = successor->key;
        node->right = deleteKey(node->right, successor->key);
    }
    return node;
}

// Every node must lie strictly between the bounds set by its ancestors
bool isValid(Node* node, long long low, long long high) {
    if (node == nullptr) return true;
    if (node->key <= low || node->key >= high) return false;
    return isValid(node->left, low, node->key) && isValid(node->right, node->key, high);
}

void inorder(Node* node, string& out) {
    if (node == nullptr) return;
    inorder(node->left, out);
    out += to_string(node->key) + " ";
    inorder(node->right, out);
}

void destroy(Node* node) {
    if (node == nullptr) return;
    destroy(node->left);
    destroy(node->right);
    delete node;
}

int main() {
    Node* root = nullptr;
    for (int key : {50, 30, 70, 20, 40, 60, 80}) root = insert(root, key);

    root = deleteKey(root, 50);    // the root has two children
    string out;
    inorder(root, out);
    cout << boolalpha;
    cout << "After deleting 50: " << out << "\n";
    cout << "Root is now: " << root->key << "\n";
    cout << "Valid BST? " << isValid(root, LLONG_MIN, LLONG_MAX) << "\n";
    destroy(root);
}`,
      notes: [
        { match: 'if (node->left == nullptr) { Node* child = node->right; delete node; return child; }', text: 'Handles both the leaf case and the one-child case, and frees the removed node.' },
        { match: 'while (successor->left != nullptr) successor = successor->left;', text: 'The inorder successor is the leftmost node in the right subtree.' },
        { match: 'node->right = deleteKey(node->right, successor->key);', text: 'Remove the successor’s original copy; it has at most one child, so this is an easy case.' },
        { match: 'isValid(Node* node, long long low, long long high)', text: '`long long` bounds stay valid even when a key equals `INT_MIN` or `INT_MAX`.' },
      ],
    },
  ],

  python: [
    {
      code: python`
class Node:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None


def insert(node, key):
    if node is None:
        return Node(key)                       # found the empty spot
    if key < node.key:
        node.left = insert(node.left, key)
    elif key > node.key:
        node.right = insert(node.right, key)
    return node                                # duplicates are ignored


def contains(root, key):
    curr = root
    while curr is not None:
        if key == curr.key:
            return True
        curr = curr.left if key < curr.key else curr.right   # go one way only
    return False


def inorder(node, out):
    if node is not None:
        inorder(node.left, out)
        out.append(node.key)
        inorder(node.right, out)
    return out


root = None
for key in [50, 30, 70, 20, 40, 60, 80]:
    root = insert(root, key)
print("Inorder:", *inorder(root, []))
print("Contains 60?", contains(root, 60))
print("Contains 65?", contains(root, 65))`,
      notes: [
        { match: 'return Node(key)                       # found', text: 'When the search path runs out, that empty spot is exactly where the new key belongs.' },
        { match: 'node.left = insert(node.left, key)', text: 'Re-assigning the child links the new node into the tree on the way back up.' },
        { match: 'curr = curr.left if key < curr.key else curr.right', text: 'Each comparison discards an entire subtree, which makes search O(h).' },
      ],
      output: 'Inorder: 20 30 40 50 60 70 80\nContains 60? True\nContains 65? False',
    },
    {
      code: python`
class Node:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None


def insert(node, key):
    if node is None:
        return Node(key)
    if key < node.key:
        node.left = insert(node.left, key)
    elif key > node.key:
        node.right = insert(node.right, key)
    return node


def delete(node, key):
    if node is None:
        return None
    if key < node.key:
        node.left = delete(node.left, key)
    elif key > node.key:
        node.right = delete(node.right, key)
    else:
        # Zero or one child: replace the node with its child
        if node.left is None:
            return node.right
        if node.right is None:
            return node.left
        # Two children: copy the inorder successor, then delete it
        successor = node.right
        while successor.left is not None:
            successor = successor.left
        node.key = successor.key
        node.right = delete(node.right, successor.key)
    return node


def is_valid(node, low=float("-inf"), high=float("inf")):
    """Every node must lie strictly between the bounds set by its ancestors."""
    if node is None:
        return True
    if not low < node.key < high:
        return False
    return is_valid(node.left, low, node.key) and is_valid(node.right, node.key, high)


def inorder(node, out):
    if node is not None:
        inorder(node.left, out)
        out.append(node.key)
        inorder(node.right, out)
    return out


root = None
for key in [50, 30, 70, 20, 40, 60, 80]:
    root = insert(root, key)

root = delete(root, 50)          # the root has two children
print("After deleting 50:", *inorder(root, []))
print("Root is now:", root.key)
print("Valid BST?", is_valid(root))`,
      notes: [
        { match: 'if node.left is None:\n            return node.right', text: 'Handles both the leaf case (returns None) and the one-child case.' },
        { match: 'while successor.left is not None:', text: 'The inorder successor is the leftmost node in the right subtree.' },
        { match: 'low=float("-inf"), high=float("inf")', text: 'Infinite default bounds mean the root can hold any key.' },
        { match: 'if not low < node.key < high:', text: 'Python allows chained comparisons: this checks both bounds at once.' },
      ],
      output: 'After deleting 50: 20 30 40 60 70 80\nRoot is now: 60\nValid BST? True',
    },
  ],
};
