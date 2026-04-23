'use client';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Lead, SOURCE_OPTIONS } from '../../types/lead';

type FormValues = {
  nombre: string;
  email: string;
  telefono: string;
  fuente: string;
  producto_interes: string;
  presupuesto: number | null;
};

interface LeadFormProps {
  defaultValues?: Partial<Lead>;
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LeadForm({ defaultValues, onSubmit, onCancel, loading }: LeadFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      nombre: defaultValues?.nombre ?? '',
      email: defaultValues?.email ?? '',
      telefono: defaultValues?.telefono ?? '',
      fuente: defaultValues?.fuente ?? '',
      producto_interes: defaultValues?.producto_interes ?? '',
      presupuesto: defaultValues?.presupuesto ?? null,
    },
  });

  const err = (name: keyof FormValues) => classNames({ 'p-invalid': !!errors[name] });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-column gap-3 pt-2">
      <div className="field">
        <label className="font-medium mb-1 block">Nombre *</label>
        <Controller
          name="nombre"
          control={control}
          rules={{ required: 'Requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } }}
          render={({ field }) => (
            <InputText {...field} className={`w-full ${err('nombre')}`} placeholder="Nombre completo" />
          )}
        />
        {errors.nombre && <small className="p-error">{errors.nombre.message}</small>}
      </div>

      <div className="field">
        <label className="font-medium mb-1 block">Email *</label>
        <Controller
          name="email"
          control={control}
          rules={{
            required: 'Requerido',
            validate: (v) => EMAIL_RE.test(v) || 'Email inválido',
          }}
          render={({ field }) => (
            <InputText {...field} className={`w-full ${err('email')}`} placeholder="correo@ejemplo.com" />
          )}
        />
        {errors.email && <small className="p-error">{errors.email.message}</small>}
      </div>

      <div className="field">
        <label className="font-medium mb-1 block">Teléfono</label>
        <Controller
          name="telefono"
          control={control}
          render={({ field }) => (
            <InputText {...field} className="w-full" placeholder="+57 300 000 0000" />
          )}
        />
      </div>

      <div className="field">
        <label className="font-medium mb-1 block">Fuente *</label>
        <Controller
          name="fuente"
          control={control}
          rules={{ required: 'Selecciona una fuente' }}
          render={({ field }) => (
            <Dropdown
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              options={SOURCE_OPTIONS}
              placeholder="Selecciona una fuente"
              className={`w-full ${err('fuente')}`}
            />
          )}
        />
        {errors.fuente && <small className="p-error">{errors.fuente.message}</small>}
      </div>

      <div className="field">
        <label className="font-medium mb-1 block">Producto de interés</label>
        <Controller
          name="producto_interes"
          control={control}
          render={({ field }) => (
            <InputText {...field} className="w-full" placeholder="ej. Curso de marketing" />
          )}
        />
      </div>

      <div className="field">
        <label className="font-medium mb-1 block">Presupuesto (USD)</label>
        <Controller
          name="presupuesto"
          control={control}
          rules={{
            validate: (v) => v === null || v >= 0 || 'Debe ser mayor o igual a 0',
          }}
          render={({ field }) => (
            <InputNumber
              value={field.value}
              onValueChange={(e) => field.onChange(e.value ?? null)}
              mode="currency"
              currency="USD"
              className={`w-full ${err('presupuesto')}`}
              placeholder="0.00"
              min={0}
            />
          )}
        />
        {errors.presupuesto && <small className="p-error">{errors.presupuesto.message}</small>}
      </div>

      <div className="flex justify-content-end gap-2 mt-2">
        <Button type="button" label="Cancelar" severity="secondary" outlined onClick={onCancel} />
        <Button type="submit" label="Guardar" loading={loading} />
      </div>
    </form>
  );
}
