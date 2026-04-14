import React from 'react'
import {
  buildAuthGuardPanelState,
  buildAuthLoginPanelState,
} from './auth-session-view-state.js'

function buildAuthModeLabels(mode = 'login') {
  return mode === 'signup'
    ? {
        badge: 'SIGN UP',
        title: '회원가입하고 추천 · 보드 · 장바구니를 한 계정으로 이어보세요',
        submitLabel: '회원가입',
        alternateLabel: '로그인으로 돌아가기',
        alternateMode: 'login',
      }
    : {
        badge: 'ACCOUNT',
        title: '로그인하고 추천 · 보드 · 장바구니를 이어서 관리하세요',
        submitLabel: '로그인',
        alternateLabel: '회원가입으로 전환',
        alternateMode: 'signup',
      }
}

function buildAuthContinuationFieldLabel(field = '') {
  switch (field) {
    case 'displayName':
      return '닉네임'
    case 'phone':
      return '연락처'
    case 'verificationCode':
      return '인증 코드'
    case 'mergeResolution':
      return '병합 기준'
    default:
      return field
  }
}

function AuthGuardView({ guardPanelState, engagement, reasons, onClose, onProceed }) {
  return (
    <>
      <div className="loginGuardCard">
        <strong>계속 이어질 내용</strong>
        <div className="loginReasonList">
          {reasons.map((reason) => <span key={reason}>{reason}</span>)}
        </div>
        <div className="guardSummary compact">
          <div><label>선택 공간</label><b>{guardPanelState.selectedSpaceCount}개</b></div>
          <div><label>추천 초안</label><b>{guardPanelState.recommendationRoom ?? '없음'}</b></div>
          <div><label>배치 아이템</label><b>{guardPanelState.layoutItemCount}개</b></div>
          <div><label>찜</label><b>{engagement.wishlistCount}개</b></div>
          <div><label>장바구니</label><b>{engagement.cartCount}개</b></div>
        </div>
        {guardPanelState.draftContextBits.length > 0 && (
          <p className="muted">{guardPanelState.draftContextBits.join(' · ')}</p>
        )}
        {guardPanelState.intentLabel && (
          <p className="muted">{guardPanelState.intentLabel}{guardPanelState.intentDraftLabel ? ` · ${guardPanelState.intentDraftLabel}` : ''}</p>
        )}
      </div>
      <div className="footerButtons stackOnMobile">
        <button className="ghost" type="button" onClick={onClose}>계속 둘러보기</button>
        <button className="cta" type="button" onClick={onProceed}>로그인 계속하기</button>
      </div>
    </>
  )
}

