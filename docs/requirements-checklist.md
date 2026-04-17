# Requirements Checklist

This document translates the challenge brief into verifiable repo deliverables.

## Stack And Architecture

- [x] Backend in Node.js + TypeScript
- [x] Web frontend in React + TypeScript
- [x] Relational database planned with SQLite + Prisma
- [x] Custom authentication without third parties
- [ ] Stack justified in the README

## Authentication

- [x] Registration with email + password
- [x] Login
- [x] Logout
- [x] Protected authenticated routes
- [x] Basic profile with unique username, bio, and placeholder avatar

## Tweets

- [ ] Create tweet up to 280 characters
- [ ] Delete own tweet
- [ ] Timeline with tweets from followed users
- [ ] Chronological ordering
- [ ] Pagination or infinite scroll

## Social Interactions

- [ ] Follow
- [ ] Unfollow
- [ ] Like
- [ ] Unlike
- [ ] Visible like count
- [ ] Followers and following lists on the profile

## Search

- [ ] User search by name or username

## Responsive

- [ ] Mobile-first design
- [ ] Usable on mobile
- [ ] Mobile breakpoint `<640px`
- [ ] Tablet breakpoint `640px-1024px`
- [ ] Desktop breakpoint `>1024px`

## Testing

- [ ] 80%+ backend coverage
- [x] Unit tests for models and validations
- [x] Integration tests for critical endpoints
- [ ] At least one authentication E2E flow
- [x] Frontend integration tests for login
- [ ] Frontend integration tests for create tweet
- [ ] Frontend integration tests for follow

## Seed data

- [ ] Seed with at least 10 users
- [ ] Realistic tweets
- [ ] Cross-user follows
- [ ] Cross-user likes
- [ ] App usable immediately after seeding
- [ ] Example credentials documented

## Documentation

- [ ] README with complete runbook
- [ ] Prerequisites with exact versions
- [ ] Exact installation steps
- [ ] How to run the seed
- [ ] How to run the app in development
- [ ] How to run tests
- [ ] Environment variables documented
- [ ] Technical decisions documented
- [ ] Timeline and follow graph explained
- [ ] Authentication explained
- [ ] Trade-offs and limitations documented
- [ ] AI tool usage explained

## Bonus

- [x] Model prepared for notifications
- [x] Model prepared for reply threads
- [ ] Implement at least one or two real bonus features
- [ ] Docker Compose with a single command

## Development Process

- [ ] Progressive commits without squash
- [ ] Features and tests together
- [ ] Final commits for polish and docs
