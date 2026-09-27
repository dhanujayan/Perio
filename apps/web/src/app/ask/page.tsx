import type { Metadata } from 'next';
import { AskForm } from '@/components/forms/AskForm';

export const metadata: Metadata = { title: 'Ask a question' };

export default async function AskPage({ searchParams }: { searchParams: Promise<{ for?: string }> }) {
  const { for: f } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Ask a question</h1>
      <p className="mt-3 text-lg leading-relaxed text-ink-soft">
        Questions that come up often are answered on the site for everyone. This is not a consultation: for
        advice about your own teeth, see a dentist.
      </p>
      <div className="mt-8">
        <AskForm initialAudience={f === 'dentist' ? 'dentist' : 'patient'} />
      </div>
    </div>
  );
}
