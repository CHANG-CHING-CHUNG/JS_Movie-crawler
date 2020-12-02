function mergeSort(arr) {
  const halfLength = Math.floor(arr.length / 2);
  if (arr.length === 1) {
    return arr;
  }
  const leftArr = arr.slice(0, halfLength);
  const rightArr = arr.slice(halfLength);

  return merge(sort(leftArr), sort(rightArr));
}

function merge(left, right) {
  const result = [];
  while (left.length != 0 && right.length != 0) {
    if (left[0] > right[0]) {
      result.push(right.shift());
    } else {
      result.push(left.shift());
    }
  }
  return result.concat(left.concat(right));
}

module.exports = mergeSort;
