/**
 * Step generators for the algorithm visualizer.
 *
 * Each function runs the real algorithm on a copy of the input and records a
 * "frame" after every meaningful step. A frame is a snapshot:
 *   {
 *     array:    number[] (null = empty slot),
 *     states:   { [index]: 'compare' | 'swap' | 'sorted' | 'partial' | 'found' |
 *                          'eliminated' | 'min' | 'key' | 'active' | 'removed' | 'empty' },
 *     pointers: { [index]: string[] },   labels like 'low', 'mid', 'i'
 *     message:  string,                  plain-English explanation of this step
 *     tone:     'info' | 'success' | 'error',
 *     stats:    { comparisons, swaps?, shifts? },
 *   }
 * The player just steps through the frames, so the UI never re-implements the logic.
 */

function makeRecorder() {
  const frames = [];
  const record = (array, { states = {}, pointers = {}, message, tone = 'info', stats = {} }) => {
    frames.push({ array: [...array], states: { ...states }, pointers, message, tone, stats: { ...stats } });
  };
  return { frames, record };
}

/** Mark every index in [from, to] with a state, unless it already has one. */
function fill(states, from, to, state) {
  for (let i = from; i <= to; i++) if (!states[i]) states[i] = state;
  return states;
}

/** Merge pointer labels when several land on the same index (e.g. low = mid). */
function pointersOf(entries) {
  const result = {};
  entries.forEach(([index, label]) => {
    if (index == null || index < 0) return;
    (result[index] ??= []).push(label);
  });
  return result;
}

/* ---------------------------------------------------------------- Searching */

export function linearSearch(input, target) {
  const arr = [...input];
  const { frames, record } = makeRecorder();
  const stats = { comparisons: 0 };

  record(arr, { message: `Search for ${target}: check each element from left to right.`, stats });

  for (let i = 0; i < arr.length; i++) {
    stats.comparisons++;
    const states = fill({ [i]: 'compare' }, 0, i - 1, 'eliminated');
    if (arr[i] === target) {
      record(arr, {
        states: { ...states, [i]: 'found' },
        pointers: pointersOf([[i, 'i']]),
        message: `arr[${i}] = ${arr[i]} matches the target. Found at index ${i} after ${stats.comparisons} comparison${stats.comparisons > 1 ? 's' : ''}.`,
        tone: 'success',
        stats,
      });
      return frames;
    }
    record(arr, {
      states,
      pointers: pointersOf([[i, 'i']]),
      message: `Compare arr[${i}] = ${arr[i]} with ${target}: not a match, move to the next element.`,
      stats,
    });
  }

  record(arr, {
    states: fill({}, 0, arr.length - 1, 'eliminated'),
    message: `Checked all ${arr.length} elements: ${target} is not in the array (worst case, O(n)).`,
    tone: 'error',
    stats,
  });
  return frames;
}

