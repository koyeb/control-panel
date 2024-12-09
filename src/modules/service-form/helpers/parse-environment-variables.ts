import { EnvironmentVariable } from 'src/api/model';
import { dotenvParse } from 'src/utils/dotenv';

export class SecretNotFoundError extends Error {
  constructor(public readonly name: string) {
    super();
  }
}

export function parseEnvironmentVariables(
  input: string,
  secrets?: Array<{ name: string }>,
): EnvironmentVariable[] {
  const values = dotenvParse(input);
  const variables = new Map<string, EnvironmentVariable>();

  for (const [name, value] of Object.entries(values)) {
    variables.set(name, getEnvironmentVariable(name, value, secrets));
  }

  return Array.from(variables.values());
}

function getEnvironmentVariable(
  name: string,
  value: string,
  secrets?: Array<{ name: string }>,
): EnvironmentVariable {
  if (value.charAt(0) === '@') {
    value = value.slice(1);

    if (!secrets?.some(({ name }) => value === name)) {
      throw new SecretNotFoundError(value);
    }

    return {
      name,
      value: `{{ secret.${value} }}`,
      regions: [],
    };
  } else {
    return {
      name,
      value,
      regions: [],
    };
  }
}

export function stringifyEnvironmentVariables(variables: EnvironmentVariable[]): string {
  let result = variables
    .filter((variable) => variable.name !== '')
    .map(stringifyVariable)
    .join('\n');

  if (result.length > 0) {
    result += '\n';
  }

  return result;
}

function stringifyVariable({ name, value }: EnvironmentVariable): string {
  return `${name}=${stringifyValue(value)}`;
}

function stringifyValue(value: string): string {
  if (value.includes('\n')) {
    if (value.includes('"')) {
      if (value.includes("'")) {
        return `\`${value}\``;
      } else {
        return `'${value}'`;
      }
    } else {
      return `"${value}"`;
    }
  } else {
    return value;
  }
}
