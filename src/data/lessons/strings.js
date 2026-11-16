import { java } from './helpers.js';

export default {
  summary:
    'Strings are sequences of characters. Whether your language lets you change them in place shapes how you compare, build and process them efficiently.',

  introduction: [
    'A **string** is an ordered sequence of characters, such as a name, a sentence or a DNA sequence. Many string problems are really array problems in disguise: you read the character at index `i` and loop through them just like array elements.',
    'In Java and Python, strings are **immutable**: once created, a string cannot change, and every “modification” returns a new string. That makes strings safe to share, but building a long string piece by piece needs care. C++’s `std::string` is mutable and can be changed in place.',
  ],

  concepts: [
    {
      heading: 'Indexing and characters',
      paragraphs: [
        'A string has a length and a character at each 0-based index. Characters are stored as numbers (character codes), so subtracting the code of `a` maps lowercase letters to 0–25. That trick powers many counting solutions.',
      ],
    },
    {
      heading: 'Immutability and building strings',
      paragraphs: [
        'When strings are immutable, writing `result = result + piece` inside a loop creates a brand-new string each time and copies all previous characters. Over `n` iterations that is O(n²) total work.',
        'The fix is to collect the pieces in a growable buffer and build the final string once: a string builder in Java, `"".join(pieces)` in Python. C++ strings are mutable, so `result += piece` already appends in place (amortised O(1)).',
      ],
    },
    {
      heading: 'Comparing strings',
      paragraphs: [
        'There are two different questions: do two strings contain the **same characters** (equality), or are they the **same object** in memory (identity)? You almost always want equality. Each language uses different operators for these, and mixing them up is a classic bug (see the notes for your language).',
      ],
    },
    {
      heading: 'Common techniques',
      paragraphs: ['Most string problems reuse a few ideas:'],
      points: [
        '**Two pointers** from both ends to test palindromes or reverse in place (on a `char[]`).',
        '**Frequency counting** with a 26-slot count array (for lowercase letters) or a hash map from character to count.',
        '**Sliding window** for substring problems such as “longest substring without repeating characters”.',
        '**Splitting and joining** with `split` and `String.join`.',
      ],
    },
  ],

  languageNotes: {
    java: [
      "`String` is immutable. Build strings with `StringBuilder.append(...)`, then call `toString()` once.",
      "Compare content with `a.equals(b)` or `equalsIgnoreCase`. `==` compares references and only *sometimes* works, because of the string pool.",
      "Read characters with `s.charAt(i)`. Note that `s.length()` is a method, while an array has a `length` field.",
      "Count characters with an `int[26]` array or a `HashMap<Character, Integer>`.",
    ],
    cpp: [
      "`std::string` is mutable: `s += t`, `s.push_back(c)` and `s[i] = c` change it in place.",
      "`==` compares content and `<` compares alphabetically.",
      "`s.substr(i, len)` takes a **length** as its second argument, not an end index.",
      "Pass strings as `const string&` to avoid copying them.",
    ],
    python: [
      "`str` is immutable. Build with `\"\".join(pieces)` rather than `+=` in a loop.",
      "Compare content with `==`. `is` checks identity and must not be used for strings.",
      "Slicing does a lot: `s[::-1]` reverses, and `s[i:j]` gives a substring (a copy).",
      "`collections.Counter(s)` counts every character in one line.",
    ],
  },

  applications: [
    { title: 'Search engines', description: 'Matching query words against documents relies on efficient substring search and tokenising.' },
    { title: 'Spell checkers and autocomplete', description: 'Edit distance and prefix matching suggest corrections and completions as you type.' },
    { title: 'Bioinformatics', description: 'DNA is a string over {A, C, G, T}. Finding patterns in it is a string-matching problem.' },
    { title: 'Data cleaning', description: 'Trimming, splitting and normalising text is the first step in processing CSVs, logs and forms.' },
  ],

  terminology: [
    { term: 'Immutable', definition: 'Cannot be changed after creation. Every “modification” of a `String` returns a new object.' },
    { term: 'Substring', definition: 'A contiguous run of characters, such as "gor" in "algorithm".' },
    { term: 'Subsequence', definition: 'Characters in order but not necessarily contiguous, such as "agi" in "algorithm".' },
    { term: 'Palindrome', definition: 'Reads the same forwards and backwards: "level", "racecar".' },
    { term: 'Anagram', definition: 'A rearrangement of the same letters with the same counts: "listen" and "silent".' },
    { term: 'String builder', definition: 'A growable character buffer used to build a string efficiently, then convert it once.' },
    { term: 'Equality vs identity', definition: 'Same characters vs the very same object in memory.' },
  ],

  examples: [
    {
      title: 'Palindrome and anagram checks',
      description: 'Two pointers skip punctuation and ignore case for the palindrome; a 26-slot count array checks anagrams in one pass.',
      code: java`
public class StringBasics {
    // Two pointers moving inward, ignoring non-alphanumeric characters and case
    static boolean isPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            char a = s.charAt(left), b = s.charAt(right);
            if (!Character.isLetterOrDigit(a)) { left++; continue; }
            if (!Character.isLetterOrDigit(b)) { right--; continue; }
            if (Character.toLowerCase(a) != Character.toLowerCase(b)) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }

    // Anagrams use every letter the same number of times
    static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];             // assumes lowercase a-z
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;
            count[t.charAt(i) - 'a']--;
        }
        for (int c : count) {
            if (c != 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome("Race car"));
        System.out.println(isPalindrome("hello"));
        System.out.println(isAnagram("listen", "silent"));
        System.out.println(isAnagram("rat", "car"));
    }
}`,
      notes: [
        { match: 'if (!Character.isLetterOrDigit(a))', text: 'Skip spaces and punctuation so "Race car" counts as a palindrome.' },
        { match: "count[s.charAt(i) - 'a']++;", text: "`'c' - 'a'` is 2: characters are numbers, so this maps each letter to a slot 0–25." },
        { match: 'if (c != 0) return false;', text: 'Every count returns to zero only if both strings use exactly the same letters.' },
      ],
      output: 'true\nfalse\ntrue\nfalse',
      time: 'O(n) for both checks',
      space: 'O(1): the count array has a fixed 26 slots',
    },
    {
      title: 'Building strings efficiently and comparing them correctly',
      description: 'Reverse the word order of a messy sentence, then compare two strings by content and by identity.',
      code: java`
public class StringBuilding {
    static String reverseWords(String sentence) {
        String[] words = sentence.trim().split("\\s+");   // split on 1+ spaces
        StringBuilder sb = new StringBuilder();
        for (int i = words.length - 1; i >= 0; i--) {
            sb.append(words[i]);
            if (i > 0) sb.append(' ');
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(reverseWords("  the sky   is blue "));

        String a = "algo";
        String b = new String("algo");
        System.out.println(a == b);        // different objects
        System.out.println(a.equals(b));   // same characters
    }
}`,
      notes: [
        { match: 'sentence.trim().split("\\\\s+")', text: '`trim` removes outer spaces; the regex `\\s+` treats runs of spaces as one separator.' },
        { match: 'StringBuilder sb = new StringBuilder();', text: 'One mutable buffer instead of creating a new String on every `+`.' },
        { match: 'System.out.println(a == b);', text: '`new String` always creates a separate object, so `==` is false even though the text matches.' },
      ],
      output: 'blue is sky the\nfalse\ntrue',
      time: 'O(n) where n is the sentence length',
      space: 'O(n) for the words array and builder',
    },
  ],

  algorithm: {
    title: 'Checking whether a string is a palindrome',
    steps: [
      'Place `left` at index 0 and `right` at the last index.',
      'While `left < right`, if `s[left]` is not a letter or digit, move `left` forward and repeat. Do the same for `right`, moving it backwards.',
      'Compare the two characters, ignoring case. If they differ, the string is not a palindrome. Return false.',
      'Otherwise move both pointers inward (`left++`, `right--`) and continue.',
      'If the pointers meet or cross without a mismatch, return true.',
    ],
    dryRun: {
      title: 'Dry run with "Race car"',
      lines: [
        "left=0 'R', right=7 'r' → equal ignoring case",
        "left=1 'a', right=6 'a' → equal",
        "left=2 'c', right=5 'c' → equal",
        "left=3 'e', right=4 ' ' → skip the space, right=3",
        'left = right → stop, return true',
      ],
    },
  },

  complexity: {
    columns: ['Operation', 'Time', 'Notes'],
    rows: [
      ['Read character i, length', 'O(1)', 'Direct index into the character array'],
      ['Compare two strings', 'O(n)', 'Compares character by character'],
      ['Substring / slice from i to j', 'O(j − i)', 'Copies the characters into a new string'],
      ['s + t', 'O(n + m)', 'Creates a new string'],
      ['+ in a loop on immutable strings', 'O(n²)', 'Avoid: use a builder or join'],
      ['Append to a builder or C++ string', 'O(1) amortised', 'Occasional resize copies the buffer'],
    ],
    note: 'Palindrome and anagram checks run in O(n) time. The anagram count array is O(1) space because its size never depends on n.',
  },

  mistakes: [
    { mistake: 'Comparing strings by identity instead of content.', fix: 'Use your language’s equality check: `equals` in Java, `==` in C++ and Python (never `is`).' },
    { mistake: 'Building a long string with `+=` in a loop.', fix: 'With immutable strings (Java, Python), collect the pieces and build once with a builder or `join`.' },
    { mistake: 'Assuming an upper-case or trim method changes the original string.', fix: 'In Java and Python these return a new string, so assign the result back.' },
    { mistake: 'Using `count[c - \'a\']` when the input has uppercase, digits or spaces.', fix: 'Normalise first, or use a larger count array or a hash map.' },
    { mistake: 'Confusing substring with subsequence.', fix: 'A substring is contiguous; a subsequence may skip characters.' },
  ],

  takeaways: [
    'In Java and Python strings are immutable; every change returns a new string.',
    'Build strings with a builder or `join`, not repeated `+` on immutable strings (O(n²)).',
    'Compare content (equality), not identity.',
    'Frequency arrays and two pointers solve a large share of string problems in O(n).',
    'Many string problems are array problems on `char` values.',
  ],

  practice: ['valid-anagram', 'longest-substring-without-repeating-characters', 'group-anagrams'],
};