export function binarySearch(input, target) {
  const arr = [...input];
  const { frames, record } = makeRecorder();
  const stats = { comparisons: 0 };
  let low = 0;
  let high = arr.length - 1;

  const outside = (lo, hi) => {
    const s = {};
    for (let i = 0; i < arr.length; i++) if (i < lo || i > hi) s[i] = 'eliminated';
    return s;
  };

  record(arr, {
    pointers: pointersOf([[low, 'low'], [high, 'high']]),
    message: `The array is sorted. Search for ${target} between low = 0 and high = ${high}.`,
    stats,
  });

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    stats.comparisons++;
    const pointers = pointersOf([[low, 'low'], [mid, 'mid'], [high, 'high']]);

    if (arr[mid] === target) {
      record(arr, {
        states: { ...outside(low, high), [mid]: 'found' },
        pointers,
        message: `mid = ${mid}, arr[mid] = ${arr[mid]} equals the target. Found in ${stats.comparisons} comparison${stats.comparisons > 1 ? 's' : ''}.`,
        tone: 'success',
        stats,
      });
      return frames;
    }

    record(arr, {
      states: { ...outside(low, high), [mid]: 'compare' },
      pointers,
      message: `mid = ${low} + (${high} − ${low}) / 2 = ${mid}. Compare arr[mid] = ${arr[mid]} with ${target}.`,
      stats,
    });

    if (arr[mid] < target) {
      low = mid + 1;
      record(arr, {
        states: outside(low, high),
        pointers: pointersOf([[low, 'low'], [high, 'high']]),
        message: `${arr[mid]} < ${target}, so the target can only be on the right. Discard the left half: low = ${low}.`,
        stats,
      });
    } else {
      high = mid - 1;
      record(arr, {
        states: outside(low, high),
        pointers: pointersOf([[low, 'low'], [high, 'high']]),
        message: `${arr[mid]} > ${target}, so the target can only be on the left. Discard the right half: high = ${high}.`,
        stats,
      });
    }
  }

  record(arr, {
    states: fill({}, 0, arr.length - 1, 'eliminated'),
    message: `low (${low}) > high (${high}): the range is empty, so ${target} is not in the array. Only ${stats.comparisons} comparisons were needed.`,
    tone: 'error',
    stats,
  });
  return frames;
}

/* ------------------------------------------------------------------ Sorting */

export function bubbleSort(input) {
  const arr = [...input];
  const n = arr.length;
  const { frames, record } = makeRecorder();
  const stats = { comparisons: 0, swaps: 0 };
  const sorted = {};

  record(arr, { message: 'Bubble sort compares neighbours and swaps them when they are out of order.', stats });

  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - pass; j++) {
      stats.comparisons++;
      const a = arr[j];
      const b = arr[j + 1];
      const pointers = pointersOf([[j, 'j'], [j + 1, 'j+1']]);
      record(arr, {
        states: { ...sorted, [j]: 'compare', [j + 1]: 'compare' },
        pointers,
        message: `Pass ${pass + 1}: compare ${a} and ${b}. ${a > b ? 'Out of order, so swap.' : 'Already in order.'}`,
        stats,
      });
      if (a > b) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        stats.swaps++;
        swapped = true;
        record(arr, {
          states: { ...sorted, [j]: 'swap', [j + 1]: 'swap' },
          pointers,
          message: `Swapped: ${b} moves left, ${a} moves right.`,
          stats,
        });
      }
    }
    sorted[n - 1 - pass] = 'sorted';

    if (!swapped) {
      fill(sorted, 0, n - 1, 'sorted');
      record(arr, {
        states: sorted,
        message: `No swaps in pass ${pass + 1}, so the array is already sorted. Bubble sort stops early.`,
        tone: 'success',
        stats,
      });
      return frames;
    }
    record(arr, {
      states: sorted,
      message: `End of pass ${pass + 1}: ${arr[n - 1 - pass]} has bubbled into its final position.`,
      stats,
    });
  }

  fill(sorted, 0, n - 1, 'sorted');
  record(arr, { states: sorted, message: `Sorted with ${stats.comparisons} comparisons and ${stats.swaps} swaps.`, tone: 'success', stats });
  return frames;
}

