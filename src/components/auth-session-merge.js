import { buildAccountContinuityPatch } from './auth-account-continuity.js'

export function buildPostAuthContinuityPatch(result) {
  const mergedDraft = result?.data?.mergedGuestDraft ?? null
  const accountState = result?.data?.accountState ?? null

  if (!mergedDraft || mergedDraft.mode !== 'replaced') return null

  return {
    mergeMode: mergedDraft.mode,
    ...buildAccountContinuityPatch(accountState),
  }
}
