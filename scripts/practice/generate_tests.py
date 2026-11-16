#!/usr/bin/env python3
"""
Generates the test cases for the Coding Practice module.

Every expected answer is computed by a reference solution below, never typed by
hand. Output:
  src/data/practice/visibleTests.json  - examples + sample tests (shipped to the browser)
  server/data/hiddenTests.json         - hidden tests (server only, never sent to the browser)

Arguments are stored as JSON values in parameter order. Linked lists are
arrays; binary trees are level-order arrays with null for missing children.
The browser and server turn these into stdin text with src/data/practice/io.js.

Run from the project root:  python3 scripts/practice/generate_tests.py
"""
import json
import random
from collections import Counter, deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
rng = random.Random(2026)


# ----------------------------------------------------------------- helpers
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right


def build_tree(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue, i = deque([root]), 1
    while queue and i < len(values):
        node = queue.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i]); queue.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i]); queue.append(node.right)
        i += 1
    return root


def tree_to_level_list(root):
    """Level-order list with None for gaps, trailing Nones removed."""
    out, queue = [], deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            out.append(None)
        else:
            out.append(node.val); queue.append(node.left); queue.append(node.right)
    while out and out[-1] is None:
        out.pop()
    return out


def bst_from_sorted(values):
    if not values:
        return None
    mid = len(values) // 2
    return TreeNode(values[mid], bst_from_sorted(values[:mid]), bst_from_sorted(values[mid + 1:]))


def random_tree(n, lo=-100, hi=100):
    if n == 0:
        return []
    nodes = [TreeNode(rng.randint(lo, hi)) for _ in range(n)]
    for i in range(1, n):  # attach each node to a random earlier node with a free slot
        while True:
            parent = nodes[rng.randrange(i)]
            side = rng.choice(["left", "right"])
            if getattr(parent, side) is None:
                setattr(parent, side, nodes[i]); break
    return tree_to_level_list(nodes[0])


# ------------------------------------------------------ reference solutions
def fizz_buzz(n):
    return ["FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else str(i)
            for i in range(1, n + 1)]


def two_sum(nums, target):
    seen = {}
    for i, v in enumerate(nums):
        if target - v in seen:
            return sorted([seen[target - v], i])
        seen[v] = i


def max_profit(prices):
    best, low = 0, float("inf")
    for p in prices:
        low = min(low, p); best = max(best, p - low)
    return best


def max_subarray(nums):
    best = cur = nums[0]
    for v in nums[1:]:
        cur = max(v, cur + v); best = max(best, cur)
    return best


def trap(height):
    left, right, lmax, rmax, water = 0, len(height) - 1, 0, 0, 0
    while left < right:
        if height[left] < height[right]:
            lmax = max(lmax, height[left]); water += lmax - height[left]; left += 1
        else:
            rmax = max(rmax, height[right]); water += rmax - height[right]; right -= 1
    return water


def is_anagram(s, t):
    return Counter(s) == Counter(t)


def length_of_longest_substring(s):
    last, start, best = {}, 0, 0
    for i, c in enumerate(s):
        if c in last and last[c] >= start:
            start = last[c] + 1
        last[c] = i; best = max(best, i - start + 1)
    return best


def binary_search(nums, target):
    return nums.index(target) if target in nums else -1


def search_rotated(nums, target):
    return nums.index(target) if target in nums else -1


def merge_intervals(intervals):
    out = []
    for s, e in sorted(intervals):
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out


def kth_largest(nums, k):
    return sorted(nums, reverse=True)[k - 1]


def reverse_list(values):
    return values[::-1]


def merge_two_lists(a, b):
    return sorted(a + b)


def is_valid_parentheses(s):
    pairs, stack = {")": "(", "]": "[", "}": "{"}, []
    for c in s:
        if c in "([{":
            stack.append(c)
        elif not stack or stack.pop() != pairs[c]:
            return False
    return not stack


def daily_temperatures(temps):
    answer, stack = [0] * len(temps), []
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop(); answer[j] = i - j
        stack.append(i)
    return answer


def recent_calls(times):
    window, out = deque(), []
    for t in times:
        window.append(t)
        while window[0] < t - 3000:
            window.popleft()
        out.append(len(window))
    return out


