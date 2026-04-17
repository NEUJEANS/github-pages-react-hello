import { z } from 'zod'

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeOptionalText(value) {
  const normalized = trimString(value)
  return normalized || null
}

const credentialModeSchema = z.enum(['include', 'same-origin', 'omit'])
const endpointOverrideSchema = z.string().trim().min(1)
const authPayloadSchema = z.object({
  handoffId: z.unknown().optional(),
  resumeToken: z.unknown().optional(),
  nextAction: z.unknown().optional(),
  status: z.unknown().optional(),
  statusLabel: z.unknown().optional(),
  connection: z.unknown().optional(),
  actionConnection: z.unknown().optional(),
  continuationFields: z.unknown().optional(),
  draftSave: z.unknown().optional(),
  guestDraftSummary: z.unknown().optional(),
}).passthrough()
const authConnectionSchema = z.object({
  method: z.unknown().optional(),
  endpoint: z.unknown().optional(),
  resolvedUrl: z.unknown().optional(),
  targetLabel: z.unknown().optional(),
  isExternal: z.boolean().optional(),
  isSameOriginScaffold: z.boolean().optional(),
  credentialsMode: z.unknown().optional(),
  source: z.unknown().optional(),
}).passthrough()
const guestDraftSummarySchema = z.object({
  apartmentLabel: z.unknown().optional(),
  apartmentSelectionId: z.unknown().optional(),
  selectedRoomCount: z.number().int().nonnegative().optional(),
  selectedRooms: z.array(z.string()).optional(),
  selectedSpaceIds: z.array(z.string()).optional(),
  recommendationRoom: z.unknown().optional(),
  wishlistCount: z.number().int().nonnegative().optional(),
  cartCount: z.number().int().nonnegative().optional(),
  layoutItemCount: z.number().int().nonnegative().optional(),
}).passthrough()
const authConfigSchema = z.object({
  apiBaseUrl: z.string(),
  currentOrigin: z.string(),
  appBasePath: z.string(),
  loginEndpoint: z.string(),
  signupEndpoint: z.string(),
  sessionEndpoint: z.string(),
  pendingEndpoint: z.string(),
  continueEndpoint: z.string(),
  logoutEndpoint: z.string(),
  credentialsMode: credentialModeSchema,
  allowLoopbackProbe: z.boolean(),
  loopbackProbeBlockedReason: z.string(),
  source: z.string(),
  isConfigured: z.boolean(),
})

export function normalizeCredentialMode(value, fallback = '') {
  const parsed = credentialModeSchema.safeParse(trimString(value))
  return parsed.success ? parsed.data : fallback
}

export function normalizeEndpointOverride(value, fallback = '/api/auth/login') {
  const parsed = endpointOverrideSchema.safeParse(value)
  if (!parsed.success) return fallback

  return /^https?:\/\//.test(parsed.data)
    ? parsed.data
    : (parsed.data.startsWith('/') ? parsed.data : `/${parsed.data}`)
}

export function normalizeApiBaseUrl(value) {
  const normalized = trimString(value)
  if (!normalized) return ''
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

export function normalizeAuthConnection(value, fallback = null) {
  const parsed = authConnectionSchema.safeParse(value)
  if (!parsed.success) return fallback

  const method = normalizeOptionalText(parsed.data.method)
  const endpoint = normalizeOptionalText(parsed.data.endpoint)
  const resolvedUrl = normalizeOptionalText(parsed.data.resolvedUrl)
  const targetLabel = normalizeOptionalText(parsed.data.targetLabel)
  const credentialsMode = normalizeOptionalText(parsed.data.credentialsMode)
  const source = normalizeOptionalText(parsed.data.source)
  const hasExplicitBooleans = Object.hasOwn(parsed.data, 'isExternal') || Object.hasOwn(parsed.data, 'isSameOriginScaffold')
  const hasAnyValue = Boolean(method || endpoint || resolvedUrl || targetLabel || credentialsMode || source || hasExplicitBooleans)

  if (!hasAnyValue) return fallback

  const isSameOriginScaffold = parsed.data.isSameOriginScaffold ?? targetLabel === 'same-origin /api auth scaffold'
  const isExternal = parsed.data.isExternal ?? Boolean(targetLabel && targetLabel !== 'same-origin /api auth scaffold')

  return {
    method,
    endpoint,
    resolvedUrl,
    targetLabel,
    isExternal,
    isSameOriginScaffold,
    credentialsMode,
    source,
  }
}

export function normalizeGuestDraftSummary(value, fallback = null) {
  const parsed = guestDraftSummarySchema.safeParse(value)
  if (!parsed.success) return fallback

  const apartmentSelectionId = normalizeOptionalText(parsed.data.apartmentSelectionId)

  return {
    apartmentLabel: normalizeOptionalText(parsed.data.apartmentLabel),
    ...(apartmentSelectionId ? { apartmentSelectionId } : {}),
    selectedRoomCount: parsed.data.selectedRoomCount ?? 0,
    selectedRooms: Array.isArray(parsed.data.selectedRooms) ? [...parsed.data.selectedRooms] : [],
    selectedSpaceIds: Array.isArray(parsed.data.selectedSpaceIds) ? [...parsed.data.selectedSpaceIds] : [],
    recommendationRoom: normalizeOptionalText(parsed.data.recommendationRoom),
    wishlistCount: parsed.data.wishlistCount ?? 0,
    cartCount: parsed.data.cartCount ?? 0,
    layoutItemCount: parsed.data.layoutItemCount ?? 0,
  }
}

export function normalizeAuthPayload(value) {
  const parsed = authPayloadSchema.safeParse(value)
  if (!parsed.success) return value

  return {
    ...parsed.data,
    ...(normalizeOptionalText(parsed.data.handoffId) ? { handoffId: normalizeOptionalText(parsed.data.handoffId) } : {}),
    ...(normalizeOptionalText(parsed.data.resumeToken) ? { resumeToken: normalizeOptionalText(parsed.data.resumeToken) } : {}),
    ...(normalizeOptionalText(parsed.data.nextAction) ? { nextAction: normalizeOptionalText(parsed.data.nextAction) } : {}),
    ...(normalizeOptionalText(parsed.data.status) ? { status: normalizeOptionalText(parsed.data.status) } : {}),
    ...(normalizeOptionalText(parsed.data.statusLabel) ? { statusLabel: normalizeOptionalText(parsed.data.statusLabel) } : {}),
    ...(normalizeAuthConnection(parsed.data.connection) ? { connection: normalizeAuthConnection(parsed.data.connection) } : {}),
    ...(normalizeAuthConnection(parsed.data.actionConnection) ? { actionConnection: normalizeAuthConnection(parsed.data.actionConnection) } : {}),
    ...(parsed.data.continuationFields && typeof parsed.data.continuationFields === 'object' && !Array.isArray(parsed.data.continuationFields)
      ? { continuationFields: JSON.parse(JSON.stringify(parsed.data.continuationFields)) }
      : {}),
    ...(parsed.data.draftSave && typeof parsed.data.draftSave === 'object' && !Array.isArray(parsed.data.draftSave)
      ? { draftSave: JSON.parse(JSON.stringify(parsed.data.draftSave)) }
      : {}),
    ...(normalizeGuestDraftSummary(parsed.data.guestDraftSummary) ? { guestDraftSummary: normalizeGuestDraftSummary(parsed.data.guestDraftSummary) } : {}),
  }
}

export function normalizeAuthConfigResult(value) {
  return authConfigSchema.parse(value)
}
