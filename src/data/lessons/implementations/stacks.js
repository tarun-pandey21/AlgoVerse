import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;

class ArrayStack {
    vector<int> data;
    int top = -1;                     // index of the top element; -1 = empty

public:
    explicit ArrayStack(int capacity) : data(capacity) {}

    void push(int value) {
        if (top == (int)data.size() - 1) throw overflow_error("Stack overflow");
        data[++top] = value;
    }

    int pop() {
        if (isEmpty()) throw underflow_error("Stack underflow");
        return data[top--];
    }

    int peek() const {
        if (isEmpty()) throw underflow_error("Stack is empty");
        return data[top];
    }

    bool isEmpty() const { return top == -1; }
};

int main() {
    ArrayStack stack(5);
    stack.push(10);
    stack.push(20);
    stack.push(30);
    cout << boolalpha;
    cout << "Peek: " << stack.peek() << "\n";
    cout << "Pop: " << stack.pop() << "\n";
    cout << "Pop: " << stack.pop() << "\n";
    cout << "Empty? " << stack.isEmpty() << "\n";
}`,
      notes: [
        { match: 'int top = -1;', text: '`top` is the index of the current top element, so `-1` means the stack is empty.' },
        { match: 'data[++top] = value;', text: 'Pre-increment: move `top` up first, then write into the new slot.' },
        { match: 'return data[top--];', text: 'Post-decrement: read the top value, then move `top` down.' },
        { match: 'throw underflow_error("Stack underflow");', text: 'Standard exception types from `<stdexcept>` make errors explicit instead of reading garbage memory.' },
      ],
    },
    {
      code: cpp`
#include <iostream>
#include <stack>
#include <string>
using namespace std;

// Assumes s contains only bracket characters
bool isBalanced(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else {
            if (st.empty()) return false;          // closing with nothing open
            char open = st.top();                  // top() reads, pop() removes
            st.pop();
            if ((c == ')' && open != '(') ||
                (c == ']' && open != '[') ||
                (c == '}' && open != '{')) {
                return false;                      // wrong type of bracket
            }
        }
    }
    return st.empty();                             // anything left is unclosed
}

int main() {
    cout << boolalpha;
    cout << isBalanced("{[()]}") << "\n";
    cout << isBalanced("([)]") << "\n";
    cout << isBalanced("((") << "\n";
}`,
      notes: [
        { match: 'stack<char> st;', text: '`std::stack` is an adapter over `deque` by default: push, pop and top are all O(1).' },
        { match: 'char open = st.top();', text: 'In C++, `pop()` returns nothing, so read the value with `top()` first.' },
        { match: 'if (st.empty()) return false;', text: 'Calling `top()` on an empty stack is undefined behaviour, so always check first.' },
      ],
    },
  ],

  python: [
    {
      code: python`
class ArrayStack:
    def __init__(self, capacity):
        self.data = [0] * capacity
        self.top = -1                 # index of the top element; -1 = empty

    def push(self, value):
        if self.top == len(self.data) - 1:
            raise OverflowError("Stack overflow")
        self.top += 1
        self.data[self.top] = value

    def pop(self):
        if self.is_empty():
            raise IndexError("Stack underflow")
        value = self.data[self.top]
        self.top -= 1
        return value

    def peek(self):
        if self.is_empty():
            raise IndexError("Stack is empty")
        return self.data[self.top]

    def is_empty(self):
        return self.top == -1


stack = ArrayStack(5)
stack.push(10)
stack.push(20)
stack.push(30)
print("Peek:", stack.peek())
print("Pop:", stack.pop())
print("Pop:", stack.pop())
print("Empty?", stack.is_empty())

# In everyday Python, a plain list is the stack
plain = [1, 2]
plain.append(3)                       # push
print("List pop:", plain.pop())       # pop from the end: O(1)`,
      notes: [
        { match: 'self.top = -1', text: '`top` is the index of the current top element, so `-1` means the stack is empty.' },
        { match: 'raise IndexError("Stack underflow")', text: 'Raising an exception makes popping an empty stack fail loudly, just like `list.pop()` does.' },
        { match: 'plain.append(3)', text: 'A list’s `append` and `pop()` work at the end, so both are O(1), which makes a list a perfect stack.' },
      ],
      output: 'Peek: 30\nPop: 30\nPop: 20\nEmpty? False\nList pop: 3',
    },
    {
      code: python`
PAIRS = {")": "(", "]": "[", "}": "{"}   # closing -> matching opening


def is_balanced(s):
    """Assumes s contains only bracket characters."""
    stack = []
    for c in s:
        if c in "([{":
            stack.append(c)
        else:
            if not stack:                  # closing with nothing open
                return False
            if stack.pop() != PAIRS[c]:    # wrong type of bracket
                return False
    return not stack                       # anything left is unclosed


print(is_balanced("{[()]}"))
print(is_balanced("([)]"))
print(is_balanced("(("))`,
      notes: [
        { match: 'PAIRS = {', text: 'A dictionary maps each closing bracket to its opening partner, replacing a chain of `if` checks.' },
        { match: 'if not stack:', text: 'An empty list is “falsy”, so this guards against popping from an empty stack.' },
        { match: 'return not stack', text: 'True only if every opening bracket was matched and removed.' },
      ],
      output: 'True\nFalse\nFalse',
    },
  ],
};
