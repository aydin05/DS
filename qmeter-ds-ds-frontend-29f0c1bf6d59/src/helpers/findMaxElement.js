/*find max element from the given array*/
const findMaxElement = (array) => {
  if (array.length === 0) return 0;
  let maxElement = array[0].index;
  for (const { index } of array) {
    if (maxElement < index) {
      maxElement = index;
    }
  }
  return maxElement;
};

export default findMaxElement;
