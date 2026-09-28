/**
 * Starter content for the knowledge hub.
 *
 * IMPORTANT: every item below is a draft written to show how the hub works. None of it has been
 * clinically reviewed. The seed publishes it with no review date, so the site shows an
 * "awaiting clinical review" badge until the specialist edits it and marks it reviewed in the admin.
 */
import type { Audience } from './schema';

export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
}

export interface SeedFaq {
  slug: string;
  audience: Audience;
  category: string;
  question: string;
  summary: string;
  answer: string;
  references?: string;
  tags: string[];
}

export interface SeedArticle {
  slug: string;
  audience: Audience;
  category: string;
  title: string;
  summary: string;
  body: string;
  membersOnly: boolean;
  tags: string[];
}

export const seedCategories: SeedCategory[] = [
  { slug: 'gum-disease-basics', name: 'Gum disease basics', description: 'What gum disease is, how it starts and how it progresses.' },
  { slug: 'diagnosis', name: 'Diagnosis and classification', description: 'Charting, radiographs, staging and grading.' },
  { slug: 'treatment', name: 'Treatment options', description: 'From deep cleaning to periodontal surgery and regeneration.' },
  { slug: 'saving-teeth', name: 'Saving teeth vs extraction', description: 'When a tooth can be kept, and what that takes.' },
  { slug: 'implants', name: 'Implants and gum health', description: 'Implants in periodontal patients and peri-implant disease.' },
  { slug: 'general-health', name: 'Gum health and general health', description: 'Links with diabetes, heart disease and pregnancy.' },
  { slug: 'prevention', name: 'Prevention and maintenance', description: 'Home care and long-term follow-up.' },
  { slug: 'referral', name: 'Referral and teamwork', description: 'Working with a periodontist.' },
];

const REF = {
  tonetti2018:
    'Tonetti MS, Greenwell H, Kornman KS. Staging and grading of periodontitis: framework and proposal of a new classification and case definition. J Periodontol. 2018;89(Suppl 1):S159–S172.',
  papapanou2018:
    'Papapanou PN, Sanz M, et al. Periodontitis: consensus report of workgroup 2 of the 2017 World Workshop on the Classification of Periodontal and Peri-Implant Diseases and Conditions. J Clin Periodontol. 2018;45(Suppl 20):S162–S170.',
  efpS3:
    'Sanz M, Herrera D, Kebschull M, et al. Treatment of stage I–III periodontitis: the EFP S3 level clinical practice guideline. J Clin Periodontol. 2020;47(Suppl 22):4–60.',
  efpS3stage4:
    'Herrera D, Sanz M, Kebschull M, et al. Treatment of stage IV periodontitis: the EFP S3 level clinical practice guideline. J Clin Periodontol. 2022;49(Suppl 24):4–71.',
  berglundh2018:
    'Berglundh T, Armitage G, et al. Peri-implant diseases and conditions: consensus report of workgroup 4 of the 2017 World Workshop. J Clin Periodontol. 2018;45(Suppl 20):S286–S291.',
  sanzDiabetes2018:
    'Sanz M, Ceriello A, Buysschaert M, et al. Scientific evidence on the links between periodontal diseases and diabetes: consensus report and guidelines of the joint workshop (IDF and EFP). J Clin Periodontol. 2018;45(2):138–149.',
  cochrane2022:
    'Simpson TC, Clarkson JE, Worthington HV, et al. Treatment of periodontitis for glycaemic control in people with diabetes mellitus. Cochrane Database Syst Rev. 2022;4:CD004714.',
};

const refs = (...items: string[]) => items.map((r) => `- ${r}`).join('\n');

