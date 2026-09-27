'use client';

import { send } from '@/lib/client';

export function SignOutButton({ className = 'btn btn-quiet' }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await send('/auth/logout', 'POST').catch(() => undefined);
        window.location.assign('/');
      }}
    >
      Sign out
    </button>
  );
}
