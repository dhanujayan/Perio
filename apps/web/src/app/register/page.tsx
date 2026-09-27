import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from '@/components/forms/RegisterForm';

export const metadata: Metadata = { title: 'Create a free dentist account', robots: { index: false } };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Free account for dentists</h1>
      <p className="mt-3 text-lg leading-relaxed text-ink-soft">
        For dentists and dental students. Read case-based articles and checklists, and hear first about webinars
        and courses.
      </p>
      <div className="mt-8">
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
