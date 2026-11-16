import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

// Two Sum in one pass: remember each value's index as we go
vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];
        auto it = seen.find(need);
        if (it != seen.end()) {
            return {it->second, i};
        }
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    string text = "the cat and the hat and the bat";
    unordered_map<string, int> freq;
    istringstream words(text);
    string word;
    while (words >> word) {
        freq[word]++;                     // operator[] creates a missing key with value 0
    }
    // std::map keeps keys sorted (unordered_map order is unspecified)
    map<string, int> sorted(freq.begin(), freq.end());
    cout << "{";
    bool first = true;
    for (const auto& [key, count] : sorted) {
        cout << (first ? "" : ", ") << key << "=" << count;
        first = false;
    }
    cout << "}\n";

    vector<int> answer = twoSum({2, 7, 11, 15}, 9);
    cout << "Two Sum: [" << answer[0] << ", " << answer[1] << "]\n";
}`,
      notes: [
        { match: 'freq[word]++;', text: '`operator[]` inserts a missing key with value 0 first, so counting needs no special case.' },
        { match: 'auto it = seen.find(need);', text: '`find` is an O(1) average lookup that, unlike `[]`, does not insert anything.' },
        { match: 'map<string, int> sorted(freq.begin(), freq.end());', text: '`unordered_map` iteration order is unspecified; copying into a `map` (a balanced BST) gives sorted output.' },
      ],
    },
    {
      code: cpp`
#include <functional>
#include <iostream>
#include <list>
#include <optional>
#include <string>
#include <utility>
#include <vector>
using namespace std;

class SimpleHashMap {
    vector<list<pair<string, int>>> buckets;   // each bucket is a chain

    size_t indexFor(const string& key) const {
        // std::hash returns an unsigned size_t, so % is never negative
        return hash<string>{}(key) % buckets.size();
    }

public:
    explicit SimpleHashMap(size_t capacity) : buckets(capacity) {}

    void put(const string& key, int value) {
        for (auto& entry : buckets[indexFor(key)]) {
            if (entry.first == key) { entry.second = value; return; }   // update
        }
        buckets[indexFor(key)].push_back({key, value});                 // insert
    }

    optional<int> get(const string& key) const {
        for (const auto& entry : buckets[indexFor(key)]) {
            if (entry.first == key) return entry.second;
        }
        return nullopt;
    }
};

void show(const string& name, optional<int> age) {
    cout << name << ": " << (age ? to_string(*age) : "not found") << "\n";
}

int main() {
    SimpleHashMap ages(8);
    ages.put("Asha", 21);
    ages.put("Ravi", 23);
    ages.put("Asha", 22);           // same key: value is replaced
    show("Asha", ages.get("Asha"));
    show("Ravi", ages.get("Ravi"));
    show("Meera", ages.get("Meera"));
}`,
      notes: [
        { match: 'hash<string>{}(key) % buckets.size()', text: '`std::hash` turns the key into a number; modulo picks the bucket.' },
        { match: 'if (entry.first == key) { entry.second = value; return; }', text: 'The hash picks the bucket; `==` finds the exact key inside it.' },
        { match: 'return nullopt;', text: '`std::optional` represents “no value” without a sentinel, like returning `null` in Java.' },
      ],
      output: 'Asha: 22\nRavi: 23\nMeera: not found',
    },
  ],

  python: [
    {
      code: python`
from collections import Counter


def two_sum(nums, target):
    """One pass: remember each value's index as we go."""
    seen = {}
    for i, value in enumerate(nums):
        need = target - value
        if need in seen:
            return [seen[need], i]
        seen[value] = i
    return []


text = "the cat and the hat and the bat"
freq = {}
for word in text.split():
    freq[word] = freq.get(word, 0) + 1
# dicts keep insertion order; sort the keys for a predictable printout
print({key: freq[key] for key in sorted(freq)})
print("Counter does the same:", Counter(text.split()).most_common(1))

print("Two Sum:", two_sum([2, 7, 11, 15], 9))`,
      notes: [
        { match: 'freq.get(word, 0) + 1', text: '`get` with a default returns 0 for unseen words, so counting needs no special case.' },
        { match: 'if need in seen:', text: '`in` on a dict is an O(1) average lookup. It replaces an inner loop, turning O(n²) into O(n).' },
        { match: 'Counter(text.split())', text: '`collections.Counter` is a dict subclass built for counting; `most_common(k)` returns the top k.' },
      ],
      output: "{'and': 2, 'bat': 1, 'cat': 1, 'hat': 1, 'the': 3}\nCounter does the same: [('the', 3)]\nTwo Sum: [0, 1]",
    },
    {
      code: python`
class SimpleHashMap:
    def __init__(self, capacity):
        self.buckets = [[] for _ in range(capacity)]   # each bucket is a chain

    def _index_for(self, key):
        # Python's % never returns a negative result for a positive divisor
        return hash(key) % len(self.buckets)

    def put(self, key, value):
        bucket = self.buckets[self._index_for(key)]
        for entry in bucket:
            if entry[0] == key:
                entry[1] = value              # update
                return
        bucket.append([key, value])           # insert

    def get(self, key):
        for k, v in self.buckets[self._index_for(key)]:
            if k == key:
                return v
        return None


ages = SimpleHashMap(8)
ages.put("Asha", 21)
ages.put("Ravi", 23)
ages.put("Asha", 22)             # same key: value is replaced
print("Asha:", ages.get("Asha"))
print("Ravi:", ages.get("Ravi"))
print("Meera:", ages.get("Meera"))`,
      notes: [
        { match: '[[] for _ in range(capacity)]', text: 'A comprehension creates separate lists. `[[]] * capacity` would make every bucket the *same* list.' },
        { match: 'return hash(key) % len(self.buckets)', text: '`hash()` turns the key into a number; modulo picks the bucket.' },
        { match: 'if entry[0] == key:', text: 'The hash picks the bucket; `==` finds the exact key inside it.' },
      ],
      output: 'Asha: 22\nRavi: 23\nMeera: None',
    },
  ],
};
