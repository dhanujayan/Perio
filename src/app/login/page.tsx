import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/forms/LoginForm';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Sign in</h1>
      <div className="mt-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