function AuthActionRequiredView({
  form,
  authContinuationFields,
  authContinuationPlan,
  authReadyPanelState,
  identityVerification,
  onChangeContinuationField,
  onClose,
  onResumeAuthenticatedIntent,
  onStartVerification,
  onSubmitContinuation,
}) {
  const readyDisabled = Boolean(authReadyPanelState?.primaryActionDisabled || form.status === 'submitting')

  return (
    <div className="loginForm">
      <div className="loginGuardCard authPrepCard">
        <strong>{authReadyPanelState.title}</strong>
        <p className="muted">{authReadyPanelState.subtitle}</p>
        {authReadyPanelState.intentLabel && (
          <p className="muted">{authReadyPanelState.intentLabel}{authReadyPanelState.intentDraftLabel ? ` · ${authReadyPanelState.intentDraftLabel}` : ''}</p>
        )}

        {authReadyPanelState.nextAction === 'complete-profile' && (
          <>
            <label>닉네임</label>
            <div className="inputWrap big">👤<input value={authContinuationFields.displayName} onChange={(event) => onChangeContinuationField('displayName', event.target.value)} placeholder="홍길동" /></div>
            <label>연락처</label>
            <div className="inputWrap big">📱<input value={authContinuationFields.phone} onChange={(event) => onChangeContinuationField('phone', event.target.value)} placeholder="010-1234-5678" /></div>
          </>
        )}

        {authReadyPanelState.nextAction === 'verify-email' && (
          <>
            <label>인증 코드</label>
            <div className="inputWrap big">✅<input value={authContinuationFields.verificationCode} onChange={(event) => onChangeContinuationField('verificationCode', event.target.value)} placeholder="123456" /></div>
            <div className="footerButtons stackOnMobile">
              <button className="ghost" type="button" onClick={() => onStartVerification(form.continuation ?? authReadyPanelState)}>
                본인 인증 창 열기
              </button>
            </div>
            {identityVerification?.message && (
              <p className={identityVerification.status === 'verified' ? 'statusSuccess' : 'muted'}>{identityVerification.message}</p>
            )}
          </>
        )}

        {authReadyPanelState.nextAction === 'confirm-merge-resolution' && (
          <>
            <div className="footerButtons stackOnMobile">
              <button className="ghost" type="button" onClick={() => onChangeContinuationField('mergeResolution', 'keep-guest')}>
                {authContinuationFields.mergeResolution === 'keep-guest' ? '선택됨 · 현재 초안으로 계속' : '현재 초안으로 계속'}
              </button>
              <button className="ghost" type="button" onClick={() => onChangeContinuationField('mergeResolution', 'replace-with-account')}>
                {authContinuationFields.mergeResolution === 'replace-with-account' ? '선택됨 · 계정 상태로 계속' : '계정 상태로 계속'}
              </button>
            </div>
            {authContinuationFields.mergeResolution && (
              <p className="muted">{authContinuationFields.mergeResolution === 'keep-guest' ? '현재 게스트 초안을 유지하고 이어갑니다.' : '계정에 저장된 상태를 우선 적용하고 이어갑니다.'}</p>
            )}
          </>
        )}

        {authContinuationPlan.summary.missingFields.length > 0 && (
          <p className="muted">계속하려면 {authContinuationPlan.summary.missingFields.map(buildAuthContinuationFieldLabel).join(', ')} 항목을 먼저 채워주세요.</p>
        )}
      </div>
      <div className="footerButtons stackOnMobile">
        <button className="ghost" type="button" onClick={onClose}>닫기</button>
        {authReadyPanelState.nextAction === 'complete-profile' || authReadyPanelState.nextAction === 'verify-email' || authReadyPanelState.nextAction === 'confirm-merge-resolution' ? (
          <button className="cta" type="button" disabled={readyDisabled || !authContinuationPlan.canSubmit} onClick={onSubmitContinuation}>
            {form.status === 'submitting' ? '연결 중…' : authReadyPanelState.primaryActionLabel}
          </button>
        ) : (
          <button className="cta" type="button" disabled={form.status === 'submitting'} onClick={onResumeAuthenticatedIntent}>
            {form.status === 'submitting' ? '연결 중…' : authReadyPanelState.primaryActionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function AuthCredentialsView({
  form,
  modeLabels,
  authSubmitPlan,
  authSignupPlan,
  authStatusMessage,
  authErrorSummary,
  authConnectionSummary,
  loginPanelState,
  onChangeForm,
  onDismissResume,
  onSubmit,
}) {
  const activePlan = form.mode === 'signup' ? authSignupPlan : authSubmitPlan
  const isMergeContinuationPending = form.continuation?.nextAction === 'confirm-merge-resolution'
  const allowedMergeResolutions = authErrorSummary?.allowedMergeResolutions ?? []
  const mergeResolutionLabels = {
    'keep-guest': '현재 초안으로 계속',
    'replace-with-account': '계정 상태 우선',
  }

  return (
    <>
      <div className="authModeSwitch" aria-label="인증 방식 선택">
        <button
          className={form.mode === 'login' ? 'solid mini' : 'mini'}
          type="button"
          aria-pressed={form.mode === 'login'}
          onClick={() => onChangeForm('mode', 'login')}
        >
          로그인
        </button>
        <button
          className={form.mode === 'signup' ? 'solid mini' : 'mini'}
          type="button"
          aria-pressed={form.mode === 'signup'}
          onClick={() => onChangeForm('mode', 'signup')}
        >
          회원가입
        </button>
      </div>
      {(form.intent?.label || loginPanelState.draftSaveBits.length > 0) && (
        <div className="loginBenefits">
          {form.intent?.label && (
            <div><strong>이번 로그인 목적</strong><span>{form.intent.label}{form.intent.draftLabel ? ` · ${form.intent.draftLabel}` : ''}</span></div>
          )}
          {loginPanelState.draftSaveBits.length > 0 && (
            <div><strong>이어질 보드</strong><span>{loginPanelState.draftSaveBits.join(' · ')}</span></div>
          )}
        </div>
      )}
      <div className="loginForm">
        {form.mode === 'signup' && (
          <>
            <label htmlFor="auth-display-name">이름</label>
            <div className="inputWrap big">👤<input id="auth-display-name" name="displayName" autoComplete="name" aria-label="이름" value={form.displayName} onChange={(event) => onChangeForm('displayName', event.target.value)} placeholder="홍길동" /></div>
          </>
        )}
        <label htmlFor="auth-email">이메일</label>
        <div className="inputWrap big">✉️<input id="auth-email" name="email" type="email" autoComplete="email" inputMode="email" aria-label="이메일" value={form.email} onChange={(event) => onChangeForm('email', event.target.value)} placeholder="name@example.com" /></div>
        <label htmlFor="auth-password">비밀번호</label>
        <div className="inputWrap big">🔒<input id="auth-password" name="password" type="password" autoComplete={form.mode === 'signup' ? 'new-password' : 'current-password'} aria-label="비밀번호" value={form.password} onChange={(event) => onChangeForm('password', event.target.value)} placeholder="8자 이상 입력" /></div>
        {form.mode === 'signup' && (
          <>
            <label htmlFor="auth-confirm-password">비밀번호 확인</label>
            <div className="inputWrap big">✅<input id="auth-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" aria-label="비밀번호 확인" value={form.confirmPassword} onChange={(event) => onChangeForm('confirmPassword', event.target.value)} placeholder="비밀번호를 한 번 더 입력" /></div>
            <label className="authCheckbox"><input type="checkbox" checked={form.agreeToTerms} onChange={(event) => onChangeForm('agreeToTerms', event.target.checked)} /> <span>현재 초안을 계정에 안전하게 연결하는 데 동의합니다.</span></label>
          </>
        )}
        {isMergeContinuationPending && (
          <div className="loginGuardCard authPrepCard">
            <strong>초안 병합 방향을 선택해 주세요</strong>
            <p className="muted">{authErrorSummary?.message ?? '현재 게스트 초안과 계정 상태 중 어떤 쪽을 이어갈지 선택해 주세요.'}</p>
            <div className="footerButtons stackOnMobile">
              {(allowedMergeResolutions.length > 0 ? allowedMergeResolutions : ['keep-guest', 'replace-with-account']).map((resolution) => (
                <button key={resolution} className="ghost" type="button" onClick={() => onChangeForm('mergeResolution', resolution)}>
                  {form.mergeResolution === resolution ? `선택됨 · ${mergeResolutionLabels[resolution] ?? resolution}` : (mergeResolutionLabels[resolution] ?? resolution)}
                </button>
              ))}
            </div>
          </div>
        )}
        {authStatusMessage?.body && !isMergeContinuationPending && <p className="muted">{authStatusMessage.body}</p>}
      </div>
      <div className="footerButtons stackOnMobile">
        <button
          className="ghost"
          type="button"
          aria-label={form.mode === 'login' ? '회원가입으로 전환' : '로그인으로 전환'}
          onClick={() => onChangeForm('mode', modeLabels.alternateMode)}
        >
          {modeLabels.alternateLabel}
        </button>
        {form.status === 'resume-ready' && <button className="ghost" type="button" onClick={onDismissResume}>이전 로그인 시도 지우기</button>}
        <button
          className="cta"
          type="button"
          aria-label={form.mode === 'login' ? '로그인 제출' : '회원가입 제출'}
          disabled={(!activePlan.canSubmit && !(isMergeContinuationPending && Boolean(form.mergeResolution))) || form.status === 'submitting'}
          onClick={() => onSubmit()}
        >
          {form.status === 'submitting'
            ? '준비 중…'
            : isMergeContinuationPending && form.mergeResolution
              ? (mergeResolutionLabels[form.mergeResolution] ?? form.mergeResolution)
              : modeLabels.submitLabel}
        </button>
      </div>
    </>
  )
}

export function LoginModal({ state, engagement, reasons, form, authSubmitPlan, authSignupPlan, authContinuationPlan, authContinuationFields, authStatusMessage, authErrorSummary, authConnectionSummary, authReadyPanelState, guestDraftSnapshot, identityVerification, onStartVerification, onChangeForm, onChangeContinuationField, onClose, onProceed, onDismissResume, onResumeAuthenticatedIntent, onSubmitContinuation, onSubmit }) {
  const guarded = state === 'guard'
  const modeLabels = buildAuthModeLabels(form.mode)
  const showReadyPanel = form.status === 'ready' && authReadyPanelState
  const guardPanelState = buildAuthGuardPanelState({
    engagement,
    reasons,
    guestDraftSnapshot,
    authSummary: authSubmitPlan.summary,
    connection: authConnectionSummary,
    intent: form.intent,
  })
  const loginPanelState = buildAuthLoginPanelState({
    authSummary: (form.mode === 'signup' ? authSignupPlan : authSubmitPlan).summary,
    connection: authConnectionSummary,
    intent: form.intent,
  })

  return (
    <div className="overlayLayer" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="overlayScrim" onClick={onClose} />
      <div className="loginPanel" data-auth-modal-state={guarded ? 'guard' : form.status}>
        <div className="overlayHeader">
          <span>{guarded ? '로그인 전 확인' : 'HAVENLY 로그인'}</span>
          <button className="overlayClose" type="button" onClick={onClose}>✕</button>
        </div>
        <div className="loginContent">
          <div className="loginBadge">{guarded ? 'ACCOUNT' : modeLabels.badge}</div>
          <h2 id="login-title">{guarded ? '진행 중인 작업을 로그인 후에도 이어갈까요?' : modeLabels.title}</h2>

          {guarded ? (
            <AuthGuardView
              guardPanelState={guardPanelState}
              engagement={engagement}
              reasons={reasons}
              onClose={onClose}
              onProceed={onProceed}
            />
          ) : showReadyPanel ? (
            <AuthActionRequiredView
              form={form}
              authContinuationFields={authContinuationFields}
              authContinuationPlan={authContinuationPlan}
              authReadyPanelState={authReadyPanelState}
              identityVerification={identityVerification}
              onChangeContinuationField={onChangeContinuationField}
              onClose={onClose}
              onResumeAuthenticatedIntent={onResumeAuthenticatedIntent}
              onStartVerification={onStartVerification}
              onSubmitContinuation={onSubmitContinuation}
            />
          ) : (
            <AuthCredentialsView
              form={form}
              modeLabels={modeLabels}
              authSubmitPlan={authSubmitPlan}
              authSignupPlan={authSignupPlan}
              authStatusMessage={authStatusMessage}
              authErrorSummary={authErrorSummary}
              authConnectionSummary={authConnectionSummary}
              loginPanelState={loginPanelState}
              onChangeForm={onChangeForm}
              onDismissResume={onDismissResume}
              onSubmit={onSubmit}
            />
          )}
        </div>
      </div>
    </div>
  )
}
