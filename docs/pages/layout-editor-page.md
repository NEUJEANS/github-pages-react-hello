# Layout / Editor Page Summary

## Purpose
Own the authenticated layout editor flow: board state, save/restore, account-saved state, and editor interactions.

## What belongs here
- layout editor UI
- save/load board actions
- authenticated restore behavior
- board continuity after auth

## Lower priority right now
This page is not the first focus unless it directly blocks bare live login/signup button behavior.

## Work pattern
1. read this summary first
2. inspect only layout/editor modules/files
3. avoid pulling auth-entry files unless the issue crosses page boundaries
