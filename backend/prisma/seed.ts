// Seed reference data: syllabus templates, badges, a few organizations.
// Run: npm run db:seed   (requires DATABASE_URL + migrated DB)
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  // 50th BCS preliminary: 200 marks (source: Prothom Alo, see docs/research/sources.md). Verify before each new BCS.
  await prisma.syllabusTemplate.upsert({
    where: { track_name_version: { track: 'BCS', name: 'BCS Preliminary (200 marks)', version: '50th' } },
    update: {},
    create: {
      track: 'BCS',
      name: 'BCS Preliminary (200 marks)',
      version: '50th',
      sourceUrl: 'https://en.prothomalo.com/youth/employment/lr0bgxb7cr',
      subjects: [
        { subject: 'Bangla Language & Literature', subjectBn: 'বাংলা ভাষা ও সাহিত্য', marks: 30 },
        { subject: 'English Language & Literature', subjectBn: 'ইংরেজি ভাষা ও সাহিত্য', marks: 30 },
        { subject: 'Bangladesh Affairs', subjectBn: 'বাংলাদেশ বিষয়াবলি', marks: 25 },
        { subject: 'International Affairs', subjectBn: 'আন্তর্জাতিক বিষয়াবলি', marks: 25 },
        { subject: 'Geography, Environment & Disaster Management', subjectBn: 'ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা', marks: 10 },
        { subject: 'General Science', subjectBn: 'সাধারণ বিজ্ঞান', marks: 15 },
        { subject: 'Computer & ICT', subjectBn: 'কম্পিউটার ও তথ্যপ্রযুক্তি', marks: 15 },
        { subject: 'Mathematical Reasoning', subjectBn: 'গাণিতিক যুক্তি', marks: 20 },
        { subject: 'Mental Ability', subjectBn: 'মানসিক দক্ষতা', marks: 15 },
        { subject: 'Ethics, Values & Good Governance', subjectBn: 'নৈতিকতা, মূল্যবোধ ও সুশাসন', marks: 15 },
      ],
    },
  });

  const badges = [
    { code: 'FIRST_APPLICATION', name: 'First application', nameBn: 'প্রথম আবেদন' },
    { code: 'TEN_APPLICATIONS', name: '10 applications', nameBn: '১০টি আবেদন' },
    { code: 'STREAK_7', name: '7-day streak', nameBn: '৭ দিনের স্ট্রিক' },
    { code: 'STREAK_30', name: '30-day streak', nameBn: '৩০ দিনের স্ট্রিক' },
    { code: 'FIRST_VIVA', name: 'Reached viva', nameBn: 'ভাইভা পর্যন্ত' },
    { code: 'CIRCULAR_HERO', name: 'Verified 5 updates', nameBn: '৫টি আপডেট যাচাই' },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({ where: { code: b.code }, update: {}, create: b });
  }

  const orgs = [
    { slug: 'bpsc', name: 'Bangladesh Public Service Commission', nameBn: 'বাংলাদেশ সরকারি কর্ম কমিশন', type: 'GOVT' as const, website: 'https://bpsc.gov.bd' },
    { slug: 'bangladesh-bank', name: 'Bangladesh Bank', nameBn: 'বাংলাদেশ ব্যাংক', type: 'BANK_GOVT' as const, website: 'https://erecruitment.bb.org.bd' },
  ];
  for (const o of orgs) {
    await prisma.organization.upsert({ where: { slug: o.slug }, update: {}, create: o });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
