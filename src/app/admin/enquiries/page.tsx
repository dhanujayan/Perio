import { FilterLinks } from '@/components/admin/bits';
import { EnquiryItem } from '@/components/admin/InboxItems';
import { api, qs } from '@/lib/api';
import type { Enquiry } from '@/lib/types';

export default async function AdminEnquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const rows = await api<Enquiry[]>(`/admin/enquiries${qs({ status })}`);
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Clinic enquiries</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">Requests for a visiting periodontist. Online booking replaces this in a later version.</p>
      <div className="mt-6">
        <FilterLinks base="/admin/enquiries" current={{ status }} param="status" options={[{ label: 'All' }, { value: 'NEW', label: 'New' }, { value: 'CONTACTED', label: 'Contacted' }, { value: 'CLOSED', label: 'Closed' }]} />
      </div>
      {rows.length ? (
        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {rows.map((e) => (
            <EnquiryItem key={e.id} e={e} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-rule p-6 text-ink-soft">No enquiries here.</p>
      )}
    </div>
  );
}