export function selectionSort(input) {
  const arr = [...input];
  const n = arr.length;
  const { frames, record } = makeRecorder();
  const stats = { comparisons: 0, swaps: 0 };
  const sorted = {};

  record(arr, { message: 'Selection sort finds the smallest unsorted value and swaps it into place.', stats });

  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    record(arr, {
      states: { ...sorted, [i]: 'min' },
      pointers: pointersOf([[i, 'i'], [i, 'min']]),
      message: `Pass ${i + 1}: assume arr[${i}] = ${arr[i]} is the minimum of positions ${i}–${n - 1}.`,
      stats,
    });

    for (let j = i + 1; j < n; j++) {
      stats.comparisons++;
      const smaller = arr[j] < arr[minIndex];
      record(arr, {
        states: { ...sorted, [minIndex]: 'min', [j]: 'compare' },
        pointers: pointersOf([[i, 'i'], [minIndex, 'min'], [j, 'j']]),
        message: `Compare ${arr[j]} with the current minimum ${arr[minIndex]}${smaller ? `: ${arr[j]} is smaller.` : '.'}`,
        stats,
      });
      if (smaller) {
        minIndex = j;
        record(arr, {
          states: { ...sorted, [minIndex]: 'min' },
          pointers: pointersOf([[i, 'i'], [minIndex, 'min']]),
          message: `New minimum: ${arr[minIndex]} at index ${minIndex}.`,
          stats,
        });
      }
    }

    if (minIndex !== i) {
      const minValue = arr[minIndex];
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
      stats.swaps++;
      record(arr, {
        states: { ...sorted, [i]: 'swap', [minIndex]: 'swap' },
        pointers: pointersOf([[i, 'i'], [minIndex, 'min']]),
        message: `Swap the minimum ${minValue} into position ${i}.`,
        stats,
      });
    } else {
      record(arr, {
        states: { ...sorted, [i]: 'min' },
        pointers: pointersOf([[i, 'i']]),
        message: `${arr[i]} is already the minimum, so no swap is needed.`,
        stats,
      });
    }
    sorted[i] = 'sorted';
  }

  fill(sorted, 0, n - 1, 'sorted');
  record(arr, { states: sorted, message: `Sorted with ${stats.comparisons} comparisons and only ${stats.swaps} swaps.`, tone: 'success', stats });
  return frames;
}

export function insertionSort(input) {
  const arr = [...input];
  const n = arr.length;
  const { frames, record } = makeRecorder();
  const stats = { comparisons: 0, shifts: 0 };

  record(arr, {
    states: { 0: 'partial' },
    message: 'Insertion sort grows a sorted section on the left. The first element is a sorted section of length 1.',
    stats,
  });

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    record(arr, {
      states: fill({ [i]: 'key' }, 0, i - 1, 'partial'),
      pointers: pointersOf([[i, 'key']]),
      message: `Pick key = ${key} and insert it into the sorted section on its left.`,
      stats,
    });

    // The key moves left one slot per shift (shown as adjacent swaps)
    while (j >= 0) {
      stats.comparisons++;
      if (arr[j] > key) {
        record(arr, {
          states: fill({ [j]: 'compare', [j + 1]: 'key' }, 0, i, 'partial'),
          pointers: pointersOf([[j + 1, 'key'], [j, 'j']]),
          message: `${arr[j]} > ${key}: shift ${arr[j]} one place to the right.`,
          stats,
        });
        arr[j + 1] = arr[j];
        arr[j] = key;
        stats.shifts++;
        j--;
      } else {
        record(arr, {
          states: fill({ [j]: 'compare', [j + 1]: 'key' }, 0, i, 'partial'),
          pointers: pointersOf([[j + 1, 'key'], [j, 'j']]),
          message: `${arr[j]} ≤ ${key}: the key belongs right here, at index ${j + 1}.`,
          stats,
        });
        break;
      }
    }

    record(arr, {
      states: fill({ [j + 1]: 'found' }, 0, i, 'partial'),
      message: `Inserted ${key} at index ${j + 1}. Indices 0–${i} are now sorted.`,
      stats,
    });
  }

  record(arr, {
    states: fill({}, 0, n - 1, 'sorted'),
    message: `Sorted with ${stats.comparisons} comparisons and ${stats.shifts} shifts.`,
    tone: 'success',
    stats,
  });
  return frames;
}

/* ----------------------------------------------------------- Input helpers */

export function randomArray(length, min = 5, max = 99) {
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

export function randomUniqueArray(length, min = 1, max = 99) {
  const values = new Set();
  while (values.size < length) values.add(Math.floor(Math.random() * (max - min + 1)) + min);
  return [...values];
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
