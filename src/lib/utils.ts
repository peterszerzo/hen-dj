export const fillInBetween = (from: number, to: number, diff: number) => {
  let numbers = [];
  let current = to - diff;
  while (current > from) {
    numbers = [current, ...numbers];
    current = current - diff;
  }
  return numbers;
};

export const fillInThroughout = (values: Array<number>, diff: number) => {
  let newValues = [];
  values.forEach((value, index) => {
    if (index === values.length - 1) {
      newValues = [...newValues, value];
      return;
    }
    const nextValue = values[index + 1];
    if (nextValue > value + diff * 1.25) {
      newValues = [
        ...newValues,
        value,
        ...fillInBetween(value, nextValue, diff),
      ];
    }
  });
  return newValues;
};
