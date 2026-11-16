import { java } from './helpers.js';

export default {
  summary:
    'Graphs model connections: roads between cities, friendships, links between pages, dependencies between tasks. BFS, DFS and Dijkstra answer most questions about them.',

  introduction: [
    'A **graph** is a set of **vertices** (nodes) connected by **edges**. Unlike trees, graphs can have cycles, multiple paths between the same nodes, and parts that are completely disconnected.',
    'Many real problems become graph problems once you spot the vertices and edges: cells in a grid, courses with prerequisites, airports with flights. After that, a handful of algorithms (breadth-first search, depth-first search and shortest paths) solve a surprising range of them.',
  ],

  concepts: [
    {
      heading: 'Types of graphs',
      paragraphs: [],
      points: [
        '**Undirected** edges go both ways (friendship); **directed** edges have a direction (following someone).',
        '**Weighted** edges carry a cost, such as distance or time; **unweighted** edges all count as 1.',
        '**Cyclic** graphs contain a path that returns to its start; a **DAG** (directed acyclic graph) has none and models dependencies.',
      ],
    },
    {
      heading: 'Representations',
      paragraphs: [
        'An **adjacency list** stores, for each vertex, the list of its neighbours. It uses O(V + E) space and is the default choice. An **adjacency matrix** is a V × V grid where `matrix[u][v]` marks an edge. It gives O(1) edge lookups but needs O(V²) space, so it suits small, dense graphs.',
      ],
    },
    {
      heading: 'BFS and DFS',
      paragraphs: [
        '**Breadth-first search** uses a queue and explores neighbours level by level, so in an unweighted graph it finds the **shortest path** (fewest edges). **Depth-first search** uses recursion (or a stack) and goes as deep as possible before backtracking. It is natural for detecting cycles, finding connected components and topological sorting.',
        'Both must track **visited** vertices. Without that, a cycle makes them loop forever.',
      ],
    },
    {
      heading: 'Shortest paths with weights',
      paragraphs: [
        'When edges have non-negative weights, **Dijkstra’s algorithm** finds the shortest distance from a source to every vertex. It repeatedly takes the closest unsettled vertex from a min-heap and **relaxes** its edges, updating a neighbour’s distance if going through this vertex is shorter. Negative weights need Bellman-Ford instead.',
      ],
    },
  ],

  languageNotes: {
    java: [
      "Adjacency list: `List<List<Integer>> adj`. Use `ArrayDeque` for BFS and a `PriorityQueue<int[]>` for Dijkstra.",
      "Deep recursive DFS on a large graph can throw `StackOverflowError`; use an explicit stack instead.",
    ],
    cpp: [
      "Adjacency list: `vector<vector<int>> adj(n)`. Use `std::queue` for BFS.",
      "For Dijkstra, a `priority_queue` of `{distance, node}` pairs with `greater<>` gives a min-heap ordered by distance.",
    ],
    python: [
      "Adjacency list: `[[] for _ in range(n)]` or a `collections.defaultdict(list)`.",
      "Use `collections.deque` for BFS, a `set` for visited vertices, and `heapq` with `(distance, node)` tuples for Dijkstra.",
      "Recursive DFS hits the recursion limit (about 1000) on big graphs: use an explicit stack.",
    ],
  },

  applications: [
    { title: 'Maps and navigation', description: 'Road networks are weighted graphs; shortest-path algorithms compute routes and ETAs.' },
    { title: 'Social networks', description: '“People you may know” explores friends-of-friends with BFS.' },
    { title: 'Build systems and course planning', description: 'Topological sort orders tasks so that every prerequisite comes first.' },
    { title: 'Networks and the web', description: 'Routers find paths for packets; search engines crawl the link graph of web pages.' },
  ],

  terminology: [
    { term: 'Vertex / node', definition: 'An entity in the graph (a city, a person, a cell).' },
    { term: 'Edge', definition: 'A connection between two vertices, possibly directed and/or weighted.' },
    { term: 'Degree', definition: 'Number of edges touching a vertex (in-degree / out-degree when directed).' },
    { term: 'Path / cycle', definition: 'A sequence of connected vertices; a cycle starts and ends at the same vertex.' },
    { term: 'Connected component', definition: 'A maximal group of vertices that can all reach each other.' },
    { term: 'Adjacency list', definition: 'For each vertex, a list of its neighbours.' },
    { term: 'Relaxation', definition: 'Updating `dist[v]` if `dist[u] + weight(u, v)` is smaller.' },
  ],

  examples: [
    {
      title: 'Adjacency list, BFS and DFS',
      description: 'Build an undirected graph, then traverse it breadth-first and depth-first from vertex 0.',
      code: java`
import java.util.*;

public class GraphTraversal {
    public static void main(String[] args) {
        int n = 6;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[][] edges = {{0, 1}, {0, 2}, {1, 3}, {2, 4}, {3, 5}, {4, 5}};
        for (int[] e : edges) {             // undirected: add both directions
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }

        System.out.println("BFS from 0: " + bfs(adj, 0));
        List<Integer> dfsOrder = new ArrayList<>();
        dfs(adj, 0, new boolean[n], dfsOrder);
        System.out.println("DFS from 0: " + dfsOrder);
    }

    static List<Integer> bfs(List<List<Integer>> adj, int start) {
        List<Integer> order = new ArrayList<>();
        boolean[] visited = new boolean[adj.size()];
        Queue<Integer> queue = new ArrayDeque<>();
        visited[start] = true;               // mark when enqueued, not when dequeued
        queue.offer(start);
        while (!queue.isEmpty()) {
            int node = queue.poll();
            order.add(node);
            for (int next : adj.get(node)) {
                if (!visited[next]) {
                    visited[next] = true;
                    queue.offer(next);
                }
            }
        }
        return order;
    }

    static void dfs(List<List<Integer>> adj, int node, boolean[] visited, List<Integer> order) {
        visited[node] = true;
        order.add(node);
        for (int next : adj.get(node)) {
            if (!visited[next]) dfs(adj, next, visited, order);
        }
    }
}`,
      notes: [
        { match: 'adj.get(e[1]).add(e[0]);', text: 'For an undirected graph, store each edge in both directions.' },
        { match: 'visited[start] = true;               // mark when enqueued', text: 'Marking on enqueue prevents the same vertex being added to the queue twice.' },
        { match: 'if (!visited[next]) dfs(adj, next, visited, order);', text: 'DFS dives into the first unvisited neighbour before trying the others.' },
      ],
      output: 'BFS from 0: [0, 1, 2, 3, 4, 5]\nDFS from 0: [0, 1, 3, 5, 4, 2]',
      time: 'O(V + E) for both',
      space: 'O(V + E) for the graph; O(V) for visited and the queue/stack',
    },
    {
      title: 'Dijkstra’s shortest paths',
      description: 'A weighted directed graph. The direct edge 0 → 1 costs 4, but going 0 → 2 → 1 costs only 3, and Dijkstra finds it.',
      code: java`
import java.util.*;

public class Dijkstra {
    public static void main(String[] args) {
        int n = 5;
        List<List<int[]>> adj = new ArrayList<>();      // int[]{neighbor, weight}
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[][] edges = {{0, 1, 4}, {0, 2, 1}, {2, 1, 2}, {1, 3, 1}, {2, 3, 5}, {3, 4, 3}};
        for (int[] e : edges) {                          // directed edges
            adj.get(e[0]).add(new int[]{e[1], e[2]});
        }

        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[0] = 0;
        // Min-heap ordered by distance: {node, distance}
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));
        pq.offer(new int[]{0, 0});

        while (!pq.isEmpty()) {
            int[] top = pq.poll();
            int node = top[0], d = top[1];
            if (d > dist[node]) continue;               // stale entry: skip it
            for (int[] edge : adj.get(node)) {
                int next = edge[0], newDist = d + edge[1];
                if (newDist < dist[next]) {              // found a shorter path
                    dist[next] = newDist;
                    pq.offer(new int[]{next, newDist});
                }
            }
        }
        System.out.println("Shortest distances from 0: " + Arrays.toString(dist));
    }
}`,
      notes: [
        { match: 'Arrays.fill(dist, Integer.MAX_VALUE);', text: 'Every vertex starts “infinitely” far away, except the source.' },
        { match: 'if (d > dist[node]) continue;', text: 'A vertex can be in the heap several times; skip entries that are out of date.' },
        { match: 'if (newDist < dist[next])', text: 'Relaxation: keep the shorter of the known path and the path through `node`.' },
      ],
      output: 'Shortest distances from 0: [0, 3, 1, 4, 7]',
      time: 'O((V + E) log V)',
      space: 'O(V + E)',
    },
  ],

  algorithm: {
    title: 'Breadth-first search from a source vertex',
    steps: [
      'Create a `visited` array and an empty queue.',
      'Mark the source as visited and enqueue it.',
      'While the queue is not empty, dequeue a vertex `u` and process it.',
      'For each neighbour `v` of `u` that is not yet visited, mark it visited and enqueue it.',
      'When the queue empties, every vertex reachable from the source has been visited, in order of distance.',
    ],
    dryRun: {
      title: 'Graph 0–1, 0–2, 1–3, 2–4, 3–5, 4–5 from vertex 0',
      lines: [
        'queue [0] → visit 0, enqueue 1, 2',
        'queue [1, 2] → visit 1, enqueue 3',
        'queue [2, 3] → visit 2, enqueue 4',
        'queue [3, 4] → visit 3, enqueue 5',
        'queue [4, 5] → visit 4 (5 already visited), then 5',
        'Order: 0, 1, 2, 3, 4, 5',
      ],
    },
  },

  complexity: {
    columns: ['Algorithm / operation', 'Time', 'Space'],
    rows: [
      ['BFS / DFS (adjacency list)', 'O(V + E)', 'O(V)'],
      ['BFS / DFS (adjacency matrix)', 'O(V²)', 'O(V)'],
      ['Dijkstra with a binary heap', 'O((V + E) log V)', 'O(V)'],
      ['Topological sort', 'O(V + E)', 'O(V)'],
      ['Check if edge (u, v) exists: list / matrix', 'O(deg u) / O(1)', 'n/a'],
      ['Storage: list / matrix', 'n/a', 'O(V + E) / O(V²)'],
    ],
    note: 'V = number of vertices, E = number of edges. Most real graphs are sparse (E ≪ V²), so adjacency lists win.',
  },

  mistakes: [
    { mistake: 'Not tracking visited vertices.', fix: 'Cycles make BFS/DFS loop forever. Keep a `visited` array or set.' },
    { mistake: 'Marking a vertex visited when it is dequeued instead of enqueued.', fix: 'It can then be enqueued many times. Mark it when you enqueue it.' },
    { mistake: 'Adding only one direction for undirected edges.', fix: 'Add both `u → v` and `v → u`.' },
    { mistake: 'Using BFS for shortest paths in a weighted graph.', fix: 'BFS counts edges, not weights. Use Dijkstra (non-negative weights).' },
    { mistake: 'Only searching from vertex 0 in a disconnected graph.', fix: 'Loop over all vertices and start a new search from each unvisited one.' },
  ],

  takeaways: [
    'Graphs = vertices + edges; they can be directed, weighted and cyclic.',
    'Adjacency lists are the default representation: O(V + E) space.',
    'BFS (queue) finds shortest paths by edge count; DFS (recursion/stack) explores deeply.',
    'Always track visited vertices.',
    'Dijkstra handles non-negative weights in O((V + E) log V).',
  ],

  practice: ['number-of-islands', 'course-schedule', 'word-ladder'],
};
