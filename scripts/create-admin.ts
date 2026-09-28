/**
 * Creates an ADMIN or STAFF account from the command line.
 *   npm run admin:create -- --email you@example.com --name "Dr Name" --role ADMIN
 * The password is read from the ADMIN_PASSWORD environment variable, so it stays out of your
 * shell history. On a hosted site you can use the /setup page instead for the first admin.
 */
import { config } from 'dotenv';
import { parseArgs } from 'node:util';

config({ path: ['.env.local', '.env'], quiet: true });

async function main() {
  const { values } = parseArgs({
    options: { email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string', default: 'ADMIN' } },
  });
  const email = values.email?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const role = values.role === 'STAFF' ? 'STAFF' : 'ADMIN';
  if (!email || !values.name) throw new Error('Pass --email and --name');
  if (password.length < 10) throw new Error('Set ADMIN_PASSWORD (10+ characters)');

  const { createUser } = await import('../src/server/services/accounts');
  const { user } = await createUser({ email, name: values.name, password, role });
  console.log(`Created ${role} ${user.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
