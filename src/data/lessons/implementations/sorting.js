import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int pass = 0; pass < n - 1; pass++) {
        bool swapped = false;
        // After each pass the largest remaining value is in place,
        // so the inner loop can stop "pass" elements earlier.
        for (int j = 0; j < n - 1 - pass; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;   // no swaps: already sorted
    }
}

int main() {
    vector<int> arr = {5, 1, 4, 2, 8};
    bubbleSort(arr);
    cout << "[";
    for (size_t i = 0; i < arr.size(); i++) cout << arr[i] << (i + 1 < arr.size() ? ", " : "");
    cout << "]\n";
}`,
      notes: [
        { match: 'j < n - 1 - pass', text: 'The last `pass` elements are already in their final positions, so skip them.' },
        { match: 'if (arr[j] > arr[j + 1])', text: 'Strict `>` means equal elements are never swapped, which keeps bubble sort stable.' },
        { match: 'if (!swapped) break;', text: 'Turns the best case (already sorted) into O(n).' },
      ],
    },
    {
      code: cpp`
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

void selectionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIndex = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }
        // One swap per pass puts the smallest remaining value at i
        swap(arr[i], arr[minIndex]);
    }
}

void insertionSort(vector<int>& arr) {
    for (int i = 1; i < (int)arr.size(); i++) {
        int key = arr[i];
        int j = i - 1;
        // Shift larger elements one step right to make room for key
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

void print(const string& label, const vector<int>& v) {
    cout << label << "[";
    for (size_t i = 0; i < v.size(); i++) cout << v[i] << (i + 1 < v.size() ? ", " : "");
    cout << "]\n";
}

int main() {
    vector<int> a = {64, 25, 12, 22, 11};
    selectionSort(a);
    print("Selection: ", a);

    vector<int> b = {12, 11, 13, 5, 6};
    insertionSort(b);
    print("Insertion: ", b);
}`,
      notes: [
        { match: 'int minIndex = i;', text: 'Assume the first unsorted element is the minimum, then look for anything smaller.' },
        { match: 'int key = arr[i];', text: 'Save the key first. Shifting will overwrite `arr[i]`.' },
        { match: 'while (j >= 0 && arr[j] > key)', text: 'Check `j >= 0` first so we never read `arr[-1]` (short-circuit evaluation).' },
        { match: 'arr[j + 1] = key;', text: '`j` stopped one position before the gap, so the key goes at `j + 1`.' },
      ],
    },
    {
      code: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// Merges the sorted halves arr[left..mid] and arr[mid+1..right]
void mergeHalves(vector<int>& arr, int left, int mid, int right) {
    vector<int> temp;
    temp.reserve(right - left + 1);
    int i = left, j = mid + 1;
    while (i <= mid && j <= right) {
        // "<=" takes from the left half on ties, keeping the sort stable
        if (arr[i] <= arr[j]) temp.push_back(arr[i++]);
        else temp.push_back(arr[j++]);
    }
    while (i <= mid) temp.push_back(arr[i++]);       // copy any leftovers
    while (j <= right) temp.push_back(arr[j++]);
    copy(temp.begin(), temp.end(), arr.begin() + left);
}

void mergeSort(vector<int>& arr, int left, int right) {
    if (left >= right) return;            // 0 or 1 element: already sorted
    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    mergeHalves(arr, left, mid, right);
}

int main() {
    vector<int> arr = {38, 27, 43, 3, 9, 82, 10};
    mergeSort(arr, 0, (int)arr.size() - 1);
    cout << "[";
    for (size_t i = 0; i < arr.size(); i++) cout << arr[i] << (i + 1 < arr.size() ? ", " : "");
    cout << "]\n";

    // In real code: std::sort (fast, not stable) or std::stable_sort
    vector<int> other = {5, 2, 9, 1};
    stable_sort(other.begin(), other.end());
    cout << "stable_sort: " << other[0] << " " << other[1] << " " << other[2] << " " << other[3] << "\n";
}`,
      notes: [
        { match: 'if (left >= right) return;', text: 'Base case: a range of 0 or 1 elements is already sorted.' },
        { match: 'if (arr[i] <= arr[j]) temp.push_back(arr[i++]);', text: 'Taking from the left half on ties is what makes merge sort stable.' },
        { match: 'copy(temp.begin(), temp.end(), arr.begin() + left);', text: 'Copy the merged result back into the original range.' },
        { match: 'stable_sort(other.begin(), other.end());', text: '`std::sort` is an O(n log n) introsort but not stable; `std::stable_sort` keeps equal elements in order.' },
      ],
      output: '[3, 9, 10, 27, 38, 43, 82]\nstable_sort: 1 2 5 9',
    },
  ],

  python: [
    {
      code: python`
def bubble_sort(arr):
    n = len(arr)
    for pass_num in range(n - 1):
        swapped = False
        # After each pass the largest remaining value is in place,
        # so the inner loop can stop pass_num elements earlier.
        for j in range(n - 1 - pass_num):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break      # no swaps: already sorted


arr = [5, 1, 4, 2, 8]
bubble_sort(arr)
print(arr)`,
      notes: [
        { match: 'for j in range(n - 1 - pass_num):', text: 'The last `pass_num` elements are already in their final positions, so skip them.' },
        { match: 'arr[j], arr[j + 1] = arr[j + 1], arr[j]', text: 'Tuple assignment swaps neighbours in one line.' },
        { match: 'if not swapped:', text: 'Stopping when a pass makes no swaps turns the best case (already sorted) into O(n).' },
      ],
    },
    {
      code: python`
def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_index = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_index]:
                min_index = j
        # One swap per pass puts the smallest remaining value at i
        arr[i], arr[min_index] = arr[min_index], arr[i]


def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        # Shift larger elements one step right to make room for key
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key


a = [64, 25, 12, 22, 11]
selection_sort(a)
print("Selection:", a)

b = [12, 11, 13, 5, 6]
insertion_sort(b)
print("Insertion:", b)`,
      notes: [
        { match: 'min_index = i', text: 'Assume the first unsorted element is the minimum, then look for anything smaller.' },
        { match: 'key = arr[i]', text: 'Save the key first. Shifting will overwrite `arr[i]`.' },
        { match: 'while j >= 0 and arr[j] > key:', text: 'Check `j >= 0` first. In Python `arr[-1]` silently reads the *last* element, so this guard is essential.' },
        { match: 'arr[j + 1] = key', text: '`j` stopped one position before the gap, so the key goes at `j + 1`.' },
      ],
    },
    {
      code: python`
def merge_sort(arr, left, right):
    if left >= right:                     # 0 or 1 element: already sorted
        return
    mid = (left + right) // 2
    merge_sort(arr, left, mid)
    merge_sort(arr, mid + 1, right)
    merge(arr, left, mid, right)


def merge(arr, left, mid, right):
    """Merges the sorted halves arr[left..mid] and arr[mid+1..right]."""
    temp = []
    i, j = left, mid + 1
    while i <= mid and j <= right:
        # "<=" takes from the left half on ties, keeping the sort stable
        if arr[i] <= arr[j]:
            temp.append(arr[i])
            i += 1
        else:
            temp.append(arr[j])
            j += 1
    temp.extend(arr[i:mid + 1])           # copy any leftovers
    temp.extend(arr[j:right + 1])
    arr[left:right + 1] = temp            # write the merged run back


arr = [38, 27, 43, 3, 9, 82, 10]
merge_sort(arr, 0, len(arr) - 1)
print(arr)
print(sorted([5, 2, 9, 1]))               # built-in Timsort: stable, O(n log n)`,
      notes: [
        { match: 'if left >= right:', text: 'Base case: a range of 0 or 1 elements is already sorted.' },
        { match: 'if arr[i] <= arr[j]:', text: 'Taking from the left half on ties is what makes merge sort stable.' },
        { match: 'arr[left:right + 1] = temp', text: 'Slice assignment replaces the whole range with the merged values in one step.' },
        { match: 'print(sorted([5, 2, 9, 1]))', text: 'In real code use `sorted()` or `list.sort()`: Timsort is stable and O(n log n).' },
      ],
      output: '[3, 9, 10, 27, 38, 43, 82]\n[1, 2, 5, 9]',
    },
  ],
};
