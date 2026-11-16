/**
 * Frame generators for the array operations demo (access, update, insert,
 * delete, search). Same frame format as algorithms.js. Each returns
 * { frames, result }, where result is the array after the operation.
 */
import { linearSearch } from './algorithms.js';

export const CAPACITY = 10;

function frame(array, extra) {
  return { array: [...array], states: {}, pointers: {}, tone: 'info', stats: {}, ...extra };
}

function error(array, message) {
  return { frames: [frame(array, { message, tone: 'error' })], result: array };
}

export function access(arr, index) {
  if (!(index >= 0 && index < arr.length)) return error(arr, `Index ${index} is out of bounds. Valid indices are 0 to ${arr.length - 1}.`);
  return {
    frames: [
      frame(arr, {
        states: { [index]: 'found' },
        pointers: { [index]: ['i'] },
        message: `arr[${index}] = ${arr[index]}. The address is base + ${index} × 4 bytes, so the value is read in one step: O(1).`,
        tone: 'success',
      }),
    ],
    result: arr,
  };
}

export function update(arr, index, value) {
  if (!(index >= 0 && index < arr.length)) return error(arr, `Index ${index} is out of bounds. Valid indices are 0 to ${arr.length - 1}.`);
  const next = [...arr];
  next[index] = value;
  return {
    frames: [
      frame(arr, {
        states: { [index]: 'active' },
        pointers: { [index]: ['i'] },
        message: `Jump straight to index ${index} (O(1)).`,
      }),
      frame(next, {
        states: { [index]: 'found' },
        pointers: { [index]: ['i'] },
        message: `arr[${index}] changed from ${arr[index]} to ${value}. No other element moved.`,
        tone: 'success',
      }),
    ],
    result: next,
  };
}

export function insert(arr, index, value) {
  if (arr.length >= CAPACITY) return error(arr, `The array is full (capacity ${CAPACITY}). Delete an element first. A dynamic array would allocate a bigger one and copy.`);
  if (!(index >= 0 && index <= arr.length)) return error(arr, `Insert index must be between 0 and ${arr.length}.`);

  const work = [...arr, null];
  const shiftsNeeded = arr.length - index;
  const frames = [
    frame(work, {
      states: { [arr.length]: 'empty' },
      pointers: { [index]: ['i'] },
      message:
        shiftsNeeded === 0
          ? `Insert ${value} at the end (index ${index}): no elements need to move.`
          : `Insert ${value} at index ${index}: first shift ${shiftsNeeded} element${shiftsNeeded > 1 ? 's' : ''} one place right, starting from the end.`,
    }),
  ];

  for (let k = arr.length; k > index; k--) {
    work[k] = work[k - 1];
    work[k - 1] = null;
    frames.push(
      frame(work, {
        states: { [k]: 'swap', [k - 1]: 'empty' },
        pointers: { [index]: ['i'] },
        message: `Shift ${work[k]} from index ${k - 1} to ${k}.`,
      })
    );
  }

  work[index] = value;
  frames.push(
    frame(work, {
      states: { [index]: 'found' },
      pointers: { [index]: ['i'] },
      message: `Place ${value} at index ${index}. ${shiftsNeeded} shift${shiftsNeeded === 1 ? '' : 's'}: inserting is O(n) in the worst case (at index 0).`,
      tone: 'success',
    })
  );
  return { frames, result: work };
}

export function remove(arr, index) {
  if (!arr.length) return error(arr, 'The array is empty. There is nothing to delete.');
  if (!(index >= 0 && index < arr.length)) return error(arr, `Index ${index} is out of bounds. Valid indices are 0 to ${arr.length - 1}.`);

  const work = [...arr];
  const removed = work[index];
  const frames = [
    frame(work, {
      states: { [index]: 'removed' },
      pointers: { [index]: ['i'] },
      message: `Delete arr[${index}] = ${removed}. Every element after it must move one place left to close the gap.`,
    }),
  ];
  work[index] = null;

  for (let k = index + 1; k < arr.length; k++) {
    work[k - 1] = work[k];
    work[k] = null;
    frames.push(
      frame(work, {
        states: { [k - 1]: 'swap', [k]: 'empty' },
        message: `Shift ${work[k - 1]} from index ${k} to ${k - 1}.`,
      })
    );
  }

  const result = work.slice(0, arr.length - 1);
  const shifts = arr.length - 1 - index;
  frames.push(
    frame(result, {
      message: `Removed ${removed}. ${shifts} shift${shifts === 1 ? '' : 's'}; the size is now ${result.length}.`,
      tone: 'success',
    })
  );
  return { frames, result };
}

export function search(arr, value) {
  return { frames: linearSearch(arr, value), result: arr };
}
