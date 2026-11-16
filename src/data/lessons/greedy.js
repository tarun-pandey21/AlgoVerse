import { java } from './helpers.js';

export default {
  summary:
    'A greedy algorithm makes the choice that looks best right now and never looks back. When it works it is simple and fast. The skill is knowing when it works.',

  introduction: [
    'A **greedy algorithm** builds a solution step by step, always taking the option that seems best at that moment: the cheapest, the earliest, the largest. It never revisits earlier decisions.',
    'Greedy algorithms are usually short and run in O(n log n) or better. The catch: a locally best choice is not always globally best. Part of learning greedy is learning to prove (or disprove) that the greedy choice is safe.',
  ],

  concepts: [
    {
      heading: 'When greedy works',
      paragraphs: ['A greedy algorithm gives an optimal answer when the problem has two properties:'],
      points: [
        '**Greedy-choice property:** some optimal solution starts with the greedy choice, so taking it never rules out the best answer.',
        '**Optimal substructure:** after making the choice, what remains is a smaller instance of the same problem.',
      ],
    },
    {
      heading: 'Sorting first',
      paragraphs: [
        'Most greedy solutions start by sorting: intervals by end time, items by value-per-weight, children by appetite. The sort usually dominates the running time at O(n log n).',
      ],
    },
    {
      heading: 'Proving it: the exchange argument',
      paragraphs: [
        'To show a greedy rule is optimal, take any optimal solution and show you can **swap** one of its choices for the greedy choice without making it worse. For activity selection: swapping the optimal schedule’s first meeting for the one that ends earliest never causes a conflict, so greedy is optimal.',
      ],
    },
    {
      heading: 'When greedy fails',
      paragraphs: [
        'Coin change with coins {4, 3, 1} and amount 6: greedy takes 4 + 1 + 1 (three coins), but 3 + 3 uses two. The 0/1 knapsack problem is similar. In such cases you need **dynamic programming**, which considers all choices.',
      ],
    },
  ],

  languageNotes: {
    java: [
      "Sort with a comparator: `Arrays.sort(items, (a, b) -> Integer.compare(a[1], b[1]))`.",
    ],
    cpp: [
      "Sort with a lambda: `sort(v.begin(), v.end(), [](const auto& a, const auto& b) { return a.second < b.second; })`.",
    ],
    python: [
      "Sort by a key: `items.sort(key=lambda m: m[1])`.",
    ],
  },

  applications: [
    { title: 'Meeting-room scheduling', description: 'Fit the most meetings into a room by always picking the one that ends earliest.' },
    { title: 'Data compression', description: 'Huffman coding greedily merges the two least frequent symbols to build an optimal prefix code (used in ZIP and JPEG).' },
    { title: 'Network design', description: 'Prim’s and Kruskal’s algorithms build minimum spanning trees to connect sites at the lowest cost.' },
    { title: 'Making change', description: 'Cash registers give change greedily. This works because real currency systems are designed for it.' },
  ],

  terminology: [
    { term: 'Greedy choice', definition: 'The locally best option at the current step.' },
    { term: 'Greedy-choice property', definition: 'A globally optimal solution can be reached by making greedy choices.' },
    { term: 'Optimal substructure', definition: 'An optimal solution contains optimal solutions to its subproblems.' },
    { term: 'Exchange argument', definition: 'A proof technique that swaps choices in an optimal solution for greedy ones.' },
    { term: 'Counterexample', definition: 'A specific input where the greedy answer is not optimal; one is enough to reject a greedy rule.' },
    { term: 'Interval scheduling', definition: 'Selecting non-overlapping intervals, a classic greedy problem.' },
  ],

  examples: [
    {
      title: 'Activity selection: schedule the most meetings',
      description: 'Sort by end time, then take every meeting that starts after the last chosen one ends.',
      code: java`
import java.util.Arrays;

public class ActivitySelection {
    public static void main(String[] args) {
        // Each meeting is {start, end}
        int[][] meetings = {{1, 4}, {3, 5}, {0, 6}, {5, 7}, {3, 9}, {5, 9},
                            {6, 10}, {8, 11}, {8, 12}, {2, 14}, {12, 16}};
        // Greedy choice: always take the meeting that finishes earliest
        Arrays.sort(meetings, (a, b) -> Integer.compare(a[1], b[1]));

        int count = 0, lastEnd = Integer.MIN_VALUE;
        StringBuilder chosen = new StringBuilder();
        for (int[] m : meetings) {
            if (m[0] >= lastEnd) {            // does not overlap the last chosen one
                count++;
                lastEnd = m[1];
                chosen.append("[").append(m[0]).append(", ").append(m[1]).append("] ");
            }
        }
        System.out.println("Meetings scheduled: " + count);
        System.out.println("Chosen: " + chosen.toString().trim());
    }
}`,
      notes: [
        { match: 'Arrays.sort(meetings, (a, b) -> Integer.compare(a[1], b[1]));', text: 'Sorting by **end** time is the key insight. Sorting by start time or length gives wrong answers.' },
        { match: 'if (m[0] >= lastEnd)', text: 'A meeting may start exactly when the previous one ends.' },
      ],
      output: 'Meetings scheduled: 4\nChosen: [1, 4] [5, 7] [8, 11] [12, 16]',
      time: 'O(n log n) for the sort + O(n) scan',
      space: 'O(1) extra (ignoring the sort’s internal space)',
    },
    {
      title: 'Greedy coin change, and where it breaks',
      description: 'With Indian rupee denominations the greedy method is optimal. With coins {4, 3, 1} it is not.',
      code: java`
public class GreedyCoins {
    // Greedy: always take as many of the largest coin as fit
    static int greedyCoins(int[] coins, int amount) {   // coins sorted descending
        int count = 0;
        for (int coin : coins) {
            count += amount / coin;
            amount %= coin;
        }
        return amount == 0 ? count : -1;
    }

    public static void main(String[] args) {
        int[] rupees = {2000, 500, 200, 100, 50, 20, 10, 5, 2, 1};
        System.out.println("Notes/coins for 2763: " + greedyCoins(rupees, 2763));

        // Greedy is NOT always optimal: coins {4, 3, 1}, amount 6
        int[] tricky = {4, 3, 1};
        System.out.println("Greedy for 6 with {4,3,1}: " + greedyCoins(tricky, 6));
        System.out.println("Optimal is 2 (3 + 3), which needs dynamic programming");
    }
}`,
      notes: [
        { match: 'count += amount / coin;', text: 'Take as many of this coin as possible in one step.' },
        { match: 'amount %= coin;', text: 'What is left over moves on to the next smaller coin.' },
        { match: 'greedyCoins(tricky, 6)', text: 'Greedy picks 4 first and is then forced into 1 + 1: three coins instead of two.' },
      ],
      output: 'Notes/coins for 2763: 7\nGreedy for 6 with {4,3,1}: 3\nOptimal is 2 (3 + 3), which needs dynamic programming',
      time: 'O(k) for k denominations',
      space: 'O(1)',
    },
  ],

  algorithm: {
    title: 'Activity selection (interval scheduling)',
    steps: [
      'Sort all activities by their finishing time, earliest first.',
      'Set `lastEnd` to minus infinity and `count` to 0.',
      'Scan the sorted activities. If an activity starts at or after `lastEnd`, select it: increment `count` and set `lastEnd` to its end time.',
      'Otherwise skip it; it overlaps the last selected activity.',
      'Return `count` (and the selected list).',
    ],
    dryRun: {
      title: 'Meetings sorted by end time',
      lines: [
        '[1,4] starts ≥ −∞ → take, lastEnd = 4',
        '[3,5], [0,6] start before 4 → skip',
        '[5,7] starts ≥ 4 → take, lastEnd = 7',
        '[3,9], [5,9], [6,10] → skip',
        '[8,11] → take, lastEnd = 11; [8,12], [2,14] → skip',
        '[12,16] → take. Total: 4 meetings',
      ],
    },
  },

  complexity: {
    columns: ['Problem', 'Greedy rule', 'Time'],
    rows: [
      ['Activity selection', 'Earliest finish time', 'O(n log n)'],
      ['Fractional knapsack', 'Highest value per unit weight', 'O(n log n)'],
      ['Coin change (canonical coins)', 'Largest coin that fits', 'O(k)'],
      ['Huffman coding', 'Merge two least frequent', 'O(n log n)'],
      ['Minimum spanning tree (Kruskal)', 'Cheapest edge without a cycle', 'O(E log E)'],
    ],
    note: 'Greedy algorithms typically need O(1) to O(n) extra space; sorting is usually the most expensive step.',
  },

  mistakes: [
    { mistake: 'Assuming a greedy rule is correct because it works on the examples.', fix: 'Try to break it with small counterexamples, or prove it with an exchange argument.' },
    { mistake: 'Sorting by the wrong key, e.g. by start time or duration in activity selection.', fix: 'Sort by end time; the earliest finish leaves the most room.' },
    { mistake: 'Using greedy for 0/1 knapsack or arbitrary coin systems.', fix: 'Those need dynamic programming.' },
    { mistake: 'Off-by-one in overlap checks (`>` vs `>=`).', fix: 'Decide whether touching intervals overlap and be consistent.' },
  ],

  takeaways: [
    'Greedy = make the best local choice and never undo it.',
    'It is optimal only with the greedy-choice property and optimal substructure.',
    'Most greedy algorithms sort first and run in O(n log n).',
    'One counterexample is enough to disprove a greedy strategy.',
    'When greedy fails, dynamic programming is usually the next tool.',
  ],

  practice: ['jump-game', 'merge-intervals', 'best-time-to-buy-and-sell-stock'],
};
