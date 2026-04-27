import { supabase } from "../lib/supabaseClient";

export async function inviteUserToCollection({
  collectionId,
  email,
  role = "viewer"
}) {
  // 1. Add user to collection
  const { error: insertError } = await supabase
    .from("user_collections")
    .insert({
      collection_id: collectionId,
      email,
      role
    });

  if (insertError) {
    console.error("Invite error:", insertError);
    return { success: false };
  }

  // 2. Mark collection as collaborative
  const { error: updateError } = await supabase
    .from("collections")
    .update({ is_collab: true })
    .eq("id", collectionId);

  if (updateError) {
    console.error("Update collab error:", updateError);
  }

  return { success: true };
}
