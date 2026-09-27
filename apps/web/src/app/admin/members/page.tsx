import { redirect } from 'next/navigation';
import { Pagination } from '@/components/Pagination';
import { formatDate } from '@/components/ReviewStatus';
import { api, getSessionUser, qs } from '@/lib/api';
import type { Member, Paged } from '@/lib/types';

export default async function AdminMembers({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') redirect('/admin');
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const data = await api<Paged<Member>>(`/admin/members${qs({ page, pageSize: 50 })}`);

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Members</h1>
      <p className="mt-2 text-ink-soft">{data.total} registered dentists and students.</p>
      {data.items.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-[0.95rem]">
            <thead className="border-b border-rule text-sm text-ink-soft">
              <tr>
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Registration / college</th>
                <th className="py-2 pr-4 font-semibold">City</th>
                <th className="py-2 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {data.items.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 pr-4">
                    {m.name}
                    {m.isStudent && <span className="ml-2 rounded bg-teal-wash px-1.5 py-0.5 text-xs font-semibold text-teal">Student</span>}
                  </td>
                  <td className="py-2.5 pr-4">{m.email}</td>
                  <td className="py-2.5 pr-4">{m.registrationNo || '—'}</td>
                  <td className="py-2.5 pr-4">{m.city || '—'}</td>
                  <td className="py-2.5 whitespace-nowrap text-ink-soft">{formatDate(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-rule p-6 text-ink-soft">No members yet.</p>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} hrefFor={(p) => `/admin/members?page=${p}`} />
    </div>
  );
}
