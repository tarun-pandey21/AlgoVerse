import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    vector<int> values = {5, 1, 8, 3, 9, 2};
    // std::priority_queue is a MAX-heap by default; greater<int> makes a min-heap
    priority_queue<int, vector<int>, greater<int>> minHeap;
    priority_queue<int> maxHeap;
    for (int x : values) {
        minHeap.push(x);
        maxHeap.push(x);
    }
    cout << "Smallest: " << minHeap.top() << "\n";
    cout << "Largest: " << maxHeap.top() << "\n";

    cout << "Polled in order:";
    while (!minHeap.empty()) {
        cout << " " << minHeap.top();
        minHeap.pop();                   // pop() removes the top but returns nothing
    }
    cout << "\n";

    // Kth largest: keep a min-heap of the k largest values seen so far
    int k = 3;
    priority_queue<int, vector<int>, greater<int>> topK;
    for (int x : values) {
        topK.push(x);
        if ((int)topK.size() > k) topK.pop();   // drop the smallest
    }
    cout << k << "rd largest: " << topK.top() << "\n";
}`,
      notes: [
        { match: 'priority_queue<int, vector<int>, greater<int>> minHeap;', text: 'C++’s default `priority_queue` is a max-heap; `greater<int>` flips it into a min-heap.' },
        { match: 'minHeap.pop();', text: 'Each `pop` removes the current minimum in O(log n), so repeated popping yields sorted order (heap sort).' },
        { match: 'if ((int)topK.size() > k) topK.pop();', text: 'The heap never holds more than k items, and its top is the kth largest so far: O(n log k) total.' },
      ],
    },
    {
      code: cpp`
#include <iostream>
#include <stdexcept>
#include <utility>
#include <vector>
using namespace std;

class MinHeap {
public:
    vector<int> heap;

    // For a node at index i: parent (i-1)/2, children 2i+1 and 2i+2
    void insert(int value) {
        heap.push_back(value);
        int i = heap.size() - 1;
        while (i > 0 && heap[(i - 1) / 2] > heap[i]) {   // sift up
            swap(heap[i], heap[(i - 1) / 2]);
            i = (i - 1) / 2;
        }
    }

    int extractMin() {
        if (heap.empty()) throw underflow_error("Heap is empty");
        int min = heap[0];
        heap[0] = heap.back();           // move the last element to the root
        heap.pop_back();
        int n = heap.size(), i = 0;
        while (true) {                   // sift down
            int left = 2 * i + 1, right = 2 * i + 2, smallest = i;
            if (left < n && heap[left] < heap[smallest]) smallest = left;
            if (right < n && heap[right] < heap[smallest]) smallest = right;
            if (smallest == i) break;
            swap(heap[i], heap[smallest]);
            i = smallest;
        }
        return min;
    }
};

int main() {
    MinHeap h;
    for (int x : {40, 10, 30, 5, 20}) h.insert(x);
    cout << "Heap array: [";
    for (size_t i = 0; i < h.heap.size(); i++) cout << h.heap[i] << (i + 1 < h.heap.size() ? ", " : "");
    cout << "]\n";
    cout << "Extracted:";
    for (int i = 0; i < 5; i++) cout << " " << h.extractMin();
    cout << "\n";
}`,
      notes: [
        { match: 'while (i > 0 && heap[(i - 1) / 2] > heap[i])', text: 'Sift up: swap with the parent while the parent is larger.' },
        { match: 'heap[0] = heap.back();', text: 'Moving the last element to the root keeps the tree complete; sift-down then repairs the order.' },
        { match: 'if (smallest == i) break;', text: 'Stop when the node is no larger than both children: the heap property is restored.' },
      ],
    },
  ],

  python: [
    {
      code: python`
import heapq

values = [5, 1, 8, 3, 9, 2]
min_heap = list(values)
heapq.heapify(min_heap)                   # O(n): rearranges the list into a min-heap
max_heap = [-x for x in values]           # heapq is min-only: negate for a max-heap
heapq.heapify(max_heap)

print("Smallest:", min_heap[0])
print("Largest:", -max_heap[0])

order = [heapq.heappop(min_heap) for _ in range(len(values))]
print("Polled in order:", *order)

# Kth largest: keep a min-heap of the k largest values seen so far
k = 3
top_k = []
for x in values:
    heapq.heappush(top_k, x)
    if len(top_k) > k:
        heapq.heappop(top_k)              # drop the smallest
print(f"{k}rd largest:", top_k[0])`,
      notes: [
        { match: 'heapq.heapify(min_heap)', text: '`heapq` works on a plain list. `heapify` builds the heap in O(n); `min_heap[0]` is always the minimum.' },
        { match: 'max_heap = [-x for x in values]', text: 'There is no max-heap in `heapq`: store negated values and negate again when reading.' },
        { match: 'heapq.heappop(top_k)              # drop', text: 'The heap never holds more than k items, and its root is the kth largest so far: O(n log k) total.' },
      ],
    },
    {
      code: python`
class MinHeap:
    def __init__(self):
        self.heap = []

    # For a node at index i: parent (i-1)//2, children 2i+1 and 2i+2
    def insert(self, value):
        self.heap.append(value)
        i = len(self.heap) - 1
        while i > 0 and self.heap[(i - 1) // 2] > self.heap[i]:   # sift up
            parent = (i - 1) // 2
            self.heap[i], self.heap[parent] = self.heap[parent], self.heap[i]
            i = parent

    def extract_min(self):
        if not self.heap:
            raise IndexError("Heap is empty")
        smallest_value = self.heap[0]
        last = self.heap.pop()
        if self.heap:
            self.heap[0] = last               # move the last element to the root
            i, n = 0, len(self.heap)
            while True:                       # sift down
                left, right, smallest = 2 * i + 1, 2 * i + 2, i
                if left < n and self.heap[left] < self.heap[smallest]:
                    smallest = left
                if right < n and self.heap[right] < self.heap[smallest]:
                    smallest = right
                if smallest == i:
                    break
                self.heap[i], self.heap[smallest] = self.heap[smallest], self.heap[i]
                i = smallest
        return smallest_value


h = MinHeap()
for x in [40, 10, 30, 5, 20]:
    h.insert(x)
print("Heap array:", h.heap)
print("Extracted:", *[h.extract_min() for _ in range(5)])`,
      notes: [
        { match: 'while i > 0 and self.heap[(i - 1) // 2] > self.heap[i]:', text: 'Sift up: swap with the parent while the parent is larger.' },
        { match: 'self.heap[0] = last', text: 'Moving the last element to the root keeps the tree complete; sift-down then repairs the order.' },
        { match: 'if smallest == i:', text: 'Stop when the node is no larger than both children: the heap property is restored.' },
      ],
    },
  ],
};
