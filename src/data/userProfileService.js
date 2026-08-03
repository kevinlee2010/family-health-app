import { supabase } from '../lib/supabase'

const tableName = 'user_profiles'

export async function loadUserProfile(userId) {
  const { data, error } = await supabase
    .from(tableName)
    .select('profile_data')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.profile_data || null
}

export async function saveUserProfile(userId, profileData) {
  const { error } = await supabase.from(tableName).upsert(
    {
      user_id: userId,
      profile_data: profileData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    throw error
  }
}

export async function deleteUserProfile(userId) {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}
