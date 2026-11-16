/**
 * localStorage keys scoped to the signed-in user, so AI history saved in
 * this browser is never shown to a different account on the same device.
 *   signed in  → "<base>:<userId>"
 *   signed out → "<base>" (this device's own history)
 */
export function scopedKey(base, userId) {
  return userId ? `${base}:${userId}` : base;
}
