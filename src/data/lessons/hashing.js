import { java } from './helpers.js';

export default {
  summary:
    'Hashing turns a key into an array index so you can store and look things up in O(1) average time. Hash maps and hash sets are among the most used data structures in everyday code.',

  introduction: [
    'Imagine looking up a word without scanning the whole dictionary: you compute where it *should* be and go straight there. A **hash table** does exactly this. A **hash function** converts a key (a string, a number, an object) into an index in an array of **buckets**.',
    'When it works well, insert, lookup and delete all take **O(1) on average**. That turns many O(n²) “compare every pair” solutions into O(n) ones, which is why hashing appears in a huge share of interview problems.',
  ],

  concepts: [
    {
      heading: 'Hash functions',
      paragraphs: [
        'A hash function maps a key to an integer. The table turns that into a bucket index, conceptually `hash % capacity`. A good hash function is fast, deterministic (same key → same hash) and spreads keys evenly across buckets.',
      ],
    },
    {
      heading: 'Collisions',
      paragraphs: [
        'Different keys can land in the same bucket: a **collision**. It is unavoidable, since there are more possible keys than buckets. Two common strategies:',
      ],
      points: [
        '**Separate chaining:** each bucket holds a small list of entries. Java’s `HashMap` and C++’s `unordered_map` work this way.',
        '**Open addressing:** on collision, probe for another empty slot (linear or quadratic probing). Python’s `dict` works this way.',
      ],
    },
    {
      heading: 'Load factor and resizing',
      paragraphs: [
        'The **load factor** is `entries / buckets`. As it grows, chains get longer and lookups slow down. Tables grow (typically doubling) and rehash every entry when the load factor passes a threshold: 0.75 in Java’s `HashMap`, 1.0 by default in C++, about 2/3 in Python. Each resize is O(n), but they are rare enough that insertion stays amortised O(1).',
      ],
    },
    {
      heading: 'Equality and hashing must agree',
      paragraphs: [
        'A table finds the bucket using the key’s hash, then the exact key using an equality check. If you use your own type as a key, equal keys **must** produce equal hashes, otherwise lookups silently fail. Keys should also never change while they are stored in the table.',
      ],
    },
  ],

  languageNotes: {
    java: [
      "`HashMap<K, V>` and `HashSet<E>`: `put`, `get`, `containsKey`, `getOrDefault` and `merge`.",
      "Custom key classes must override both `equals` and `hashCode` (a `record` does this for you).",
      "Iteration order is unspecified: use `LinkedHashMap` for insertion order or `TreeMap` for sorted keys.",
      "`map.get(missing)` returns `null`, so `map.get(k) + 1` throws a `NullPointerException`.",
    ],
    cpp: [
      "`std::unordered_map` and `std::unordered_set` are hash tables; `std::map` and `std::set` are sorted trees (O(log n)).",
      "`m[key]` inserts a default value if the key is missing. Use `find` or `count` to check without inserting.",
      "Custom key types need a `std::hash` specialisation and an `operator==`.",
    ],
    python: [
      "`dict` and `set` are hash tables. `d.get(k, 0)`, `collections.Counter` and `collections.defaultdict` make counting easy.",
      "Dicts preserve insertion order (guaranteed since Python 3.7).",
      "Only hashable (immutable) values can be keys: use a tuple, not a list.",
      "Custom classes need matching `__eq__` and `__hash__`; `@dataclass(frozen=True)` generates both.",
    ],
  },

  applications: [
    { title: 'Caching', description: 'Web caches and memoization map a request or input to a previously computed result.' },
    { title: 'Databases and indexes', description: 'Hash indexes and hash joins match rows by key in constant time.' },
    { title: 'Deduplication', description: 'A hash set removes duplicate emails, IDs or URLs in a single pass.' },
    { title: 'Security', description: 'Password storage and file integrity checks use cryptographic hash functions (a related but stronger idea).' },
  ],

  terminology: [
    { term: 'Hash function', definition: 'Maps a key to an integer used to choose a bucket.' },
    { term: 'Bucket', definition: 'A slot in the underlying array that holds zero or more entries.' },
    { term: 'Collision', definition: 'Two different keys mapping to the same bucket.' },
    { term: 'Separate chaining', definition: 'Resolving collisions by storing a list of entries per bucket.' },
    { term: 'Load factor', definition: 'Entries ÷ buckets; triggers a resize when it gets too high.' },
    { term: 'Rehashing', definition: 'Moving every entry into a larger bucket array after a resize.' },
    { term: 'Hash set vs hash map', definition: 'A set stores unique keys; a map stores key → value pairs.' },
  ],

  examples: [
    {
      title: 'Counting with a hash map and one-pass Two Sum',
      description: 'Word frequencies, and the classic trick of remembering what you have already seen.',
      code: java`
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

public class HashingBasics {
    // Two Sum in one pass: remember each value's index as we go
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) {
                return new int[]{seen.get(need), i};
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        String text = "the cat and the hat and the bat";
        Map<String, Integer> freq = new HashMap<>();
        for (String word : text.split(" ")) {
            freq.put(word, freq.getOrDefault(word, 0) + 1);
        }
        // TreeMap prints keys in sorted order (HashMap order is not guaranteed)
        System.out.println(new TreeMap<>(freq));

        int[] pair = twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println("Two Sum: [" + pair[0] + ", " + pair[1] + "]");
    }
}`,
      notes: [
        { match: 'freq.getOrDefault(word, 0) + 1', text: 'Returns 0 for unseen words, so counting needs no special case. (`freq.merge(word, 1, Integer::sum)` is equivalent.)' },
        { match: 'if (seen.containsKey(need))', text: 'An O(1) lookup replaces an inner loop, turning O(n²) into O(n).' },
        { match: 'new TreeMap<>(freq)', text: 'HashMap iteration order is unspecified; copying into a TreeMap gives sorted, predictable output.' },
      ],
      output: '{and=2, bat=1, cat=1, hat=1, the=3}\nTwo Sum: [0, 1]',
      time: 'O(n) average for both',
      space: 'O(n) for the maps',
    },
    {
      title: 'How a hash map works inside',
      description: 'A simplified hash map with separate chaining: each bucket is a linked list of entries.',
      code: java`
import java.util.LinkedList;

public class SimpleHashMap {
    static class Entry {
        final String key;
        int value;
        Entry(String key, int value) { this.key = key; this.value = value; }
    }

    private final LinkedList<Entry>[] buckets;

    @SuppressWarnings("unchecked")
    SimpleHashMap(int capacity) {
        buckets = new LinkedList[capacity];
        for (int i = 0; i < capacity; i++) buckets[i] = new LinkedList<>();
    }

    private int indexFor(String key) {
        // floorMod keeps the index non-negative even if hashCode() is negative
        return Math.floorMod(key.hashCode(), buckets.length);
    }

    void put(String key, int value) {
        for (Entry e : buckets[indexFor(key)]) {
            if (e.key.equals(key)) { e.value = value; return; }   // update
        }
        buckets[indexFor(key)].add(new Entry(key, value));        // insert
    }

    Integer get(String key) {
        for (Entry e : buckets[indexFor(key)]) {
            if (e.key.equals(key)) return e.value;
        }
        return null;
    }

    public static void main(String[] args) {
        SimpleHashMap ages = new SimpleHashMap(8);
        ages.put("Asha", 21);
        ages.put("Ravi", 23);
        ages.put("Asha", 22);           // same key: value is replaced
        System.out.println("Asha: " + ages.get("Asha"));
        System.out.println("Ravi: " + ages.get("Ravi"));
        System.out.println("Meera: " + ages.get("Meera"));
    }
}`,
      notes: [
        { match: 'Math.floorMod(key.hashCode(), buckets.length)', text: '`hashCode()` can be negative, and `%` would then give a negative index. `floorMod` always returns 0..capacity−1.' },
        { match: 'if (e.key.equals(key)) { e.value = value; return; }', text: 'The hash picks the bucket; `equals` finds the exact key inside it.' },
        { match: 'return null;', text: 'Missing keys return `null`, just like `HashMap.get`.' },
      ],
      output: 'Asha: 22\nRavi: 23\nMeera: null',
      time: 'O(1) average; O(n) if every key collides',
      space: 'O(n + capacity)',
    },
  ],

  algorithm: {
    title: 'What happens inside map.put(key, value)',
    steps: [
      'Compute the key’s hash code `h` (libraries often mix the bits to spread keys more evenly).',
      'Convert the hash to a bucket index in the range `0..capacity − 1`.',
      'Scan that bucket’s entries. If an entry’s key equals the new key, replace its value and stop.',
      'Otherwise append a new entry to the bucket.',
      'Increase the size. If `size / capacity` exceeds the load factor (0.75), double the capacity and rehash every entry into the new array.',
    ],
  },

  complexity: {
    columns: ['Operation', 'Average', 'Worst case'],
    rows: [
      ['put / insert', 'O(1)', 'O(n)'],
      ['get / contains', 'O(1)', 'O(n)'],
      ['remove', 'O(1)', 'O(n)'],
      ['Iterate all entries', 'O(n + capacity)', 'O(n + capacity)'],
      ['Resize / rehash', 'O(n)', 'Rare, so insertion stays amortised O(1)'],
    ],
    note: 'Space is O(n). Ordered maps (Java `TreeMap`, C++ `std::map`) are the sorted alternative, with O(log n) operations.',
  },

  mistakes: [
    { mistake: 'Using a custom type as a key without consistent equality and hashing.', fix: 'Equal keys must hash equally. The notes for your language show how to define both.' },
    { mistake: 'Mutating an object after using it as a key.', fix: 'Its hash changes and it becomes unfindable. Use immutable keys.' },
    { mistake: 'Relying on hash map iteration order.', fix: 'It is unspecified in Java and C++ (Python dicts keep insertion order). Use an ordered map when order matters.' },
    { mistake: 'Reading a key that may be missing.', fix: 'Use a default: `getOrDefault` (Java), `find` or `count` (C++), `get(key, 0)` (Python).' },
    { mistake: 'Writing `hash % capacity` with a possibly negative hash.', fix: 'In Java and C++, `%` can return a negative number for a negative int. Use `Math.floorMod` or an unsigned hash.' },
  ],

  takeaways: [
    'Hash tables give O(1) average insert, lookup and delete.',
    'Collisions are normal; chaining and resizing keep them cheap.',
    'Custom keys need consistent equality and hashing.',
    'Reach for a hash map or set whenever you find yourself searching inside a loop.',
    'Use an ordered (tree) map when you need keys in sorted order.',
  ],

  practice: ['two-sum', 'contains-duplicate', 'group-anagrams', 'valid-anagram'],
};
