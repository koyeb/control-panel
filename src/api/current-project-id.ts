import { StoredValue } from 'src/application/storage';

// Globally stored id of the project the user is currently working in. Kept in a
// dedicated module (free of API dependencies) so it can be read both from React
// hooks and from the low-level `api` function without creating an import cycle.
export const storedCurrentProjectId = new StoredValue<string>('currentProjectId', {
  parse: String,
  stringify: String,
});

export const getCurrentProjectId = storedCurrentProjectId.read;
export const setCurrentProjectId = storedCurrentProjectId.write;
