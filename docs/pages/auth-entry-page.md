# Auth / Entry Page Summary

## Purpose
Own the user entry flow: login, signup, auth modal behavior, session bootstrap, and profile-completion handoff.

## Current top priority
The bare live page login/signup buttons must work on:
- `https://neujeans.github.io/github-pages-react-hello/#layout`

## What belongs here
- login button behavior
- signup button behavior
- auth modal mode switching
- submit wiring for login/signup
- session bootstrap / pending auth flow
- profile completion entry/handoff

## What should not dominate this page
- apartment exploration/search UI
- broad layout editor logic
- unrelated polish

## Work pattern
1. read this summary first
2. inspect only auth-related modules/files
3. validate against bare live URL first
4. keep tests narrow to auth path
