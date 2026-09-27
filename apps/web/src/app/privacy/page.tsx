import type { Metadata } from 'next';
import { site } from '@/site.config';

export const metadata: Metadata = { title: 'Privacy' };

// TODO: have this reviewed by a lawyer against the Digital Personal Data Protection Act 2023 before launch.
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Privacy notice</h1>
      <p className="mt-3 rounded-md bg-warn-wash px-3 py-2 text-sm text-warn">
        Draft notice. To be reviewed before launch.
      </p>
      <div className="answer mt-8">
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Dentist accounts:</strong> name, email, password (stored only as a one-way hash), and
            optionally registration number or college, city and phone.
          </li>
          <li>
            <strong>Questions:</strong> your name, email and question.
          </li>
          <li>
            <strong>Clinic enquiries:</strong> clinic name, contact person, email, phone, city and visit details.
          </li>
        </ul>
        <h2>What we do not collect</h2>
        <p>
          Please do not send patient names, photographs or medical records through this site. Case records for
          clinic visits are shared separately, with patient consent.
        </p>
        <h2>How we use it</h2>
        <ul>
          <li>To run your account and show members-only content.</li>
          <li>To answer questions on the site and reply to enquiries.</li>
          <li>To tell registered dentists about new content, webinars and courses. You can opt out at any time.</li>
        </ul>
        <p>We do not sell your data. The site uses one essential cookie to keep you signed in, and no tracking cookies.</p>
        <h2>Your choices</h2>
        <p>
          To see, correct or delete your data, email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
        </p>
      </div>
    </div>
  );
}
