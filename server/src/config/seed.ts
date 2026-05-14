import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const SEED_EMAIL = process.env.SEED_EMAIL || 'admin@plotweaver.com';
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'admin123';

export const seedDefaultUser = async () => {
  try {
    const existing = await User.findOne({ email: SEED_EMAIL });
    if (existing) {
      if (!existing.password) {
        existing.password = await bcrypt.hash(SEED_PASSWORD, 10);
        await existing.save();
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
    await User.create({
      authorId: `auth_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: 'Admin',
      email: SEED_EMAIL,
      password: hashedPassword,
      globalSettings: { theme: 'dark', canvasGrid: true },
      authorLibrary: { globalTags: [], globalCharacters: [] }
    });
    console.log(`Created default user: ${SEED_EMAIL} / ${SEED_PASSWORD}`);
  } catch (error) {
    console.error('Error seeding default user:', error);
  }
};
