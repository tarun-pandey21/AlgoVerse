import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <cctype>
#include <iostream>
#include <string>
using namespace std;

// Two pointers moving inward, ignoring non-alphanumeric characters and case
bool isPalindrome(const string& s) {
    int left = 0, right = (int)s.size() - 1;
    while (left < right) {
        unsigned char a = s[left], b = s[right];
        if (!isalnum(a)) { left++; continue; }
        if (!isalnum(b)) { right--; continue; }
        if (tolower(a) != tolower(b)) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}

// Anagrams use every letter the same number of times
bool isAnagram(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    int count[26] = {0};                  // assumes lowercase a-z
    for (size_t i = 0; i < s.size(); i++) {
        count[s[i] - 'a']++;
        count[t[i] - 'a']--;
    }
    for (int c : count) {
        if (c != 0) return false;
    }
    return true;
}

int main() {
    cout << boolalpha;                    // print true/false instead of 1/0
    cout << isPalindrome("Race car") << "\n";
    cout << isPalindrome("hello") << "\n";
    cout << isAnagram("listen", "silent") << "\n";
    cout << isAnagram("rat", "car") << "\n";
}`,
      notes: [
        { match: 'unsigned char a = s[left]', text: '`isalnum` and `tolower` expect values that fit in `unsigned char`; passing a negative `char` is undefined behaviour.' },
        { match: "count[s[i] - 'a']++;", text: "`'c' - 'a'` is 2: characters are numbers, so this maps each letter to a slot 0–25." },
        { match: 'int count[26] = {0};', text: 'Initialise the counts explicitly; local arrays in C++ start with garbage values.' },
        { match: 'cout << boolalpha;', text: 'Without `boolalpha`, `cout` prints booleans as 1 and 0.' },
      ],
    },
    {
      code: cpp`
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

string reverseWords(const string& sentence) {
    istringstream in(sentence);           // >> skips any run of whitespace
    vector<string> words;
    string word;
    while (in >> word) words.push_back(word);

    string result;
    for (int i = (int)words.size() - 1; i >= 0; i--) {
        result += words[i];               // std::string is mutable: += appends in place
        if (i > 0) result += ' ';
    }
    return result;
}

int main() {
    cout << reverseWords("  the sky   is blue ") << "\n";

    string a = "algo";
    string b = string("al") + "go";
    cout << boolalpha;
    cout << (a == b) << "\n";             // compares the characters
    cout << (&a == &b) << "\n";           // compares addresses: two different objects
}`,
      notes: [
        { match: 'istringstream in(sentence);', text: 'Reading words with `>>` from a string stream splits on any amount of whitespace, which handles messy spacing.' },
        { match: 'result += words[i];', text: 'C++ strings are mutable, so `+=` appends to the same buffer (amortised O(1) per character).' },
        { match: 'cout << (a == b) << "\\n";', text: 'For `std::string`, `==` compares content, unlike Java, where `==` compares references.' },
      ],
      output: 'blue is sky the\ntrue\nfalse',
    },
  ],

  python: [
    {
      code: python`
def is_palindrome(s):
    """Two pointers moving inward, ignoring non-alphanumeric characters and case."""
    left, right = 0, len(s) - 1
    while left < right:
        if not s[left].isalnum():
            left += 1
            continue
        if not s[right].isalnum():
            right -= 1
            continue
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True


def is_anagram(s, t):
    """Anagrams use every letter the same number of times."""
    if len(s) != len(t):
        return False
    count = [0] * 26                      # assumes lowercase a-z
    for a, b in zip(s, t):
        count[ord(a) - ord("a")] += 1
        count[ord(b) - ord("a")] -= 1
    return all(c == 0 for c in count)


print(is_palindrome("Race car"))
print(is_palindrome("hello"))
print(is_anagram("listen", "silent"))
print(is_anagram("rat", "car"))`,
      notes: [
        { match: "if not s[left].isalnum():", text: 'Skip spaces and punctuation so "Race car" counts as a palindrome.' },
        { match: 'count[ord(a) - ord("a")] += 1', text: '`ord` gives a character’s code point, so `ord(c) - ord("a")` maps letters to 0–25.' },
        { match: 'for a, b in zip(s, t):', text: '`zip` walks both strings together, one pair of characters at a time.' },
        { match: 'return all(c == 0 for c in count)', text: '`all` returns True only if every count is back to zero.' },
      ],
      output: 'True\nFalse\nTrue\nFalse',
    },
    {
      code: python`
def reverse_words(sentence):
    words = sentence.split()              # no argument: split on any run of whitespace
    return " ".join(reversed(words))      # join builds the result in one pass


print(reverse_words("  the sky   is blue "))

a = "algo"
b = "".join(["al", "go"])                 # built at runtime: a separate object
print(a == b)                             # compares the characters
print(a is b)                             # compares identity`,
      notes: [
        { match: 'words = sentence.split()', text: 'With no argument, `split()` ignores leading/trailing spaces and treats runs of spaces as one separator.' },
        { match: 'return " ".join(reversed(words))', text: 'Strings are immutable, so build once with `join` rather than `+=` in a loop.' },
        { match: 'print(a == b)', text: '`==` compares content. `is` checks whether two names refer to the very same object; don’t use it for strings.' },
      ],
      output: 'blue is sky the\nTrue\nFalse',
    },
  ],
};
