import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    explicit Node(int data) : data(data), next(nullptr) {}
};

Node* head = nullptr;

void addFirst(int value) {
    Node* node = new Node(value);
    node->next = head;     // new node points to the old head
    head = node;
}

void addLast(int value) {
    Node* node = new Node(value);
    if (head == nullptr) { head = node; return; }
    Node* curr = head;
    while (curr->next != nullptr) curr = curr->next;   // walk to the tail
    curr->next = node;
}

void deleteValue(int value) {
    if (head == nullptr) return;
    if (head->data == value) {
        Node* old = head;
        head = head->next;
        delete old;                                     // C++ frees memory manually
        return;
    }
    Node* curr = head;
    while (curr->next != nullptr && curr->next->data != value) curr = curr->next;
    if (curr->next != nullptr) {
        Node* target = curr->next;
        curr->next = target->next;                      // skip the node
        delete target;
    }
}

void print() {
    for (Node* curr = head; curr != nullptr; curr = curr->next) {
        cout << curr->data << " -> ";
    }
    cout << "nullptr\n";
}

int main() {
    addLast(20);
    addLast(30);
    addFirst(10);
    print();
    deleteValue(20);
    print();
    while (head != nullptr) deleteValue(head->data);   // free the remaining nodes
}`,
      notes: [
        { match: 'node->next = head;', text: 'Link the new node to the old head *before* moving `head`, or the old list would be lost.' },
        { match: 'while (curr->next != nullptr) curr = curr->next;', text: 'Reaching the tail is O(n). Keeping a separate `tail` pointer makes `addLast` O(1).' },
        { match: 'delete old;', text: 'Every `new` needs a matching `delete`. Unlike Java and Python, C++ has no garbage collector.' },
        { match: 'curr->next = target->next;', text: 'Bypassing the node unlinks it; then it is safe to `delete`.' },
      ],
      output: '10 -> 20 -> 30 -> nullptr\n10 -> 30 -> nullptr',
    },
    {
      code: cpp`
#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int data, Node* next) : data(data), next(next) {}
};

Node* reverseList(Node* head) {
    Node* prev = nullptr;
    Node* curr = head;
    while (curr != nullptr) {
        Node* next = curr->next;   // save the rest of the list
        curr->next = prev;         // reverse this pointer
        prev = curr;
        curr = next;
    }
    return prev;                   // prev is the new head
}

// Fast moves 2 steps, slow moves 1: slow ends in the middle
Node* middle(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}

int main() {
    Node* head = new Node(1, new Node(2, new Node(3, new Node(4, new Node(5, nullptr)))));
    cout << "Middle: " << middle(head)->data << "\n";
    head = reverseList(head);

    cout << "Reversed: ";
    for (Node* n = head; n != nullptr; n = n->next) {
        cout << n->data << (n->next != nullptr ? " -> " : "\n");
    }
    while (head != nullptr) {      // free every node
        Node* next = head->next;
        delete head;
        head = next;
    }
}`,
      notes: [
        { match: 'Node* next = curr->next;   // save', text: 'Save the next node first. The following line breaks the only link to it.' },
        { match: 'curr->next = prev;', text: 'Point the current node backwards: the actual reversal.' },
        { match: 'while (fast != nullptr && fast->next != nullptr)', text: 'Both checks are needed so `fast->next->next` never dereferences a null pointer, which would crash the program.' },
      ],
    },
  ],

  python: [
    {
      code: python`
class Node:
    def __init__(self, data, next=None):
        self.data = data
        self.next = next


class LinkedList:
    def __init__(self):
        self.head = None

    def add_first(self, value):
        self.head = Node(value, self.head)   # new node points to the old head

    def add_last(self, value):
        node = Node(value)
        if self.head is None:
            self.head = node
            return
        curr = self.head
        while curr.next is not None:         # walk to the tail
            curr = curr.next
        curr.next = node

    def delete(self, value):
        if self.head is None:
            return
        if self.head.data == value:
            self.head = self.head.next
            return
        curr = self.head
        while curr.next is not None and curr.next.data != value:
            curr = curr.next
        if curr.next is not None:
            curr.next = curr.next.next       # skip the node

    def __str__(self):
        parts = []
        curr = self.head
        while curr is not None:
            parts.append(str(curr.data))
            curr = curr.next
        return " -> ".join(parts + ["None"])


lst = LinkedList()
lst.add_last(20)
lst.add_last(30)
lst.add_first(10)
print(lst)
lst.delete(20)
print(lst)`,
      notes: [
        { match: 'self.head = Node(value, self.head)', text: 'The new node is created already pointing at the old head, then becomes the head.' },
        { match: 'while curr.next is not None:', text: 'Reaching the tail is O(n). Keeping a separate `tail` reference makes `add_last` O(1).' },
        { match: 'if self.head.data == value:', text: 'Deleting the head is a special case because no previous node points to it.' },
        { match: 'def __str__(self):', text: 'Defining `__str__` lets `print(lst)` show the list nicely.' },
      ],
      output: '10 -> 20 -> 30 -> None\n10 -> 30 -> None',
    },
    {
      code: python`
class Node:
    def __init__(self, data, next=None):
        self.data = data
        self.next = next


def reverse(head):
    prev, curr = None, head
    while curr is not None:
        nxt = curr.next          # save the rest of the list
        curr.next = prev         # reverse this pointer
        prev = curr
        curr = nxt
    return prev                  # prev is the new head


def middle(head):
    """Fast moves 2 steps, slow moves 1: slow ends in the middle."""
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    return slow


def format_list(head):
    values = []
    while head is not None:
        values.append(str(head.data))
        head = head.next
    return " -> ".join(values)


head = Node(1, Node(2, Node(3, Node(4, Node(5)))))
print("Middle:", middle(head).data)
head = reverse(head)
print("Reversed:", format_list(head))`,
      notes: [
        { match: 'nxt = curr.next          # save', text: 'Save the next node first (`next` is a built-in name, so we use `nxt`).' },
        { match: 'curr.next = prev         # reverse', text: 'Point the current node backwards: the actual reversal.' },
        { match: 'while fast is not None and fast.next is not None:', text: 'Both checks are needed so `fast.next.next` never raises `AttributeError` on `None`.' },
      ],
    },
  ],
};
