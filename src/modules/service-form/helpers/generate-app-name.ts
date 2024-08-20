import { adjectives, animals, names, uniqueNamesGenerator } from 'unique-names-generator';

export function generateAppName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, [...names, ...animals]],
    separator: '-',
    style: 'lowerCase',
  });
}