def max_sliding_window(nums, k):
    dq, out = deque(), []
    for i, v in enumerate(nums):
        while dq and nums[dq[-1]] <= v:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            out.append(nums[dq[0]])
    return out


def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


def generate_parentheses(n):
    out = []

    def go(cur, open_, close):
        if len(cur) == 2 * n:
            out.append(cur); return
        if open_ < n:
            go(cur + "(", open_ + 1, close)
        if close < open_:
            go(cur + ")", open_, close + 1)
    go("", 0, 0)
    return out


def max_depth(values):
    def depth(node):
        return 0 if node is None else 1 + max(depth(node.left), depth(node.right))
    return depth(build_tree(values))


def level_order(values):
    root = build_tree(values)
    if root is None:
        return []
    out, queue = [], deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft(); level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        out.append(level)
    return out


def is_valid_bst(values):
    def ok(node, lo, hi):
        if node is None:
            return True
        return lo < node.val < hi and ok(node.left, lo, node.val) and ok(node.right, node.val, hi)
    return ok(build_tree(values), float("-inf"), float("inf"))


def kth_smallest(values, k):
    out = []

    def inorder(node):
        if node:
            inorder(node.left); out.append(node.val); inorder(node.right)
    inorder(build_tree(values))
    return out[k - 1]


def num_islands(grid):
    rows, cols, seen, count = len(grid), len(grid[0]), set(), 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in seen:
                count += 1
                stack = [(r, c)]; seen.add((r, c))
                while stack:
                    y, x = stack.pop()
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < rows and 0 <= nx < cols and grid[ny][nx] == "1" and (ny, nx) not in seen:
                            seen.add((ny, nx)); stack.append((ny, nx))
    return count


