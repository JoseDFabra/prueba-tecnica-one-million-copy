export type Provider = 'openai' | 'claude';

export const AI_PREFS_EVENT = 'omc:ai-preferences-updated';

export const AI_KEYS = {
  openai: 'omc_openai_key',
  claude: 'omc_claude_key',
  active: 'omc_ai_provider',
  localOnly: 'omc_ai_local_only',
} as const;

export function notifyAiPrefsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AI_PREFS_EVENT));
  }
}

export function getAiPreferences() {
  if (typeof window === 'undefined') {
    return {
      localOnly: false,
      activeProvider: null as Provider | null,
      key: '',
      connectedProviders: [] as Provider[],
    };
  }

  const localOnly = localStorage.getItem(AI_KEYS.localOnly) === 'true';
  const openaiKey = localStorage.getItem(AI_KEYS.openai) ?? '';
  const claudeKey = localStorage.getItem(AI_KEYS.claude) ?? '';
  const activeRaw = localStorage.getItem(AI_KEYS.active) as Provider | null;

  const connectedProviders: Provider[] = [];
  if (openaiKey) connectedProviders.push('openai');
  if (claudeKey) connectedProviders.push('claude');

  const activeProvider = activeRaw && connectedProviders.includes(activeRaw) ? activeRaw : connectedProviders[0] ?? null;
  const key = activeProvider ? localStorage.getItem(AI_KEYS[activeProvider]) ?? '' : '';

  return { localOnly, activeProvider, key, connectedProviders };
}
