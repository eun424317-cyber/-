import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  name?: string
) {
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name?.trim() || email.split('@')[0] || '학습자',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('회원 정보를 불러오는 중 오류가 발생했습니다.', {
      cause: error,
    });
  }
}

export async function updateUserProfile(
  uid: string,
  data: { name: string; birthDate: string; phone: string }
) {
  try {
    const updated = await db
      .update(users)
      .set({
        name: data.name,
        birthDate: data.birthDate,
        phone: data.phone,
      })
      .where(eq(users.uid, uid))
      .returning();

    return updated[0];
  } catch (error) {
    console.error('Database update failed in updateUserProfile:', error);
    throw new Error('회원 정보 수정에 실패했습니다.', { cause: error });
  }
}
