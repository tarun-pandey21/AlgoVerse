import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;

class CircularQueue {
    vector<int> data;
    int front = 0, count = 0;

public:
    explicit CircularQueue(int capacity) : data(capacity) {}

    void enqueue(int value) {
        if (count == (int)data.size()) throw overflow_error("Queue is full");
        int rear = (front + count) % data.size();   // wrap around the end
        data[rear] = value;
        count++;
    }

    int dequeue() {
        if (count == 0) throw underflow_error("Queue is empty");
        int value = data[front];
        front = (front + 1) % data.size();
        count--;
        return value;
    }

    bool empty() const { return count == 0; }
};

int main() {
    CircularQueue q(3);
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    cout << "Dequeued: " << q.dequeue() << "\n";
    q.enqueue(4);            // reuses the slot freed at index 0
    while (!q.empty()) {
        cout << "Dequeued: " << q.dequeue() << "\n";
    }
}`,
      notes: [
        { match: 'int front = 0, count = 0;', text: 'Tracking `count` makes it easy to tell “full” from “empty”, which both have the same front/rear pattern.' },
        { match: 'int rear = (front + count) % data.size();', text: 'Modulo wraps the index back to 0 after the last slot.' },
        { match: 'front = (front + 1) % data.size();', text: 'Dequeue just moves `front` forward; nothing is shifted.' },
      ],
    },
    {
      code: cpp`
#include <deque>
#include <iostream>
#include <queue>
#include <string>
using namespace std;

int main() {
    queue<string> printJobs;
    printJobs.push("report.pdf");            // enqueue at the back
    printJobs.push("photo.png");
    printJobs.push("notes.txt");
    cout << "Next job: " << printJobs.front() << "\n";
    cout << "Printing: " << printJobs.front() << "\n";
    printJobs.pop();                         // pop() removes the front, returns nothing
    cout << "Waiting: " << printJobs.size() << " jobs, next is " << printJobs.front() << "\n";

    deque<int> dq;
    dq.push_front(2);
    dq.push_back(3);
    dq.push_front(1);
    cout << "Deque: [" << dq[0] << ", " << dq[1] << ", " << dq[2] << "]\n";
    cout << "Removed from back: " << dq.back() << "\n";
    dq.pop_back();
}`,
      notes: [
        { match: 'queue<string> printJobs;', text: '`std::queue` is a FIFO adapter (over `deque` by default): `push`, `front` and `pop` are O(1).' },
        { match: 'printJobs.pop();', text: 'Read the value with `front()` first, because `pop()` returns nothing in C++.' },
        { match: 'dq.push_front(1);', text: 'A `deque` adds and removes at both ends in O(1), and also supports indexing.' },
      ],
      output: 'Next job: report.pdf\nPrinting: report.pdf\nWaiting: 2 jobs, next is photo.png\nDeque: [1, 2, 3]\nRemoved from back: 3',
    },
  ],

  python: [
    {
      code: python`
class CircularQueue:
    def __init__(self, capacity):
        self.data = [None] * capacity
        self.front = 0
        self.size = 0

    def enqueue(self, value):
        if self.size == len(self.data):
            raise OverflowError("Queue is full")
        rear = (self.front + self.size) % len(self.data)   # wrap around the end
        self.data[rear] = value
        self.size += 1

    def dequeue(self):
        if self.size == 0:
            raise IndexError("Queue is empty")
        value = self.data[self.front]
        self.front = (self.front + 1) % len(self.data)
        self.size -= 1
        return value


q = CircularQueue(3)
q.enqueue(1)
q.enqueue(2)
q.enqueue(3)
print("Dequeued:", q.dequeue())
q.enqueue(4)               # reuses the slot freed at index 0
while q.size > 0:
    print("Dequeued:", q.dequeue())`,
      notes: [
        { match: 'self.size = 0', text: 'Tracking `size` makes it easy to tell “full” from “empty”, which both have the same front/rear pattern.' },
        { match: 'rear = (self.front + self.size) % len(self.data)', text: 'Modulo wraps the index back to 0 after the last slot.' },
        { match: 'self.front = (self.front + 1) % len(self.data)', text: 'Dequeue just moves `front` forward; nothing is shifted.' },
      ],
    },
    {
      code: python`
from collections import deque

print_jobs = deque()
print_jobs.append("report.pdf")            # enqueue at the right
print_jobs.append("photo.png")
print_jobs.append("notes.txt")
print("Next job:", print_jobs[0])
print("Printing:", print_jobs.popleft())   # dequeue from the left in O(1)
print("Waiting:", list(print_jobs))

dq = deque()
dq.appendleft(2)
dq.append(3)
dq.appendleft(1)
print("Deque:", list(dq))
print("Removed from back:", dq.pop())`,
      notes: [
        { match: 'from collections import deque', text: '`collections.deque` is Python’s queue: O(1) appends and pops at both ends.' },
        { match: 'print_jobs.popleft()', text: '`popleft()` removes the oldest item. Using `list.pop(0)` instead would shift every element: O(n).' },
        { match: 'dq.appendleft(1)', text: 'A deque can add at the front too, so 1 ends up before 2.' },
      ],
      output: "Next job: report.pdf\nPrinting: report.pdf\nWaiting: ['photo.png', 'notes.txt']\nDeque: [1, 2, 3]\nRemoved from back: 3",
    },
  ],
};
