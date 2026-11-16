import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
using namespace std;

// Inserts value at index, shifting later elements right.
// Assumes size < capacity (there is a free slot). Returns the new size.
int insertAt(int arr[], int size, int index, int value) {
    for (int i = size; i > index; i--) {
        arr[i] = arr[i - 1];
    }
    arr[index] = value;
    return size + 1;
}

// Removes the element at index, shifting later elements left.
int deleteAt(int arr[], int size, int index) {
    for (int i = index; i < size - 1; i++) {
        arr[i] = arr[i + 1];
    }
    return size - 1;
}

void print(const char* label, const int arr[], int size) {
    cout << label << "[";
    for (int i = 0; i < size; i++) {
        cout << arr[i] << (i + 1 < size ? ", " : "");
    }
    cout << "]\n";
}

int main() {
    int arr[10];                      // capacity 10
    int size = 0;
    for (int v : {10, 20, 30, 40}) {
        arr[size++] = v;
    }
    print("Start:  ", arr, size);

    size = insertAt(arr, size, 1, 15);
    print("Insert: ", arr, size);

    size = deleteAt(arr, size, 3);
    print("Delete: ", arr, size);

    cout << "arr[2] = " << arr[2] << "\n";
}`,
      notes: [
        { match: 'for (int i = size; i > index; i--)', text: 'Shift from the **end** backwards. Going forwards would overwrite values before they are moved.' },
        { match: 'arr[i] = arr[i + 1];', text: 'Deleting pulls each later element one slot left, overwriting the removed value.' },
        { match: 'int arr[10];', text: 'A built-in array has a fixed size and its elements start uninitialised, so `size` tracks the slots in use.' },
        { match: 'arr[size++] = v;', text: 'Writes into the next free slot, then increments `size`: the same idea as `vector::push_back`.' },
      ],
    },
    {
      code: cpp`
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

// Two pointers: swap the ends and move inward
void reverseInPlace(vector<int>& arr) {
    int left = 0, right = (int)arr.size() - 1;
    while (left < right) {
        swap(arr[left], arr[right]);
        left++;
        right--;
    }
}

// prefix[i] = sum of arr[0..i-1], so prefix[0] = 0
vector<int> prefixSums(const vector<int>& arr) {
    vector<int> prefix(arr.size() + 1, 0);
    for (size_t i = 0; i < arr.size(); i++) {
        prefix[i + 1] = prefix[i] + arr[i];
    }
    return prefix;
}

void print(const string& label, const vector<int>& v) {
    cout << label << "[";
    for (size_t i = 0; i < v.size(); i++) cout << v[i] << (i + 1 < v.size() ? ", " : "");
    cout << "]\n";
}

int main() {
    vector<int> nums = {3, 1, 4, 1, 5, 9};
    vector<int> prefix = prefixSums(nums);
    // Sum of nums[1..4] = prefix[5] - prefix[1]
    print("Prefix: ", prefix);
    cout << "Sum of index 1..4: " << prefix[5] - prefix[1] << "\n";

    reverseInPlace(nums);
    print("Reversed: ", nums);
}`,
      notes: [
        { match: 'while (left < right)', text: 'Stop when the pointers meet. For odd lengths the middle element stays where it is.' },
        { match: 'swap(arr[left], arr[right]);', text: '`std::swap` exchanges two values without writing the temporary variable yourself.' },
        { match: 'vector<int> prefix(arr.size() + 1, 0);', text: 'One extra slot, all zeros, so `prefix[0] = 0` and ranges starting at 0 need no special case.' },
        { match: 'prefix[5] - prefix[1]', text: 'Sum of `nums[l..r]` = `prefix[r + 1] − prefix[l]`, an O(1) query after O(n) setup.' },
      ],
    },
  ],

  python: [
    {
      code: python`
def insert_at(arr, size, index, value):
    """Inserts value at index, shifting later elements right.
    Assumes size < len(arr) (there is a free slot). Returns the new size."""
    for i in range(size, index, -1):
        arr[i] = arr[i - 1]
    arr[index] = value
    return size + 1


def delete_at(arr, size, index):
    """Removes the element at index, shifting later elements left."""
    for i in range(index, size - 1):
        arr[i] = arr[i + 1]
    return size - 1


arr = [0] * 10           # fixed capacity of 10
size = 0
for v in [10, 20, 30, 40]:
    arr[size] = v
    size += 1
print("Start: ", arr[:size])

size = insert_at(arr, size, 1, 15)
print("Insert:", arr[:size])

size = delete_at(arr, size, 3)
print("Delete:", arr[:size])

print("arr[2] =", arr[2])

# Python lists do the shifting for you (still O(n) in the middle):
nums = [10, 20, 30]
nums.insert(1, 15)
nums.pop(0)
print("Built-in:", nums)`,
      notes: [
        { match: 'for i in range(size, index, -1):', text: 'Count **down** from `size` to `index + 1`, so each value moves before it is overwritten.' },
        { match: 'arr = [0] * 10', text: 'Pre-sizing a list mimics a fixed-capacity array; normally a list simply grows with `append`.' },
        { match: 'arr[:size]', text: 'A slice copies only the slots in use, so the unused capacity isn’t printed.' },
        { match: 'nums.insert(1, 15)', text: '`insert` and `pop(0)` shift elements internally: convenient, but still O(n).' },
      ],
      output: 'Start:  [10, 20, 30, 40]\nInsert: [10, 15, 20, 30, 40]\nDelete: [10, 15, 20, 40]\narr[2] = 20\nBuilt-in: [15, 20, 30]',
    },
    {
      code: python`
def reverse_in_place(arr):
    """Two pointers: swap the ends and move inward."""
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]   # tuple swap
        left += 1
        right -= 1


def prefix_sums(arr):
    """prefix[i] = sum of arr[0..i-1], so prefix[0] = 0."""
    prefix = [0] * (len(arr) + 1)
    for i, value in enumerate(arr):
        prefix[i + 1] = prefix[i] + value
    return prefix


nums = [3, 1, 4, 1, 5, 9]
prefix = prefix_sums(nums)
# Sum of nums[1..4] = prefix[5] - prefix[1]
print("Prefix:", prefix)
print("Sum of index 1..4:", prefix[5] - prefix[1])

reverse_in_place(nums)
print("Reversed:", nums)`,
      notes: [
        { match: 'while left < right:', text: 'Stop when the pointers meet. For odd lengths the middle element stays where it is.' },
        { match: 'arr[left], arr[right] = arr[right], arr[left]', text: 'Tuple assignment swaps two values in one line, with no temporary variable.' },
        { match: 'prefix = [0] * (len(arr) + 1)', text: 'One extra slot so `prefix[0] = 0`, which removes special cases for ranges starting at 0.' },
        { match: 'prefix[5] - prefix[1])', text: 'Sum of `nums[l..r]` = `prefix[r + 1] − prefix[l]`, an O(1) query after O(n) setup.' },
      ],
    },
  ],
};
