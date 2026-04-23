'use client';
import { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { RadioButton } from 'primereact/radiobutton';
import { InputSwitch } from 'primereact/inputswitch';
import { AI_KEYS as KEYS, Provider, getAiPreferences, notifyAiPrefsUpdated } from '../../lib/aiPreferences';

type KeyStatus = 'idle' | 'testing' | 'valid' | 'invalid';

const PROVIDERS = [
  {
    id: 'openai' as Provider,
    label: 'OpenAI',
    model: 'gpt-4o-mini',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'platform.openai.com/api-keys',
    color: '#10a37f',
    icon: 'pi pi-bolt',
  },
  {
    id: 'claude' as Provider,
    label: 'Claude',
    model: 'claude-haiku-4-5',
    placeholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    docsLabel: 'console.anthropic.com/settings/keys',
    color: '#d97706',
    icon: 'pi pi-sparkles',
  },
];

interface ProviderState {
  key: string;
  savedKey: string;
  showKey: boolean;
  status: KeyStatus;
}

function mask(k: string) {
  return k.length > 8 ? `${k.slice(0, 6)}${'•'.repeat(18)}${k.slice(-4)}` : k;
}

export default function SettingsPage() {
  const toast = useRef<Toast>(null);
  const [activeProvider, setActiveProvider] = useState<Provider>('openai');
  const [localOnly, setLocalOnly] = useState(false);
  const [state, setState] = useState<Record<Provider, ProviderState>>({
    openai: { key: '', savedKey: '', showKey: false, status: 'idle' },
    claude: { key: '', savedKey: '', showKey: false, status: 'idle' },
  });

  useEffect(() => {
    const prefs = getAiPreferences();
    setActiveProvider(prefs.activeProvider ?? 'openai');
    setLocalOnly(prefs.localOnly);

    setState((prev) => {
      const next = { ...prev };
      for (const p of ['openai', 'claude'] as Provider[]) {
        const stored = localStorage.getItem(KEYS[p]) ?? '';
        next[p] = { ...next[p], key: stored, savedKey: stored, status: stored ? 'valid' : 'idle' };
      }
      return next;
    });
  }, []);

  const update = (provider: Provider, patch: Partial<ProviderState>) =>
    setState((prev) => ({ ...prev, [provider]: { ...prev[provider], ...patch } }));

  const handleSave = (provider: Provider) => {
    const trimmed = state[provider].key.trim();
    const prefix = provider === 'openai' ? 'sk-' : 'sk-ant-';
    if (!trimmed.startsWith('sk-')) {
      toast.current?.show({ severity: 'warn', summary: 'Formato inválido', detail: `La API key de ${provider === 'openai' ? 'OpenAI' : 'Claude'} debe comenzar con "${prefix}"`, life: 4000 });
      return;
    }
    localStorage.setItem(KEYS[provider], trimmed);
    notifyAiPrefsUpdated();
    update(provider, { savedKey: trimmed, status: 'valid' });
    toast.current?.show({ severity: 'success', summary: 'Guardado', detail: 'API key guardada correctamente', life: 3000 });
  };

  const handleTest = async (provider: Provider) => {
    const trimmed = state[provider].key.trim();
    if (!trimmed) return;
    update(provider, { status: 'testing' });
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: trimmed }),
      });
      const { valid } = await res.json();
      update(provider, { status: valid ? 'valid' : 'invalid' });
      toast.current?.show({
        severity: valid ? 'success' : 'error',
        summary: valid ? 'Conexión exitosa' : 'API key inválida',
        detail: valid ? `Conectado a ${provider === 'openai' ? 'OpenAI' : 'Anthropic'}` : 'No se pudo autenticar',
        life: 4000,
      });
    } catch {
      update(provider, { status: 'invalid' });
      toast.current?.show({ severity: 'error', summary: 'Error de red', detail: 'No se pudo conectar', life: 4000 });
    }
  };

  const handleClear = (provider: Provider) => {
    localStorage.removeItem(KEYS[provider]);
    notifyAiPrefsUpdated();
    update(provider, { key: '', savedKey: '', status: 'idle' });
    if (activeProvider === provider) {
      const other = provider === 'openai' ? 'claude' : 'openai';
      if (state[other].savedKey) {
        setActiveProvider(other);
        localStorage.setItem(KEYS.active, other);
        notifyAiPrefsUpdated();
      }
    }
    toast.current?.show({ severity: 'info', summary: 'API key eliminada', detail: 'Clave removida correctamente', life: 3000 });
  };

  const handleSetActive = (provider: Provider) => {
    if (!state[provider].savedKey) {
      toast.current?.show({ severity: 'warn', summary: 'Sin key guardada', detail: `Guarda primero la key de ${provider === 'openai' ? 'OpenAI' : 'Claude'}`, life: 4000 });
      return;
    }
    setActiveProvider(provider);
    localStorage.setItem(KEYS.active, provider);
    notifyAiPrefsUpdated();
    toast.current?.show({ severity: 'success', summary: 'Provider actualizado', detail: `Usando ${provider === 'openai' ? 'OpenAI' : 'Claude'} para el resumen`, life: 3000 });
  };

  const handleLocalOnlyToggle = (enabled: boolean) => {
    setLocalOnly(enabled);
    localStorage.setItem(KEYS.localOnly, enabled ? 'true' : 'false');
    notifyAiPrefsUpdated();
    toast.current?.show({
      severity: enabled ? 'info' : 'success',
      summary: enabled ? 'Modo local activado' : 'Agentes activados',
      detail: enabled
        ? 'El Dashboard responderá con análisis local.'
        : 'El Dashboard volverá a usar el proveedor activo cuando tenga key.',
      life: 3500,
    });
  };

  const statusTag = (status: KeyStatus) => {
    if (status === 'valid') return <Tag severity="success" value="Válida" icon="pi pi-check" />;
    if (status === 'invalid') return <Tag severity="danger" value="Inválida" icon="pi pi-times" />;
    if (status === 'testing') return <Tag severity="warning" value="Verificando..." />;
    return <Tag severity="secondary" value="Sin configurar" />;
  };

  return (
    <div className="grid">
      <Toast ref={toast} />

      <div className="col-12">
        <div className="flex align-items-center gap-2 mb-1">
          <i className="pi pi-sparkles text-purple-500 text-xl" />
          <h4 className="m-0 text-900 font-semibold">Resumen inteligente — Configuración</h4>
        </div>
        <p className="text-500 text-sm mt-1 mb-4">
          Configura uno o ambos proveedores de IA y elige cuál usar para el resumen del Dashboard.
          Sin key activa, el sistema usa análisis local como fallback.
        </p>
      </div>

      {/* Provider activo */}
      <div className="col-12 mb-2">
        <div className="card mb-0">
          <div className="flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
            <span className="font-medium text-900">Provider activo para el resumen</span>
            <div className="flex align-items-center gap-2">
              <span className="text-700 text-sm">Desactivar agentes (modo local)</span>
              <InputSwitch checked={localOnly} onChange={(e) => handleLocalOnlyToggle(!!e.value)} />
              {localOnly && <Tag severity="contrast" value="Local" />}
            </div>
          </div>
          <div className="flex gap-4">
            {PROVIDERS.map((p) => (
              <div key={p.id} className="flex align-items-center gap-2">
                <RadioButton
                  inputId={`active-${p.id}`}
                  value={p.id}
                  checked={activeProvider === p.id}
                  onChange={() => handleSetActive(p.id)}
                  disabled={!state[p.id].savedKey}
                />
                <label htmlFor={`active-${p.id}`} className={`font-medium ${!state[p.id].savedKey ? 'text-400' : 'text-900'} cursor-pointer`}>
                  {p.label}
                  {activeProvider === p.id && state[p.id].savedKey && (
                    <Tag className="ml-2" severity="success" value="Activo" />
                  )}
                  {!state[p.id].savedKey && (
                    <span className="ml-2 text-400 text-sm">(sin key)</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tarjetas por provider */}
      {PROVIDERS.map((p) => {
        const s = state[p.id];
        const isActive = activeProvider === p.id && !!s.savedKey;
        return (
          <div key={p.id} className="col-12 lg:col-6">
            <div className={`card h-full ${isActive ? 'border-2 border-primary' : ''}`} style={isActive ? { borderColor: p.color } : {}}>
              {/* Header */}
              <div className="flex align-items-center justify-content-between mb-4">
                <div className="flex align-items-center gap-2">
                  <i className={`${p.icon} text-xl`} style={{ color: p.color }} />
                  <span className="font-bold text-900 text-lg">{p.label}</span>
                  <span className="text-400 text-sm">— {p.model}</span>
                </div>
                <div className="flex align-items-center gap-2">
                  {statusTag(s.status)}
                  {s.savedKey && (
                    <Button icon="pi pi-trash" rounded text severity="danger" size="small" onClick={() => handleClear(p.id)} tooltip="Eliminar key" />
                  )}
                </div>
              </div>

              {/* Key guardada */}
              {s.savedKey && (
                <div className="surface-50 border-round p-3 mb-4 font-mono text-sm text-700">
                  {mask(s.savedKey)}
                </div>
              )}

              {/* Input */}
              <div className="field mb-4">
                <label className="font-medium mb-2 block">API Key</label>
                <div className="p-inputgroup">
                  <InputText
                    value={s.showKey ? s.key : (s.key && s.key !== s.savedKey ? s.key : mask(s.key))}
                    onChange={(e) => update(p.id, { key: e.target.value })}
                    onFocus={() => update(p.id, { showKey: true, key: s.savedKey })}
                    onBlur={() => update(p.id, { showKey: false })}
                    placeholder={p.placeholder}
                    className="font-mono"
                  />
                  <Button
                    icon={s.showKey ? 'pi pi-eye-slash' : 'pi pi-eye'}
                    className="p-button-secondary"
                    onClick={() => update(p.id, { showKey: !s.showKey })}
                    type="button"
                  />
                </div>
                <small className="text-400 mt-1 block">
                  Obtén tu key en{' '}
                  <a href={p.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                    {p.docsLabel}
                  </a>
                </small>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <Button
                  label="Guardar"
                  icon="pi pi-save"
                  onClick={() => handleSave(p.id)}
                  disabled={!s.key.trim() || s.key.trim() === s.savedKey}
                />
                <Button
                  label="Verificar"
                  icon="pi pi-wifi"
                  severity="secondary"
                  outlined
                  loading={s.status === 'testing'}
                  onClick={() => handleTest(p.id)}
                  disabled={!s.key.trim()}
                />
                {s.savedKey && activeProvider !== p.id && (
                  <Button
                    label="Usar este"
                    icon="pi pi-check"
                    severity="success"
                    outlined
                    onClick={() => handleSetActive(p.id)}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Info */}
      <div className="col-12 lg:col-8">
        <div className="card">
          <h5 className="mb-3">¿Cómo funciona?</h5>
          <ul className="m-0 pl-3 line-height-3 text-700">
            <li className="mb-2">Puedes guardar keys de <strong>ambos proveedores</strong> y cambiar entre ellos sin perder la configuración.</li>
            <li className="mb-2">El provider marcado como <strong>Activo</strong> es el que usa el botón "Generar con IA" del Dashboard.</li>
            <li className="mb-2">Si activas <strong>modo local</strong>, el Dashboard ignora temporalmente OpenAI/Claude y responde con análisis local.</li>
            <li className="mb-2">Las keys se envían como headers a una API route de Next.js (<code className="surface-100 border-round px-1">/api/ai-summary</code>) que actúa como proxy — <strong>nunca quedan expuestas en el bundle del cliente</strong>.</li>
            <li className="mb-2">Sin ningún provider configurado, el Dashboard genera un análisis local con la misma estructura.</li>
            <li>Modelos usados: <strong>gpt-4o-mini</strong> (OpenAI) · <strong>claude-haiku-4-5</strong> (Anthropic) — rápidos y económicos para esta tarea.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
