import { useState } from 'react';
import { Button, Input } from '@/shared/components/ui';
import { AppShell, PageHeader } from '@/shared/components/layout/AppShell';
import { useToast } from '@/shared/components/ui';
import {
  INTEGRATIONS,
  SEED_MEMBERS,
  PERMISSION_MODULES,
  type Member,
  type Permissions,
} from '../data/settings';
import { IntegrationRow, MemberRow, Section } from './settingsParts';

interface SettingsPageProps {
  activeRoute: string;
  onNavigate: (to: string) => void;
}

export function SettingsPage({ activeRoute, onNavigate }: SettingsPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Icaro Projects');
  const [integrations] = useState<Record<string, boolean>>(
    INTEGRATIONS.reduce((acc, i) => ({ ...acc, [i.id]: false }), {}),
  );
  const [members, setMembers] = useState<Member[]>(SEED_MEMBERS);
  const [newMember, setNewMember] = useState({ name: '', email: '' });
  const [cisRate, setCisRate] = useState('20');
  const [paymentTerms, setPaymentTerms] = useState('30');
  const [vatNumber, setVatNumber] = useState('');
  const { show } = useToast();

  function togglePermission(memberId: string, mod: string) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              permissions: {
                ...m.permissions,
                [mod]: !m.permissions[mod as keyof Permissions],
              },
            }
          : m,
      ),
    );
  }

  function removeMember(id: string) {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    if (member.openTenders > 0) {
      show(
        `Cannot remove ${member.name} — ${member.openTenders} open tender${
          member.openTenders > 1 ? 's' : ''
        } need reassignment first.`,
      );
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    show(`Removed ${member.name}`);
  }

  function previewAs(id: string) {
    const member = members.find((m) => m.id === id);
    if (member) show(`Preview mode: viewing as ${member.name} (placeholder)`);
  }

  function addMember() {
    if (!newMember.name.trim() || !newMember.email.trim()) return;
    if (members.length >= 4) {
      show('Maximum of 4 team members reached.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMember.email.trim())) {
      show('Enter a valid email address.');
      return;
    }
    setMembers((prev) => [
      ...prev,
      {
        id: `m${Date.now()}`,
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        role: 'pm',
        permissions: PERMISSION_MODULES.reduce(
          (acc, mod) => ({ ...acc, [mod]: false }),
          {} as Permissions,
        ),
        openTenders: 0,
      },
    ]);
    setNewMember({ name: '', email: '' });
  }

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      <div className="max-w-3xl">
        <PageHeader title="Settings" subtitle="Company, integrations, team permissions, financials." onOpenMenu={() => setSidebarOpen(true)} />

        <Section title="Company">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-gold" />
            <div className="flex-1">
              <label className="eyebrow block mb-1.5 text-text-muted">Company name</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3 mb-0 leading-relaxed">
            Logo replacement arrives with file storage — for now the logo is fixed.
          </p>
        </Section>

        <Section
          title="Integrations"
          note="Connect buttons are placeholders — the real OAuth flows for each integration are wired up separately."
        >
          <div>
            {INTEGRATIONS.map((integration) => (
              <IntegrationRow
                key={integration.id}
                name={integration.name}
                desc={integration.desc}
                connected={integrations[integration.id]}
                onConnect={() => show(`${integration.name} OAuth flow not yet wired up.`)}
              />
            ))}
          </div>
        </Section>

        <Section
          title="Team & Permissions"
          note="Up to 4 team members. New members start with no sections enabled. Sections without a checkbox (procurement, follow-ups, DocuSign, H&S, sub quotes/orders, snagging, meeting notes, suppliers) are visible to everyone."
        >
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              onTogglePermission={togglePermission}
              onRemove={removeMember}
              onPreviewAs={previewAs}
            />
          ))}

          <div className="pt-4 mt-2 border-t border-border-subtle">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="eyebrow block mb-1.5 text-text-muted">Name</label>
                <Input
                  value={newMember.name}
                  onChange={(e) => setNewMember((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="flex-1 w-full">
                <label className="eyebrow block mb-1.5 text-text-muted">Email</label>
                <Input
                  type="email"
                  placeholder="name@icaroprojects.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <Button variant="primary" onClick={addMember} className="w-full sm:w-auto">
                Add member
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Financials">
          <div className="space-y-4">
            <div>
              <label className="eyebrow block mb-1.5 text-text-muted">
                Default CIS deduction rate (%)
              </label>
              <Input
                type="number"
                min={0}
                max={30}
                value={cisRate}
                onChange={(e) => setCisRate(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5 text-text-muted">
                Default payment terms (days)
              </label>
              <Input
                type="number"
                min={0}
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5 text-text-muted">
                VAT registration number
              </label>
              <Input
                placeholder="GB 123 4567 89"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
          <p className="text-xs text-text-muted mt-4 mb-0 leading-relaxed">
            Applied to new subcontractor invoices and client valuations unless
            overridden per project.
          </p>
        </Section>
      </div>
    </AppShell>
  );
}
