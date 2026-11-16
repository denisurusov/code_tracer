# UX-001 — Moderated usability study protocol

**Product:** FX Quote demo, web page at `/`
**Requirement:** REQ-UI — a user can get a quote from the web page without reading documentation.

## Participants
Five participants who price FX trades at least weekly. None has seen the page before.

## Tasks
1. Find what it would cost in USD to buy 250,000 EUR.
2. Compare the buy and sell price for 1,000,000 USD/JPY and say which is higher.
3. Enter an amount of "-100" and explain what the page tells you.

## Measures
- Task completion without help (target: 5/5 for tasks 1 and 2).
- Time on task 1 (target: under 60 seconds median).
- Findings rated by severity: 1 = blocks the task, 2 = causes an error or major delay, 3 = minor.

## Pass criterion
All tasks completed by at least 4 of 5 participants, and no open severity-1 findings.

## Record
The reviewer signs a sign-off record with `npm run signoff -- --category ux-signoff ...`.
The record references this protocol and the findings document by sha256 digest.