export const seedFaqs: SeedFaq[] = [
  // ------------------------------ Dentists ------------------------------
  {
    slug: 'staging-and-grading-periodontitis-2017-classification',
    audience: 'DENTIST',
    category: 'diagnosis',
    question: 'How do I stage and grade periodontitis under the 2017 classification?',
    summary:
      'Stage (I–IV) describes severity and complexity, mainly from interdental attachment loss, bone loss and teeth lost to periodontitis. Grade (A–C) describes the rate of progression and is modified by smoking and diabetes.',
    answer: `**Stage** describes how severe and complex the disease is now. Start from the worst site.

| | Stage I | Stage II | Stage III | Stage IV |
|---|---|---|---|---|
| Interdental CAL (worst site) | 1–2 mm | 3–4 mm | ≥5 mm | ≥5 mm |
| Radiographic bone loss | <15% (coronal third) | 15–33% (coronal third) | Into middle third or beyond | Into middle third or beyond |
| Teeth lost to periodontitis | None | None | ≤4 | ≥5 |
| Complexity | Max PD ≤4 mm, mostly horizontal loss | Max PD ≤5 mm, mostly horizontal loss | PD ≥6 mm, vertical loss ≥3 mm, furcation II/III, moderate ridge defect | Stage III plus need for complex rehabilitation: masticatory dysfunction, secondary occlusal trauma, bite collapse, drifting, <20 teeth |

Severity sets the minimum stage; complexity factors can shift it up.

**Extent**: localised (<30% of teeth), generalised (≥30%), or molar–incisor pattern.

**Grade** estimates how fast the disease is progressing:

- **Direct evidence** (bone or CAL loss over 5 years): Grade A none, Grade B <2 mm, Grade C ≥2 mm.
- **Indirect evidence** (% bone loss ÷ age, at the worst tooth): A <0.25, B 0.25–1.0, C >1.0.
- **Modifiers**: smoking <10 cigarettes a day moves to at least B, ≥10 a day to C. Diabetes with HbA1c <7.0% moves to at least B, ≥7.0% to C.

Start at Grade B and move up or down only when there is evidence.

**Example diagnosis**: *Periodontitis, generalised, Stage III, Grade C (smoker, 15 cigarettes a day).*`,
    references: refs(REF.tonetti2018, REF.papapanou2018),
    tags: ['classification', 'staging', 'grading'],
  },
  {
    slug: 'when-is-a-periodontally-compromised-tooth-worth-saving',
    audience: 'DENTIST',
    category: 'saving-teeth',
    question: 'When is a periodontally compromised tooth worth saving rather than extracting?',
    summary:
      'Many teeth with deep pockets, bone loss or mobility can be kept for years with proper periodontal therapy and maintenance. Decide on the tooth, the patient and the treatment plan together, after initial therapy where possible.',
    answer: `Deep pockets, bone loss or mobility on their own are not reasons to extract. Long-term studies of treated and maintained periodontal patients report low rates of tooth loss, including many teeth first judged "questionable".

**Look at the tooth**

- Remaining attachment and bone, and the defect shape: contained intrabony defects respond well to regeneration.
- Furcation involvement: degree, which tooth, and access for cleaning.
- Mobility: is it increasing, or stable and caused by reduced support?
- Endodontic status and restorability.
- Strategic value: abutment, occlusal stop, space maintenance.

**Look at the patient**

- Smoking and diabetes control.
- Plaque control and willingness to attend supportive care.
- Expectations and budget: therapy plus maintenance versus extraction plus implant plus the implant's own maintenance.

**Timing matters.** Prognosis given before non-surgical therapy often improves after it. Where the patient can wait, treat first, re-evaluate, then decide.

Extraction is reasonable when a tooth is non-restorable, has a vertical root fracture, has repeated abscesses despite treatment, or its loss of support makes it unusable in the treatment plan.`,
    references: refs(REF.efpS3, REF.efpS3stage4),
    tags: ['prognosis', 'extraction', 'treatment planning'],
  },
  {
    slug: 'step-wise-treatment-before-extraction',
    audience: 'DENTIST',
    category: 'treatment',
    question: 'What treatment options should I try before extracting a periodontally involved tooth?',
    summary:
      'Follow the step-wise approach: risk-factor control and oral hygiene, then subgingival instrumentation, re-evaluation, then surgery for residual deep pockets, then lifelong supportive care.',
    answer: `The EFP S3 guideline sets out four steps.

1. **Step 1: build the foundation.** Explain the disease, coach oral hygiene (including interdental cleaning), remove supragingival plaque and calculus and plaque-retentive factors, and address smoking and diabetes control.
2. **Step 2: subgingival instrumentation.** Scaling and root surface instrumentation, with hand or power instruments. Adjuncts are optional and case-dependent.
3. **Re-evaluate** after healing. Residual pockets ≥6 mm, or 4–5 mm with bleeding, need further treatment.
4. **Step 3: treat residual pockets.**
    - Repeat instrumentation for moderate residual pockets.
    - Access flap surgery for deep residual pockets.
    - Regenerative surgery for intrabony defects ≥3 mm and for class II furcations in mandibular molars.
    - Resective surgery where regeneration is not indicated.
5. **Step 4: supportive periodontal care**, with recall intervals set by risk.

A tooth should normally reach extraction only after these steps have failed, or when it is non-restorable for other reasons.`,
    references: refs(REF.efpS3),
    tags: ['treatment', 'SRP', 'surgery', 'regeneration'],
  },
  {
    slug: 'implants-in-patients-with-periodontitis',
    audience: 'DENTIST',
    category: 'implants',
    question: 'Why do implants fail more often in patients with untreated periodontitis, and how should I manage peri-implantitis?',
    summary:
      'A history of periodontitis is a risk indicator for peri-implantitis. Treat and stabilise periodontitis before placing implants, and keep implant patients on supportive care for life.',
    answer: `A history of periodontitis, poor plaque control and no regular maintenance are all associated with peri-implantitis. Replacing periodontally involved teeth with implants does not remove the patient's susceptibility.

**Before placing implants**

- Complete periodontal therapy and confirm stability: no residual pockets ≥6 mm, low bleeding scores.
- Consider whether the tooth can be kept (see the save-or-extract question).
- Plan a restoration the patient can clean.

**Case definitions (2017 World Workshop)**

- **Peri-implant mucositis**: bleeding and/or suppuration on gentle probing, with no bone loss beyond initial remodelling.
- **Peri-implantitis**: bleeding and/or suppuration on probing, increased probing depth compared with earlier examinations, and bone loss beyond initial remodelling. Without earlier records: bleeding on probing, probing depth ≥6 mm and bone level ≥3 mm apical to the most coronal part of the intraosseous portion.

**Managing peri-implantitis**

1. Non-surgical debridement and hygiene reinforcement first; treat mucositis early, as it is reversible.
2. Surgical access for decontamination where non-surgical treatment fails; reconstructive or resective approaches depend on defect shape.
3. Supportive care at regular intervals, with probing and radiographs.`,
    references: refs(REF.berglundh2018, REF.efpS3stage4),
    tags: ['implants', 'peri-implantitis'],
  },
  {
    slug: 'when-to-refer-to-a-periodontist',
    audience: 'DENTIST',
    category: 'referral',
    question: 'When and how should I refer a patient to a periodontist?',
    summary:
      'Refer for Stage III–IV or Grade C periodontitis, residual deep pockets after non-surgical therapy, intrabony or furcation defects, mucogingival problems, peri-implantitis, and periodontal patients planned for implants.',
    answer: `**Refer when you see**

- Stage III or IV periodontitis, or Grade C (rapid progression), especially in younger patients.
- Residual pockets ≥6 mm after thorough non-surgical treatment.
- Intrabony defects or furcation involvement that may suit regenerative surgery.
- Gingival recession needing root coverage, or other mucogingival problems.
- Peri-implant mucositis that does not resolve, or peri-implantitis.
- Periodontal patients in whom implants are planned.
- Medically complex patients: uncontrolled diabetes, anticoagulants, immunosuppression.

**Send with the referral**

- Full-mouth periodontal chart (probing depths, recession, bleeding, mobility, furcations).
- Recent radiographs: OPG or full-mouth IOPAs, and CBCT where relevant.
- Medical history, medications and smoking status.
- What you have done so far and what you want: an opinion, surgery only, or full care.

Shared care works well: the periodontist treats and sets the maintenance plan; the general dentist continues restorative care and recalls.`,
    references: refs(REF.efpS3),
    tags: ['referral'],
  },
  {
    slug: 'supportive-periodontal-care-recall-interval',
    audience: 'DENTIST',
    category: 'prevention',
    question: 'How often should a treated periodontal patient be recalled for maintenance?',
    summary:
      'Supportive periodontal care is usually every 3–6 months, set by the patient’s risk: bleeding, residual pockets, smoking, diabetes and tooth loss history.',
    answer: `Supportive periodontal care (SPC) is what keeps treated teeth. Patients who stop attending have higher rates of recurrence and tooth loss.

**Setting the interval**

- Most treated periodontitis patients start at **3 months**.
- Lengthen towards 6 months when the periodontium stays stable: low bleeding, no pockets ≥5 mm with bleeding, good plaque control, non-smoker.
- Keep it short for smokers, poorly controlled diabetics, Grade C cases and patients with residual pockets.

**At each visit**

- Update medical history and smoking status.
- Chart bleeding and probing depths; compare with earlier charts.
- Reinforce oral hygiene and interdental cleaning.
- Professional plaque and calculus removal; re-instrument active sites.
- Radiographs when indicated.`,
    references: refs(REF.efpS3),
    tags: ['maintenance', 'recall'],
  },
  {
    slug: 'systemic-antibiotics-with-scaling-and-root-planing',
    audience: 'DENTIST',
    category: 'treatment',
    question: 'Should I prescribe systemic antibiotics with scaling and root planing?',
    summary:
      'Not routinely. Guidelines advise against routine use because of side effects and resistance; they may be considered for specific patients, such as young adults with generalised Stage III periodontitis.',
    answer: `The EFP S3 guideline recommends **against routine use** of systemic antibiotics with subgingival instrumentation, because of concern for patient health and antimicrobial resistance.

They **may be considered** in specific patient categories, for example generalised Stage III periodontitis in young adults with a high rate of progression.

Antibiotics are never a replacement for thorough mechanical debridement, and should be given alongside it, not before or instead of it.`,
    references: refs(REF.efpS3),
    tags: ['antibiotics', 'SRP'],
  },
  {
    slug: 'periodontitis-and-diabetes-for-dentists',
    audience: 'DENTIST',
    category: 'general-health',
    question: 'What is the link between periodontitis and diabetes, and what should I do about it?',
    summary:
      'The relationship runs both ways: diabetes raises periodontitis risk and severity, and periodontitis worsens glycaemic control. Periodontal treatment is associated with a modest short-term fall in HbA1c.',
    answer: `**Both directions**

- Diabetes, especially when poorly controlled, increases the risk, severity and progression of periodontitis. In the 2017 classification it is a grade modifier.
- Periodontitis is associated with worse glycaemic control and more diabetic complications.
- Treating periodontitis is associated with a modest reduction in HbA1c in the short term. A Cochrane review reports about 0.4 percentage points at 3–4 months; evidence beyond that is less certain.

**In practice**

- Ask every periodontal patient about diabetes symptoms, diagnosis and latest HbA1c.
- Consider referral for screening when there are risk factors and no diagnosis.
- Tell diabetic patients that gum treatment is part of their diabetes care, and write to their physician.
- Schedule shorter recall intervals for diabetic patients.`,
    references: refs(REF.sanzDiabetes2018, REF.cochrane2022),
    tags: ['diabetes', 'systemic'],
  },

  // ------------------------------ Patients ------------------------------
  {
    slug: 'why-do-my-gums-bleed-when-i-brush',
    audience: 'PATIENT',
    category: 'gum-disease-basics',
    question: 'Why do my gums bleed when I brush?',
    summary:
      'Bleeding gums are usually the first sign of gum inflammation caused by plaque. Healthy gums do not bleed. It can often be reversed if treated early.',
    answer: `Healthy gums do **not** bleed when you brush or floss. Bleeding usually means the gums are inflamed because of **plaque**, the sticky layer of bacteria that builds up along the gum line.

**Early stage (gingivitis)**: red, puffy gums that bleed easily. This is **reversible** with good brushing, cleaning between the teeth and a professional cleaning.

**If it is ignored**, inflammation can spread deeper and destroy the bone that holds teeth in place. This is **periodontitis**, and the damage is not fully reversible.

**What to do**

- Keep brushing, gently but thoroughly, twice a day. Do not stop because of the bleeding.
- Clean between your teeth daily with floss or interdental brushes.
- See a dentist for a gum check and cleaning.

See a dentist promptly if bleeding lasts more than two weeks, your gums are swollen or painful, or you notice bad breath or loose teeth.`,
    tags: ['bleeding gums', 'gingivitis'],
  },
  {
    slug: 'does-scaling-loosen-teeth-or-create-gaps',
    audience: 'PATIENT',
    category: 'treatment',
    question: 'Does cleaning (scaling) loosen teeth or create gaps between them?',
    summary:
      'No. Scaling removes hardened deposits (calculus). The gaps or slight looseness some people notice afterwards were already there, hidden under the calculus and swollen gums.',
    answer: `This is one of the most common worries, and it is a myth.

**What scaling does**: it removes **calculus** (tartar), the hard deposit that forms from plaque and cannot be brushed off. It does not remove any tooth or bone.

**Why some people notice gaps afterwards**

- Calculus can fill the spaces between teeth, and swollen gums hide them. Once both are gone, the real spaces become visible.
- If gum disease has already caused bone loss, some teeth were already slightly loose. Calculus sometimes acts like a splint and hides this.

**What happens next**: as the gums heal, they become firmer and tighter. Many people find bleeding stops and their mouth feels fresher.

Some sensitivity for a few days is normal. Avoiding cleaning allows gum disease to keep damaging the bone, which is what really loosens teeth.`,
    tags: ['scaling', 'myths', 'cleaning'],
  },
  {
    slug: 'can-my-loose-tooth-be-saved',
    audience: 'PATIENT',
    category: 'saving-teeth',
    question: 'Can my loose tooth be saved, or does it have to come out?',
    summary:
      'Often it can be saved. Many teeth loosened by gum disease become stable after gum treatment. Ask for a gum assessment before agreeing to an extraction.',
    answer: `A loose tooth does not automatically need to be removed.

**Why teeth become loose**: gum disease destroys the bone and fibres that hold the tooth. The tooth itself is often still healthy.

**Treatment can help**

- Deep cleaning below the gums removes the bacteria driving the disease.
- In some cases, gum surgery can repair lost bone (regenerative treatment).
- Teeth can be splinted to neighbouring teeth for support while they heal.
- Regular maintenance cleanings keep the disease under control.

**Ask these questions before an extraction**

- Has my gum disease been measured and diagnosed?
- Has gum treatment been tried?
- Can a periodontist (gum specialist) give an opinion?

Sometimes extraction is the right choice, for example if the tooth is cracked or cannot be restored. It should be a decision made after an assessment, not the first option.`,
    tags: ['loose teeth', 'extraction'],
  },
  {
    slug: 'gum-disease-diabetes-heart-pregnancy',
    audience: 'PATIENT',
    category: 'general-health',
    question: 'Is gum disease linked to diabetes, heart disease or pregnancy?',
    summary:
      'Yes. Gum disease is linked with diabetes in both directions, and is associated with heart disease and pregnancy complications. Treating your gums is part of looking after your overall health.',
    answer: `Your mouth is connected to the rest of your body.

**Diabetes**: people with diabetes are more likely to get gum disease, and it tends to be more severe. Gum disease can also make blood sugar harder to control. Treating gum disease may help blood sugar control a little.

**Heart disease**: gum disease is associated with a higher risk of heart and blood vessel disease. Researchers are still studying how strong the link is.

**Pregnancy**: hormone changes make gums more likely to bleed and swell during pregnancy. Gum disease has been associated with complications such as premature birth. Dental check-ups and gum cleaning are safe during pregnancy; tell your dentist you are pregnant.

**What to do**

- If you have diabetes, tell your dentist and have your gums checked regularly.
- If your gums bleed during pregnancy, see a dentist rather than waiting.
- Tell your doctor if you are being treated for gum disease.`,
    tags: ['diabetes', 'heart', 'pregnancy'],
  },
  {
    slug: 'does-gum-treatment-hurt',
    audience: 'PATIENT',
    category: 'treatment',
    question: 'Does gum treatment hurt, and how long does it take?',
    summary:
      'Deep cleaning and gum surgery are done under local anaesthetic, so you should not feel pain during treatment. Mild soreness for a few days afterwards is common.',
    answer: `**During treatment**: deep cleaning below the gums and gum surgery are done after numbing the area with local anaesthetic, the same injection used for fillings. You may feel pressure and vibration, but should not feel pain.

**Afterwards**: gums and teeth can be tender or sensitive for a few days. Over-the-counter pain relief usually helps; your dentist will advise what is suitable for you.

**How long it takes**

- Deep cleaning is often done in 1–4 visits, depending on how many teeth are affected.
- Your gums are checked again after they have healed, usually a few weeks later.
- Some patients then need surgery for areas that did not heal fully.
- After that, regular maintenance cleanings, usually every 3–6 months.

Gum disease is managed over time, like blood pressure or diabetes, not cured in one visit.`,
    tags: ['treatment', 'pain', 'anaesthetic'],
  },
  {
    slug: 'saving-my-tooth-vs-implant',
    audience: 'PATIENT',
    category: 'implants',
    question: 'Is saving my own tooth better than getting an implant?',
    summary:
      'When a tooth can be saved with gum treatment, keeping it is usually the better first choice. Implants are a good replacement, but they can also get gum disease if the cause is not treated.',
    answer: `Implants are an excellent way to **replace** a missing tooth. They are not always a better choice than **keeping** your own tooth.

**Why keeping your tooth is usually the first choice**

- Your natural tooth has a ligament that cushions biting forces and gives feel.
- Gum treatment is often less expensive than extraction plus an implant.
- If gum disease is not treated, implants can get a similar disease (peri-implantitis) and fail.

**When an implant makes sense**

- The tooth is cracked, badly decayed or cannot be restored.
- Gum treatment has been tried and the tooth still cannot be kept.

**Either way**: your gums need to be healthy and checked regularly, whether you have your own teeth, implants, or both.`,
    tags: ['implants', 'saving teeth'],
  },
  {
    slug: 'what-is-a-periodontist',
    audience: 'PATIENT',
    category: 'referral',
    question: 'What is a periodontist, and when should I see one?',
    summary:
      'A periodontist is a dentist with specialist training in the gums and bone that support the teeth, and in dental implants. See one for advanced gum disease, loose teeth or receding gums.',
    answer: `A **periodontist** is a dentist who has completed specialist postgraduate training (in India, an MDS in Periodontology) in diagnosing and treating diseases of the gums and bone around teeth and implants.

**A periodontist can help with**

- Advanced gum disease and loose teeth.
- Receding gums and sensitive exposed roots.
- Gum surgery, including treatment to regrow lost bone.
- Implant placement and problems around implants.
- Gum disease in people with diabetes or other health conditions.

**Consider asking for a periodontist if**

- Your gums bleed often or are receding.
- A tooth feels loose or has moved.
- You have been told a tooth must come out because of gum disease.
- You are planning an implant and have had gum problems.

Your regular dentist can refer you, and usually continues your routine care.`,
    tags: ['periodontist', 'specialist'],
  },
  {
    slug: 'how-to-prevent-gum-disease-at-home',
    audience: 'PATIENT',
    category: 'prevention',
    question: 'How can I prevent gum disease at home?',
    summary:
      'Brush twice a day along the gum line, clean between your teeth every day, avoid tobacco, keep diabetes controlled, and have regular dental check-ups and cleanings.',
    answer: `**Every day**

- Brush twice a day for two minutes with a soft brush and fluoride toothpaste. Angle the bristles towards the gum line.
- Clean between your teeth once a day: floss, interdental brushes or a water flosser. A toothbrush cannot reach these areas, and this is where gum disease often starts.

**Lifestyle**

- Avoid smoking, gutka, paan and other tobacco. Tobacco is one of the strongest risk factors for gum disease and also hides bleeding, so the disease goes unnoticed.
- Keep diabetes well controlled.

**At the dentist**

- Have a check-up and cleaning every 6 months, or more often if advised.
- Ask your dentist to check your gums, not just your teeth.

**Warning signs to act on**: bleeding, swelling, bad breath that does not go away, receding gums, or teeth that feel loose or have moved.`,
    tags: ['prevention', 'brushing', 'flossing', 'tobacco'],
  },
  {
    slug: 'bad-breath-after-brushing',
    audience: 'PATIENT',
    category: 'gum-disease-basics',
    question: 'Why do I have bad breath even after brushing?',
    summary:
      'Persistent bad breath often comes from bacteria under the gums or on the tongue. It can be a sign of gum disease, so have your gums checked if it does not improve.',
    answer: `Most persistent bad breath starts in the mouth.

**Common causes**

- **Gum disease**: bacteria in pockets under the gums produce foul-smelling gases that brushing cannot reach.
- **Tongue coating**: bacteria collect on the back of the tongue.
- **Food trapped between teeth**, decay, or old fillings and crowns that trap plaque.
- **Dry mouth**, smoking and tobacco.

**What helps**

- Clean between your teeth daily and gently clean your tongue.
- Drink water regularly.
- Avoid tobacco.
- See a dentist for a gum check and cleaning.

Mouthwash only masks the smell for a short time. If bad breath continues after a professional cleaning, your dentist may suggest checking for other causes.`,
    tags: ['bad breath', 'halitosis'],
  },
  {
    slug: 'receding-gums',
    audience: 'PATIENT',
    category: 'gum-disease-basics',
    question: 'My gums look like they are shrinking. What is gum recession?',
    summary:
      'Gum recession is when the gum pulls back and exposes the root of the tooth. Causes include gum disease, brushing too hard and thin gums. Some recession can be treated with gum grafting.',
    answer: `**Gum recession** means the gum has moved away from the tooth, exposing part of the root. Teeth may look longer, and you may feel sensitivity to cold.

**Common causes**

- Gum disease.
- Brushing too hard or with a hard-bristled brush.
- Naturally thin gums.
- Crooked teeth, tooth grinding, or lip and tongue piercings.

**Why it matters**: exposed roots are more sensitive and more likely to decay, and recession can get worse over time.

**Treatment**

- Find and correct the cause, such as brushing technique or gum disease.
- Desensitising toothpaste for sensitivity.
- Gum grafting surgery to cover exposed roots, in suitable cases.

Ask your dentist to measure the recession so any change can be tracked.`,
    tags: ['recession', 'sensitivity'],
  },
];

