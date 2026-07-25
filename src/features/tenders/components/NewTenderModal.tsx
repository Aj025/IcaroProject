import { useState } from 'react';
import { Modal, Button, Input, Field, Select } from '@/shared/components/ui';
import { TENDER_STATUSES, type Tender, type TenderStatus } from '../data/tenders';
import { newTenderSchema, type NewTenderInput } from '../data/validation';
import { formatDate } from '@/shared/lib/format';

interface NewTenderModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (tender: Tender) => void;
}

interface FormState {
  client: string;
  job: string;
  received: string;
  due: string;
  contractSum: string;
  status: TenderStatus;
}

const EMPTY: FormState = {
  client: '',
  job: '',
  received: '',
  due: '',
  contractSum: '',
  status: 'Pricing',
};

export function NewTenderModal({ open, onClose, onCreate }: NewTenderModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    const parsed = newTenderSchema.safeParse({
      ...form,
      contractSum: Number(form.contractSum),
    } as unknown as NewTenderInput);

    if (!parsed.success) {
      const next: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormState | undefined;
        if (k && !next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }

    const data = parsed.data;
    const tender: Tender = {
      id: `t${Date.now()}`,
      client: data.client,
      job: data.job,
      received: formatDate(data.received),
      due: formatDate(data.due),
      contractSum: data.contractSum,
      status: data.status,
      deleted: false,
    };
    onCreate(tender);
    setForm(EMPTY);
    setErrors({});
  }

  return (
    <Modal
      open={open}
      title="New Tender"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Create
          </Button>
        </>
      }
    >
      <Field label="Client" error={errors.client}>
        <Input
          value={form.client}
          onChange={(e) => update('client', e.target.value)}
        />
      </Field>
      <Field label="Job Description" error={errors.job}>
        <Input value={form.job} onChange={(e) => update('job', e.target.value)} />
      </Field>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Field label="Received" error={errors.received}>
            <Input
              type="date"
              value={form.received}
              onChange={(e) => update('received', e.target.value)}
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Due Date" error={errors.due}>
            <Input
              type="date"
              value={form.due}
              onChange={(e) => update('due', e.target.value)}
            />
          </Field>
        </div>
      </div>
      <Field label="Contract Sum (£)" error={errors.contractSum}>
        <Input
          type="number"
          min={0}
          value={form.contractSum}
          onChange={(e) => update('contractSum', e.target.value)}
        />
      </Field>
      <Field label="Status">
        <Select
          value={form.status}
          onChange={(e) => update('status', e.target.value as TenderStatus)}
          className="w-full"
        >
          {TENDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
    </Modal>
  );
}
