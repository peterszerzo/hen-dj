import { findLastIndex, slice } from "ramda";

const subjects = ["h", "m", "l", "v"];

const verbs = ["d", "i", "f", "p", "s", ",", ".", "/"];

const subjectFreeVerbs = ["p", ",", ".", "/"];

const modifiers = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];

export const validSequence = (
  keys: Array<string>
): null | {
  subject?: string;
  verb: string;
  modifier?: string;
  numberModifier?: number;
} => {
  const lastVerbIndex = findLastIndex((key) => verbs.includes(key), keys);
  const verb = keys[lastVerbIndex];
  if (subjectFreeVerbs.includes(verb)) {
    return {
      verb,
    };
  }
  const lastSequence = slice(lastVerbIndex, Infinity, keys);
  const subject = lastSequence.find((key) => subjects.includes(key));
  const modifier = lastSequence.find((key) => modifiers.includes(key));
  const modifierToNumber = Number(modifier);
  if (subject) {
    return {
      verb,
      subject,
      modifier,
      numberModifier: isNaN(modifierToNumber) ? 0 : modifierToNumber,
    };
  }
  return null;
};
