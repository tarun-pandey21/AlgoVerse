import { java } from './helpers.js';

export default {
  summary:
    'Before data structures, you need a solid grip on the building blocks: storing values, making decisions, repeating work, packaging logic into methods, and estimating how fast code runs.',

  introduction: [
    'Every algorithm in this course is built from a small set of ideas: **variables** hold data, **conditions** choose between paths, **loops** repeat work, and **methods** give a name to a reusable piece of logic. If these feel natural, the rest of DSA becomes much easier.',
    'This lesson also introduces **Big-O notation**, the language we use to compare algorithms. Instead of timing code with a stopwatch, which depends on the computer, we count how the number of steps grows as the input gets bigger.',
  ],

  concepts: [
    {
      heading: 'Variables and data types',
      paragraphs: [
        'A variable is a named box that stores a value. Every value has a **type** (whole number, decimal, character, true/false, text, list…), and the type decides what you can do with it. Java and C++ are **statically typed**: each variable’s type is declared and checked before the program runs. Python is **dynamically typed**: types are checked while it runs.',
      ],
      points: [
        '**Integers** hold whole numbers. A 32-bit integer holds about ±2.1 billion; a 64-bit integer holds far more. (Python integers simply grow as needed.)',
        '**Floating-point** numbers hold decimals, but only approximately: `0.1 + 0.2` is not exactly `0.3`.',
        '**Booleans** hold true/false; **characters** and **strings** hold text.',
        '**Collections** (arrays, lists) and objects are usually reached through a **reference**: the variable refers to data stored elsewhere in memory.',
      ],
    },
    {
      heading: 'Control flow',
      paragraphs: [
        '`if` / `else` lets a program choose between paths. Loops repeat a block of code: use a `for` loop when you know how many times to repeat, and a `while` loop when you repeat until a condition changes.',
        '`break` exits a loop immediately and `continue` skips to the next iteration. Both are useful in search algorithms, for example to stop as soon as the answer is found.',
      ],
    },
    {
      heading: 'Methods',
      paragraphs: [
        'A method packages logic behind a name, takes **parameters** and can **return** a value. Small, well-named methods make algorithms easier to read and test.',
        'How arguments are passed matters. When you pass a number, the function works on its own copy. When you pass an array or list, the function can usually change the caller’s data, because it can reach the same memory. Each language spells out the details a little differently (see the notes for your language below).',
      ],
    },
    {
      heading: 'Measuring efficiency with Big-O',
      paragraphs: [
        'Big-O describes how an algorithm’s running time (or memory) grows as the input size `n` grows. We keep the fastest-growing term and drop constants: `3n + 5` steps is simply **O(n)**.',
      ],
      points: [
        '**O(1)** constant: accessing `arr[i]`.',
        '**O(log n)** logarithmic: binary search halves the problem each step.',
        '**O(n)** linear: a single loop over the input.',
        '**O(n log n)**: efficient sorting such as merge sort.',
        '**O(n²)** quadratic: two nested loops over the input.',
        '**O(2ⁿ)** exponential: trying every subset; only feasible for small `n`.',
      ],
    },
  ],

  languageNotes: {
    java: [
      "Java is statically typed. `int` is 32-bit and silently wraps around on overflow; use `long` (64-bit), or `Math.addExact` to detect overflow.",
      "Java always passes arguments by value. For arrays and objects that value is a reference, so a method can change an array’s contents but cannot make the caller’s variable point somewhere else.",
      "Compare strings with `a.equals(b)`; `==` compares references.",
      "Integer division truncates: `7 / 2` is 3. Use `7 / 2.0` or a `(double)` cast for a decimal result.",
    ],
    cpp: [
      "C++ is statically typed. Signed integer overflow is **undefined behaviour**, so widen to `long long` before a result can exceed the `int` range.",
      "Arguments are copied by default. Pass large objects by `const&` to avoid the copy, or by `&` to let the function modify them.",
      "`std::string` compares content with `==`.",
      "Integer division truncates towards zero: `7 / 2` is 3 and `-7 / 2` is −3.",
    ],
    python: [
      "Python is dynamically typed: a variable can hold any type, and type errors appear when that line runs.",
      "Integers have arbitrary precision, so they never overflow (very large numbers are just slower).",
      "Arguments are references to objects. Changing a list inside a function changes the caller’s list; assigning a new value to the parameter does not.",
      "`/` always returns a float; `//` is floor division, so `-7 // 2` is −4.",
    ],
  },

  applications: [
    { title: 'Input validation', description: 'Conditions check that user input (an age, an email, a PIN) is valid before it is used.' },
    { title: 'Billing and finance', description: 'Loops total up line items; choosing a wide enough integer type and exact decimal arithmetic avoids overflow and rounding errors.' },
    { title: 'Games and simulations', description: 'A game loop runs repeatedly, updating positions and checking conditions every frame.' },
    { title: 'Capacity planning', description: 'Big-O estimates tell engineers whether a solution will still be fast with 10× or 1000× more users.' },
  ],

  terminology: [
    { term: 'Variable', definition: 'A named storage location holding a value of a declared type.' },
    { term: 'Primitive type', definition: 'A basic built-in value such as an integer, a decimal, a character or a boolean.' },
    { term: 'Reference', definition: 'A variable that refers to data stored elsewhere (an array, list or object) rather than holding it directly.' },
    { term: 'Method', definition: 'A named block of code that can accept parameters and return a result.' },
    { term: 'Integer overflow', definition: 'When a calculation exceeds a type’s range and silently wraps around to a wrong value.' },
    { term: 'Big-O notation', definition: 'An upper bound on how running time or memory grows with input size, ignoring constants.' },
    { term: 'Input size (n)', definition: 'The quantity that drives an algorithm’s work, such as the length of an array.' },
  ],

  examples: [
    {
      title: 'Loops and methods: total, average and maximum',
      description: 'Two small methods process an array of marks. This pattern of walking through data while tracking a running value appears in almost every algorithm.',
      code: java`
public class Fundamentals {
    // Returns the sum of all values in the array
    static int sum(int[] values) {
        int total = 0;
        for (int v : values) {
            total += v;
        }
        return total;
    }

    // Returns the largest value; assumes the array is not empty
    static int max(int[] values) {
        int best = values[0];
        for (int i = 1; i < values.length; i++) {
            if (values[i] > best) {
                best = values[i];
            }
        }
        return best;
    }

    public static void main(String[] args) {
        int[] marks = {72, 88, 95, 64, 81};
        int total = sum(marks);
        double average = (double) total / marks.length;

        System.out.println("Total: " + total);
        System.out.println("Average: " + average);
        System.out.println("Highest: " + max(marks));
    }
}`,
      notes: [
        { match: 'for (int v : values)', text: 'The enhanced for-loop visits every element. Use it when you don’t need the index.' },
        { match: 'int best = values[0];', text: 'Start with a real element rather than 0, so the method also works when every value is negative.' },
        { match: '(double) total / marks.length', text: 'Casting to `double` first avoids integer division, which would discard the decimal part.' },
      ],
      output: 'Total: 400\nAverage: 80.0\nHighest: 95',
      time: 'O(n) for each method',
      space: 'O(1) extra space',
    },
    {
      title: 'Integer overflow and integer division',
      description: 'Two silent bugs every beginner meets. The program compiles and runs, but prints surprising numbers.',
      code: java`
public class OverflowDemo {
    public static void main(String[] args) {
        int big = Integer.MAX_VALUE;
        System.out.println("int max: " + big);
        System.out.println("int max + 1: " + (big + 1));

        long safe = (long) big + 1;
        System.out.println("as long: " + safe);

        // Integer division drops the fractional part
        System.out.println("7 / 2 = " + (7 / 2));
        System.out.println("7 / 2.0 = " + (7 / 2.0));
        System.out.println("7 % 2 = " + (7 % 2));
    }
}`,
      notes: [
        { match: '(big + 1)', text: 'Adding 1 to the largest `int` wraps around to the most negative `int`. Java does not throw an error.' },
        { match: 'long safe = (long) big + 1;', text: 'Casting one operand to `long` makes the whole addition happen in 64-bit arithmetic.' },
        { match: '(7 % 2)', text: 'The remainder operator `%` is how you test for even/odd numbers and extract digits.' },
      ],
      output: 'int max: 2147483647\nint max + 1: -2147483648\nas long: 2147483648\n7 / 2 = 3\n7 / 2.0 = 3.5\n7 % 2 = 1',
      time: 'O(1)',
      space: 'O(1)',
    },
  ],

  algorithm: {
    title: 'Finding the maximum value in an array',
    steps: [
      'If the array is empty there is no maximum, so handle that case first (throw an error or return a sentinel).',
      'Store the first element in a variable `best`. It is the largest value seen so far.',
      'Loop over the remaining elements from index 1 to `n − 1`.',
      'For each element, compare it with `best`. If it is larger, replace `best` with it.',
      'After the loop, `best` holds the largest value. Return it.',
    ],
    dryRun: {
      title: 'Dry run with [72, 88, 95, 64, 81]',
      lines: [
        'best = 72',
        'i = 1 → 88 > 72, so best = 88',
        'i = 2 → 95 > 88, so best = 95',
        'i = 3 → 64 > 95? No, best stays 95',
        'i = 4 → 81 > 95? No, best stays 95',
        'Return 95',
      ],
    },
  },

  complexity: {
    columns: ['Operation', 'Time', 'Space'],
    rows: [
      ['Arithmetic, comparison, assignment', 'O(1)', 'O(1)'],
      ['Sum / maximum of n values', 'O(n)', 'O(1)'],
      ['Two nested loops over n values', 'O(n²)', 'O(1)'],
      ['Copying an array of n values', 'O(n)', 'O(n)'],
    ],
    note: 'Big-O ignores constant factors and lower-order terms, so 2n + 10 and n are both O(n). It describes growth, not exact running time.',
  },

  mistakes: [
    { mistake: 'Integer division by accident: in Java and C++, `5 / 2` gives 2.', fix: 'Make one operand a decimal (`5 / 2.0`). In Python, `/` always gives a decimal and `//` is integer division.' },
    { mistake: 'Off-by-one loop bounds, such as looping up to and including the length.', fix: 'Valid indices are 0 to `n − 1`, so loop while `i < n`.' },
    { mistake: 'Using floating-point numbers for exact values like money.', fix: 'Decimals are approximate. Store whole units (paise or cents) as integers, or use a decimal type.' },
    { mistake: 'Ignoring overflow when summing or multiplying large numbers.', fix: 'Use a 64-bit integer (`long` in Java, `long long` in C++) when values can exceed about 2.1 billion. Python integers never overflow.' },
    { mistake: 'Starting a maximum at 0.', fix: 'Initialise from the first element so negative inputs work.' },
  ],

  takeaways: [
    'Variables, conditions, loops and methods are the vocabulary of every algorithm.',
    'Choose number types deliberately: fixed-size integers can overflow, and integer division truncates.',
    'Know how your language passes arguments: functions get copies of numbers but usually shared access to arrays and lists.',
    'Big-O compares algorithms by growth rate: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ).',
    'Always dry-run your loop on a small example to catch off-by-one errors.',
  ],

  practice: ['fizz-buzz', 'two-sum', 'best-time-to-buy-and-sell-stock'],
};
