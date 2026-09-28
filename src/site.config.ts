/**
 * Everything brand-specific lives here, so the placeholder name and profile can be swapped in one place.
 * TODO before launch: replace the placeholders marked TODO.
 */
export const site = {
  // TODO: final brand name
  name: 'Perio Knowledge Hub',
  shortName: 'Perio Hub',
  tagline: 'Clear answers on gum health, for dentists and patients in India.',
  url: process.env.SITE_URL || process.env.URL || 'http://localhost:3000',
  contactEmail: 'hello@example.com', // TODO
  specialist: {
    name: 'Dr Ashlee Shailesh',
    title: 'Periodontist',
    // TODO: qualifications, e.g. "BDS, MDS (Periodontology)". Left empty until confirmed.
    qualifications: '',
    // TODO: state dental council registration number. Shown only when filled.
    registration: '',
    bio: [
      // TODO: replace with her own words
      'A periodontist is a dental specialist in the gums and bone that hold teeth in place, and in dental implants.',
      'This site exists because too many saveable teeth in India are extracted and replaced with implants. Most gum disease can be treated, and most treated teeth can be kept.',
    ],
  },
};

export const disclaimer =
  'Information on this site is for education. It does not replace an examination by a dentist, and it is not a diagnosis or treatment plan for any individual.';
