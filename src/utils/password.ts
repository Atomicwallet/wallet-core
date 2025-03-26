interface Rule {
  regex: RegExp;
  message: string;
}

interface Option {
  id: number;
  value: string;
  minDiversity: number;
  minLength: number;
}

interface Result {
  contains: string[];
  length: number;
  value: string;
}

const opts: Option[] = [
  {
    id: 0,
    value: 'Weak',
    minDiversity: 1,
    minLength: 0,
  },
  {
    id: 1,
    value: 'Medium',
    minDiversity: 3,
    minLength: 8,
  },
  {
    id: 2,
    value: 'Strong',
    minDiversity: 4,
    minLength: 10,
  },
];

const rules: Rule[] = [
  {
    regex: /[a-z]/,
    message: 'lowercase',
  },
  {
    regex: /[A-Z]/,
    message: 'uppercase',
  },
  {
    regex: /\d/,
    message: 'number',
  },
  {
    regex: /[`!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~ ]/,
    message: 'symbol',
  },
];

export default (pw: string): Result => {
  const str: Result = {
    contains: rules.filter(({ regex }) => regex.test(pw)).map(({ message }) => message),
    length: pw.length,
    value: '',
  };

  const fulfilledOpts = opts
    .filter(({ minDiversity }) => str.contains.length >= minDiversity)
    .filter(({ minLength }) => str.length >= minLength)
    .sort((o1, o2) => o2.id - o1.id)
    .map(({ id, value }) => ({ id, value }));

  str.value = fulfilledOpts[0]!.value;

  return str;
};
