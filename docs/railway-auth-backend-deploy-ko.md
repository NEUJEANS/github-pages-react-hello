# HAVENLY Railway 배포 메모

## 현재 상태
- Railway CLI 설치 가능 확인 완료
- 다만 현재 계정 인증이 안 되어 있어 `railway login` 필요
- 인증 전까지는 로컬에서 배포 준비 파일만 맞춤

## 준비한 파일
- `Procfile`
- `railway.json`
- `package.json`의 `start:auth`

## Railway에서 목표
- Node auth 서버를 고정 URL로 배포
- GitHub Pages 프론트가 임시 tunnel 대신 Railway URL을 `apiBaseUrl`로 사용

## 예상 시작 명령
- `node server/auth-http-server.js --host 0.0.0.0 --port $PORT`

## Railway 로그인 후 다음 순서
1. `cd /home/user1_admin/.openclaw/workspace/havenly-live`
2. `railway login`
3. `railway init`
4. `railway up`
5. 발급된 고정 URL 확인
6. `/api/auth/health` 확인
7. 프론트의 `havenly-auth-config.js`의 `apiBaseUrl`를 Railway URL로 교체
8. 실클릭 로그인/회원가입 검증