export const seedArticles: SeedArticle[] = [
  {
    slug: 'gum-disease-explained',
    audience: 'PATIENT',
    category: 'gum-disease-basics',
    title: 'Gum disease explained: from bleeding gums to loose teeth',
    summary: 'How gum disease starts, how it progresses, and why treating it early protects your teeth.',
    membersOnly: false,
    tags: ['gum disease', 'basics'],
    body: `Gum disease is one of the most common reasons adults lose teeth, and it is largely preventable.

## How it starts

Plaque, a sticky film of bacteria, builds up along the gum line every day. If it is not cleaned away, the gums become inflamed: red, swollen and quick to bleed. This is **gingivitis**, and it can be reversed.

## How it progresses

When inflammation continues, it spreads below the gum line. The body's response starts to break down the fibres and bone that hold teeth in place. Pockets form between the gum and tooth, collecting more bacteria. This is **periodontitis**.

Over years, teeth can become loose, drift apart and eventually be lost.

## Why many people do not notice

Periodontitis is usually **painless** until late. Smoking and tobacco reduce bleeding and hide the warning signs.

## What treatment looks like

1. A gum examination with measurements and X-rays.
2. Deep cleaning below the gum line.
3. A check after healing, and surgery for areas that need it.
4. Regular maintenance cleanings for life.

Most teeth affected by gum disease can be kept when it is treated and maintained.`,
  },
  {
    slug: 'step-wise-approach-to-periodontitis',
    audience: 'DENTIST',
    category: 'treatment',
    title: 'The step-wise approach to treating Stage I–III periodontitis',
    summary: 'A practical summary of the four treatment steps in the EFP S3 guideline, for general practice.',
    membersOnly: false,
    tags: ['treatment', 'guideline'],
    body: `The EFP S3 clinical practice guideline organises periodontitis treatment into four steps. Each step builds on the one before, and the patient's response decides whether to move on.

## Step 1: the foundation

- Explain the diagnosis and the patient's role.
- Oral hygiene coaching, including interdental cleaning.
- Supragingival professional plaque and calculus removal.
- Risk-factor control: smoking cessation support and diabetes control.

## Step 2: cause-related therapy

- Subgingival instrumentation of all affected sites.
- Adjunctive treatments only where indicated; systemic antibiotics not routinely.

## Re-evaluation

After healing, re-chart. The end point is no pockets ≥5 mm with bleeding on probing.

## Step 3: treating non-responding sites

- Repeat instrumentation for moderate residual pockets.
- Access flap for deep residual pockets.
- Regenerative surgery for intrabony defects ≥3 mm and suitable furcations.

## Step 4: supportive periodontal care

- Recall at 3–12 month intervals set by risk.
- Re-treat recurrent disease promptly.

*Draft summary for illustration. Read the full guideline for the evidence behind each recommendation.*`,
  },
  {
    slug: 'save-or-extract-checklist',
    audience: 'DENTIST',
    category: 'saving-teeth',
    title: 'Save or extract? A checklist for the periodontally compromised tooth',
    summary: 'A structured way to decide whether a tooth with periodontal bone loss should be treated or removed. Free for registered dentists.',
    membersOnly: true,
    tags: ['prognosis', 'extraction', 'checklist'],
    body: `Use this checklist before recommending extraction of a tooth with periodontal involvement.

## 1. Diagnosis complete?

- [ ] Full-mouth chart: probing depths, recession, bleeding, mobility, furcations
- [ ] Radiographs of adequate quality; CBCT if furcation or defect anatomy is unclear
- [ ] Stage and grade recorded

## 2. Tooth factors

- [ ] Restorable, no vertical root fracture
- [ ] Endodontic status known; endo-perio lesions treated endodontically first
- [ ] Defect morphology assessed: intrabony and contained defects favour regeneration
- [ ] Furcation degree and access for cleaning
- [ ] Mobility: increasing, or stable?

## 3. Patient factors

- [ ] Smoking status and willingness to stop
- [ ] Diabetes control (HbA1c)
- [ ] Plaque control after Step 1
- [ ] Commitment to supportive care

## 4. Strategic value

- [ ] Role in the treatment plan: abutment, occlusal stop, aesthetics
- [ ] Cost and burden of keeping versus replacing, including implant maintenance

## 5. Decision point

Re-assess after non-surgical therapy. Many teeth judged questionable at first improve.

*Draft checklist for illustration.*`,
  },
];
