import { AppConfig } from 'src/application/config';
import { container } from 'src/application/container';
import { TOKENS } from 'src/tokens';

export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return container.resolve(TOKENS.config).get(key);
}
