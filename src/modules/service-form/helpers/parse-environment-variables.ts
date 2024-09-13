import { EnvironmentVariable } from 'src/api/model';

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

const LINE =
  /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

// copied from the dotenv package
function dotenvParse(lines: string) {
  const obj: Record<string, string> = {};
  let match: RegExpExecArray | null;

  lines = lines.replace(/\r\n?/gm, '\n');

  while ((match = LINE.exec(lines)) != null) {
    const key = match[1] ?? '';
    let value = match[2] ?? '';

    value = value.trim();

    const maybeQuote = value[0];

    value = value.replace(/^(['"`])([\s\S]*)\1$/gm, '$2');

    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n');
      value = value.replace(/\\r/g, '\r');
    }

    obj[key] = value;
  }

  return obj;
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
      value: `{{ secrets.${value} }}`,
    };
  } else {
    return {
      name,
      value,
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
