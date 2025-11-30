import { supabase } from "@/lib/supabase";
import { getCurrentAuthUser } from "@/lib/auth";
import { User, ApiResponse } from "@/types";

/**
 * Get the current user's profile data from Supabase
 * This queries the same 'profiles' table that the web app uses
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  try {
    // Get authenticated user from Supabase Auth
    const { user, error: authError } = await getCurrentAuthUser();
    
    if (authError || !user) {
      return {
        data: null as any,
        error: authError?.message || 'Not authenticated',
      };
    }

    // Get profile from profiles table (same table as web app)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // If profile doesn't exist, return user data from auth
      if (profileError.code === 'PGRST116') {
        return {
          data: {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email || '',
            avatar: user.user_metadata?.avatar_url || undefined,
          } as User,
        };
      }
      
      return {
        data: null as any,
        error: profileError.message,
      };
    }

    // Map Supabase profile to mobile app User type
    return {
      data: {
        id: profile.id,
        email: profile.email || user.email || '',
        name: profile.full_name || user.user_metadata?.full_name || profile.email || '',
        avatar: profile.avatar_url || undefined,
      } as User,
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return {
      data: null as any,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update user profile in Supabase
 * Updates the same 'profiles' table that the web app uses
 */
export async function updateUserProfile(
  updates: Partial<User>
): Promise<ApiResponse<User>> {
  try {
    const { user, error: authError } = await getCurrentAuthUser();
    
    if (authError || !user) {
      return {
        data: null as any,
        error: authError?.message || 'Not authenticated',
      };
    }

    // Map mobile app User type to Supabase profile fields
    const profileUpdates: Record<string, any> = {};
    if (updates.name !== undefined) {
      profileUpdates.full_name = updates.name;
    }
    if (updates.avatar !== undefined) {
      profileUpdates.avatar_url = updates.avatar;
    }
    if (updates.email !== undefined) {
      profileUpdates.email = updates.email;
    }

    // Update profile in Supabase
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return {
        data: null as any,
        error: updateError.message,
      };
    }

    // Map back to mobile app User type
    return {
      data: {
        id: updatedProfile.id,
        email: updatedProfile.email || user.email || '',
        name: updatedProfile.full_name || updatedProfile.email || '',
        avatar: updatedProfile.avatar_url || undefined,
      } as User,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      data: null as any,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