def can_finish(num_courses, prerequisites):
    indeg, adj = [0] * num_courses, [[] for _ in range(num_courses)]
    for a, b in prerequisites:
        adj[b].append(a); indeg[a] += 1
    queue = deque(i for i in range(num_courses) if indeg[i] == 0)
    done = 0
    while queue:
        node = queue.popleft(); done += 1
        for nxt in adj[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                queue.append(nxt)
    return done == num_courses


def ladder_length(begin, end, words):
    words = set(words)
    if end not in words:
        return 0
    queue, seen = deque([(begin, 1)]), {begin}
    while queue:
        word, steps = queue.popleft()
        if word == end:
            return steps
        for i in range(len(word)):
            for ch in "abcdefghijklmnopqrstuvwxyz":
                nxt = word[:i] + ch + word[i + 1:]
                if nxt in words and nxt not in seen:
                    seen.add(nxt); queue.append((nxt, steps + 1))
    return 0


def climb_stairs(n):
    a, b = 1, 1
    for _ in range(n):
        a, b = b, a + b
    return a


def coin_change(coins, amount):
    inf = amount + 1
    dp = [0] + [inf] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return -1 if dp[amount] == inf else dp[amount]


def lcs(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            dp[i][j] = dp[i - 1][j - 1] + 1 if a[i - 1] == b[j - 1] else max(dp[i - 1][j], dp[i][j - 1])
    return dp[-1][-1]


def contains_duplicate(nums):
    return len(set(nums)) != len(nums)


def group_anagrams(words):
    groups = {}
    for w in words:
        groups.setdefault("".join(sorted(w)), []).append(w)
    return list(groups.values())


def last_stone_weight(stones):
    stones = sorted(stones)
    while len(stones) > 1:
        a, b = stones.pop(), stones.pop()
        if a != b:
            stones.append(a - b); stones.sort()
    return stones[0] if stones else 0


def can_jump(nums):
    reach = 0
    for i, v in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + v)
    return True


# ------------------------------------------------------------- input makers
def rand_list(n, lo, hi):
    return [rng.randint(lo, hi) for _ in range(n)]


def unique_two_sum(n, lo, hi):
    while True:
        nums = rng.sample(range(lo, hi), n)
        i, j = rng.sample(range(n), 2)
        target = nums[i] + nums[j]
        values = set(nums)
        pairs = sum(1 for v in nums if (target - v) in values and target - v != v) // 2
        if pairs == 1:
            return [nums, target]


def rotated(n, lo, hi):
    vals = sorted(rng.sample(range(lo, hi), n))
    k = rng.randrange(n)
    return vals[k:] + vals[:k]


def random_grid(rows, cols, p):
    return ["".join("1" if rng.random() < p else "0" for _ in range(cols)) for _ in range(rows)]


def random_word_list(length, count):
    letters = "abcdefg"
    return sorted({"".join(rng.choice(letters) for _ in range(length)) for _ in range(count)})


def ladder_case():
    words = random_word_list(3, 120)
    begin, end = rng.sample(words, 2)
    return [begin, end, words]


def dag_edges(n, m, cyclic=False):
    order = list(range(n)); rng.shuffle(order)
    edges = set()
    while len(edges) < m:
        i, j = sorted(rng.sample(range(n), 2))
        edges.add((order[j], order[i]))           # course order[j] requires order[i]
    edges = [list(e) for e in edges]
    if cyclic:
        a, b = edges[0]
        edges.append([b, a])
    return edges


# -------------------------------------------------------------- the suites
# Each entry: id -> (reference, visible args (first two are the worked examples), hidden args)
SUITES = {
    "fizz-buzz": (fizz_buzz, [[3], [5], [15], [1]], [[2], [10], [30], [100]]),
    "two-sum": (two_sum,
                [[[2, 7, 11, 15], 9], [[3, 2, 4], 6], [[3, 3], 6], [[-1, -2, -3, -4, -5], -8]],
                [[[0, 4, 3, 0], 0], [[1, 5, 9, 14], 23], [[-1000000000, 7, 1000000000], 0],
                 unique_two_sum(200, -10000, 10000), unique_two_sum(2000, -1000000, 1000000)]),
    "best-time-to-buy-and-sell-stock": (max_profit,
                [[[7, 1, 5, 3, 6, 4]], [[7, 6, 4, 3, 1]], [[2, 4, 1]], [[5]]],
                [[[1, 2]], [[3, 3, 3]], [[2, 1, 2, 1, 0, 1, 2]], [rand_list(5000, 0, 10000)], [list(range(10000, 0, -1))]]),
    "maximum-subarray": (max_subarray,
                [[[-2, 1, -3, 4, -1, 2, 1, -5, 4]], [[1]], [[5, 4, -1, 7, 8]], [[-3, -1, -2]]],
                [[[-1]], [[0, 0, 0]], [[8, -19, 5, -4, 20]], [rand_list(5000, -10000, 10000)], [rand_list(20000, -100, 90)]]),
    "trapping-rain-water": (trap,
                [[[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], [[4, 2, 0, 3, 2, 5]], [[1, 2, 3]], [[5, 0, 5]]],
                [[[0]], [[2, 0, 2, 0, 2]], [[5, 4, 1, 2]], [rand_list(3000, 0, 10000)], [rand_list(20000, 0, 10000)]]),
    "valid-anagram": (is_anagram,
                [["anagram", "nagaram"], ["rat", "car"], ["a", "ab"], ["listen", "silent"]],
                [["a", "a"], ["aacc", "ccac"], ["abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba"],
                 ["".join(rng.choice("abc") for _ in range(5000)), "".join(rng.choice("abc") for _ in range(5000))]]),
    "longest-substring-without-repeating-characters": (length_of_longest_substring,
                [["abcabcbb"], ["bbbbb"], ["pwwkew"], [""]],
                [[" "], ["a b c a"], ["dvdf"], ["abba"], ["".join(rng.choice("abcdefghij0123456789 ") for _ in range(20000))]]),
    "binary-search": (binary_search,
                [[[-1, 0, 3, 5, 9, 12], 9], [[-1, 0, 3, 5, 9, 12], 2], [[5], 5], [[2, 5], 1]],
                [[[1, 3, 5, 7], 7], [[1, 3, 5, 7], 1], [[1, 3, 5, 7], 8],
                 [sorted(rng.sample(range(-100000, 100000), 10000)), 0], [list(range(0, 20000, 2)), 9998]]),
    "search-in-rotated-sorted-array": (search_rotated,
                [[[4, 5, 6, 7, 0, 1, 2], 0], [[4, 5, 6, 7, 0, 1, 2], 3], [[1], 0], [[3, 1], 1]],
                [[[1, 3], 3], [[5, 1, 3], 5], [[6, 7, 8, 1, 2, 3, 4, 5], 8],
                 [rotated(5000, -100000, 100000), 77], [list(range(500, 1000)) + list(range(0, 500)), 499]]),
    "merge-intervals": (merge_intervals,
                [[[[1, 3], [2, 6], [8, 10], [15, 18]]], [[[1, 4], [4, 5]]], [[[1, 4], [0, 4]]], [[[5, 7]]]],
                [[[[1, 4], [2, 3]]], [[[2, 3], [4, 5], [6, 7], [8, 9], [1, 10]]], [[[1, 2], [3, 4]]],
                 [[sorted(rng.sample(range(0, 100000), 2)) for _ in range(2000)]]]),
    "kth-largest-element": (kth_largest,
                [[[3, 2, 1, 5, 6, 4], 2], [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], [[1], 1], [[7, 7, 7], 2]],
                [[[2, 1], 2], [[-1, -1], 1], [rand_list(10000, -10000, 10000), 5000], [rand_list(20000, 0, 100), 1]]),
    "reverse-linked-list": (reverse_list,
                [[[1, 2, 3, 4, 5]], [[1, 2]], [[]], [[7]]],
                [[[1, 1, 2]], [list(range(1, 101))], [rand_list(5000, -5000, 5000)]]),
    "merge-two-sorted-lists": (merge_two_lists,
                [[[1, 2, 4], [1, 3, 4]], [[], []], [[], [0]], [[5], [1, 2, 3]]],
                [[[1, 1, 1], [1, 1]], [[-10, -5, 0], [-7, 3, 100]], [sorted(rand_list(50, -100, 100)), sorted(rand_list(40, -100, 100))]]),
    "valid-parentheses": (is_valid_parentheses,
                [["()"], ["()[]{}"], ["(]"], ["([)]"]],
                [["{[]}"], ["("], ["]"], ["(("], ["(" * 5000 + ")" * 5000], ["([{}])" * 1000 + "}"]]),
    "daily-temperatures": (daily_temperatures,
                [[[73, 74, 75, 71, 69, 72, 76, 73]], [[30, 40, 50, 60]], [[30, 60, 90]], [[50]]],
                [[[90, 80, 70]], [[70, 70, 71]], [rand_list(5000, 30, 100)]]),
    "number-of-recent-calls": (recent_calls,
                [[[1, 100, 3001, 3002]], [[1, 5000, 9000]], [[3000, 6000, 6001]], [[42]]],
                [[[1, 2, 3, 3001, 3002, 3003]], [sorted(rng.sample(range(1, 1000000), 3000))]]),
    "sliding-window-maximum": (max_sliding_window,
                [[[1, 3, -1, -3, 5, 3, 6, 7], 3], [[1], 1], [[9, 11], 2], [[4, -2], 1]],
                [[[1, -1], 1], [[7, 2, 4], 2], [[1, 3, 1, 2, 0, 5], 3], [rand_list(10000, -10000, 10000), 100], [list(range(5000, 0, -1)), 7]]),
    "fibonacci-number": (fib, [[2], [3], [4], [0]], [[1], [10], [20], [30]]),
    "generate-parentheses": (generate_parentheses, [[3], [1], [2], [4]], [[5], [6], [8]]),
    "maximum-depth-of-binary-tree": (max_depth,
                [[[3, 9, 20, None, None, 15, 7]], [[1, None, 2]], [[]], [[0]]],
                [[[1, 2, 3, 4, None, None, 5, 6]], [tree_to_level_list(bst_from_sorted(list(range(1000))))], [random_tree(500)]]),
    "binary-tree-level-order-traversal": (level_order,
                [[[3, 9, 20, None, None, 15, 7]], [[1]], [[]], [[1, 2, 3, 4, None, None, 5]]],
                [[[1, None, 2, None, 3]], [random_tree(60)], [random_tree(800)]]),
    "validate-binary-search-tree": (is_valid_bst,
                [[[2, 1, 3]], [[5, 1, 4, None, None, 3, 6]], [[1]], [[5, 4, 6, None, None, 3, 7]]],
                [[[2, 2, 2]], [[-2147483648, None, 2147483647]], [[2147483647]], [[10, 5, 15, None, None, 6, 20]],
                 [tree_to_level_list(bst_from_sorted(list(range(0, 3000, 3))))]]),
    "kth-smallest-element-in-a-bst": (kth_smallest,
                [[[3, 1, 4, None, 2], 1], [[5, 3, 6, 2, 4, None, None, 1], 3], [[1], 1], [[2, 1, 3], 3]],
                [[[4, 2, 6, 1, 3, 5, 7], 4], [tree_to_level_list(bst_from_sorted(list(range(-500, 1500, 2)))), 777]]),
    "number-of-islands": (num_islands,
                [[["11110", "11010", "11000", "00000"]], [["11000", "11000", "00100", "00011"]], [["0"]], [["1"]]],
                [[["10101", "01010", "10101"]], [["111", "101", "111"]], [random_grid(60, 80, 0.45)], [random_grid(100, 100, 0.55)]]),
    "course-schedule": (can_finish,
                [[2, [[1, 0]]], [2, [[1, 0], [0, 1]]], [1, []], [3, [[1, 0], [2, 1]]]],
                [[3, [[0, 1], [1, 2], [2, 0]]], [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], [2, [[0, 0]]],
                 [500, dag_edges(500, 1500)], [500, dag_edges(500, 1500, cyclic=True)]]),
    "word-ladder": (ladder_length,
                [["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], ["hit", "cog", ["hot", "dot", "dog", "lot", "log"]],
                 ["a", "c", ["a", "b", "c"]], ["hot", "dog", ["hot", "dog"]]],
                [["red", "tax", ["ted", "tex", "red", "tax", "tad", "den", "rex", "pee"]], ladder_case(), ladder_case()]),
    "climbing-stairs": (climb_stairs, [[2], [3], [1], [5]], [[10], [30], [45]]),
    "coin-change": (coin_change,
                [[[1, 2, 5], 11], [[2], 3], [[1], 0], [[1, 3, 4], 6]],
                [[[2, 5, 10, 1], 27], [[186, 419, 83, 408], 6249], [[7], 1], [[3, 7, 405, 436], 8839]]),
    "longest-common-subsequence": (lcs,
                [["abcde", "ace"], ["abc", "abc"], ["abc", "def"], ["ABCBDAB", "BDCABA"]],
                [["a", "a"], ["bsbininm", "jmjkbkjkv"], ["".join(rng.choice("acgt") for _ in range(800)), "".join(rng.choice("acgt") for _ in range(700))]]),
    "contains-duplicate": (contains_duplicate,
                [[[1, 2, 3, 1]], [[1, 2, 3, 4]], [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], [[0]]],
                [[[-1, 1]], [list(range(10000))], [list(range(10000)) + [9999]]]),
    "group-anagrams": (group_anagrams,
                [[["eat", "tea", "tan", "ate", "nat", "bat"]], [["a"]], [["abc", "cab", "xyz"]], [["ab", "ba", "ab"]]],
                [[["listen", "silent", "enlist", "google", "gogole", "cat"]],
                 [["".join(rng.sample("abcde", 3)) for _ in range(300)]]]),
    "last-stone-weight": (last_stone_weight,
                [[[2, 7, 4, 1, 8, 1]], [[1]], [[3, 3]], [[10, 4]]],
                [[[1, 1, 1]], [[9, 3, 2, 10]], [rand_list(1000, 1, 1000)]]),
    "jump-game": (can_jump,
                [[[2, 3, 1, 1, 4]], [[3, 2, 1, 0, 4]], [[0]], [[1, 0, 1]]],
                [[[2, 0, 0]], [[1, 1, 0, 1]], [[1] * 10000], [[5] + [1] * 2000 + [0, 0]]]),
}


def run():
    visible, hidden = {}, {}
    for pid, (ref, vis, hid) in SUITES.items():
        visible[pid] = [{"args": args, "expected": ref(*json.loads(json.dumps(args)))} for args in vis]
        hidden[pid] = [{"args": args, "expected": ref(*json.loads(json.dumps(args)))} for args in hid]
    (ROOT / "src/data/practice").mkdir(parents=True, exist_ok=True)
    (ROOT / "server/data").mkdir(parents=True, exist_ok=True)
    (ROOT / "src/data/practice/visibleTests.json").write_text(json.dumps(visible, separators=(",", ":")) + "\n")
    (ROOT / "server/data/hiddenTests.json").write_text(json.dumps(hidden, separators=(",", ":")) + "\n")
    print(f"{len(SUITES)} problems, {sum(map(len, visible.values()))} visible and {sum(map(len, hidden.values()))} hidden tests")


if __name__ == "__main__":
    run()
