'use client';
import { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';

const STORAGE_KEY = 'omc_openai_key';

type Status = 'idle' | 'testing' | 'valid' | 'invalid';

export default function SettingsPage() {
  const toast = useRef<Toast>(null);
  const [key, setKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? '';
    setSavedKey(stored);
    setKey(stored);
    if (stored) setStatus('valid');
  }, []);

  const maskedKey = (k: string) =>
    k.length > 8 ? `${k.slice(0, 4)}${'•'.repeat(20)}${k.slice(-4)}` : k;

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk-')) {
      toast.current?.show({ severity: 'warn', summary: 'Formato inválido', detail: 'La API key debe comenzar con "sk-"', life: 4000 });
      return;
    }
    localStorage.setItem(STORAGE_KEY, trimmed);
    setSavedKey(trimmed);
    setStatus('valid');
    toast.current?.show({ severity: 'success', summary: 'Guardado', detail: 'API key guardada correctamente', life: 3000 });
  };

  const handleTest = async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setStatus('testing');
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${trimmed}` },
      });
      setStatus(res.ok ? 'valid' : 'invalid');
      if (res.ok) {
        toast.current?.show({ severity: 'success', summary: 'Conexión exitosa', detail: 'La API key es válida', life: 3000 });
      } else {
        toast.current?.show({ severity: 'error', summary: 'API key inválida', detail: 'No se pudo autenticar con OpenAI', life: 4000 });
      }
    } catch {
      setStatus('invalid');
      toast.current?.show({ severity: 'error', summary: 'Error de red', detail: 'No se pudo conectar con OpenAI', life: 4000 });
    }
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedKey('');
    setKey('');
    setStatus('idle');
    toast.current?.show({ severity: 'info', summary: 'API key eliminada', detail: 'El resumen usará modo local', life: 3000 });
  };

  const statusTag = () => {
    if (status === 'valid') return <Tag severity="success" value="Conectado" icon="pi pi-check" />;
    if (status === 'invalid') return <Tag severity="danger" value="Inválida" icon="pi pi-times" />;
    if (status === 'testing') return <Tag severity="warning" value="Verificando..." icon="pi pi-spin pi-spinner" />;
    return <Tag severity="secondary" value="Sin configurar" />;
  };

  return (
    <div className="grid">
      <Toast ref={toast} />

      <div className="col-12 lg:col-8 xl:col-6">
        <div className="card">
          <div className="flex align-items-center gap-2 mb-1">
            <i className="pi pi-sparkles text-purple-500 text-xl" />
            <h4 className="m-0 text-900 font-semibold">Resumen inteligente — Configuración</h4>
          </div>
          <p className="text-500 text-sm mt-1 mb-5">
            Conecta tu cuenta de OpenAI para generar resúmenes ejecutivos reales usando IA.
            Sin API key, el sistema usa lógica local como fallback.
          </p>

          {/* Estado actual */}
          <div className="surface-50 border-round p-4 mb-5 flex align-items-center justify-content-between">
            <div>
              <span className="text-500 text-sm block mb-1">Estado actual</span>
              {savedKey ? (
                <span className="text-900 font-medium font-mono text-sm">{maskedKey(savedKey)}</span>
              ) : (
                <span className="text-400 text-sm">No configurada</span>
              )}
            </div>
            <div className="flex align-items-center gap-2">
              {statusTag()}
              {savedKey && (
                <Button icon="pi pi-trash" rounded text severity="danger" size="small" onClick={handleClear} tooltip="Eliminar API key" />
              )}
            </div>
          </div>

          {/* Formulario */}
          <div className="field mb-4">
            <label className="font-medium mb-2 block">API Key de OpenAI</label>
            <div className="p-inputgroup">
              <InputText
                value={showKey ? key : (key && key !== savedKey ? key : maskedKey(key))}
                onChange={(e) => setKey(e.target.value)}
                onFocus={() => setShowKey(true)}
                onBlur={() => setShowKey(false)}
                placeholder="sk-..."
                className="font-mono"
              />
              <Button
                icon={showKey ? 'pi pi-eye-slash' : 'pi pi-eye'}
                className="p-button-secondary"
                onClick={() => setShowKey((v) => !v)}
                type="button"
              />
            </div>
            <small className="text-400 mt-1 block">
              Obtén tu key en{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary">
                platform.openai.com/api-keys
              </a>
              . Se guarda solo en tu navegador (localStorage).
            </small>
          </div>

          <div className="flex gap-2">
            <Button
              label="Guardar"
              icon="pi pi-save"
              onClick={handleSave}
              disabled={!key.trim() || key.trim() === savedKey}
            />
            <Button
              label="Verificar conexión"
              icon="pi pi-wifi"
              severity="secondary"
              outlined
              loading={status === 'testing'}
              onClick={handleTest}
              disabled={!key.trim()}
            />
          </div>
        </div>

        {/* Info adicional */}
        <div className="card mt-0">
          <h5 className="mb-3">¿Cómo funciona?</h5>
          <ul className="m-0 pl-3 line-height-3 text-700">
            <li className="mb-2">Con API key configurada, el botón <strong>"Generar resumen"</strong> del Dashboard llama a <strong>gpt-4o-mini</strong> con el contexto real de tus leads.</li>
            <li className="mb-2">Sin API key, se genera un análisis local con la misma estructura pero sin LLM.</li>
            <li className="mb-2">La key se envía como header <code className="surface-100 border-round px-1">x-openai-key</code> a una API route de Next.js (<code className="surface-100 border-round px-1">/api/ai-summary</code>) que actúa como proxy — nunca queda expuesta en el bundle del cliente.</li>
            <li>El modelo usado es <strong>gpt-4o-mini</strong> (económico y rápido para esta tarea).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
