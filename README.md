# Magpie Desk

Staff desk for Magpie Studio paperwork. The chain is a requirement, a quotation, a contract, and an invoice. Each invoice shows either the company payment QR or a bank slip. A requirement has its own link. A partner link is separate and optional.

The look comes from the Magpie Studio site: cream `#f6f2ea`, ink `#0f0f0f`, purple `#5c2d91`, Urbanist, and the Magpie logo.

## Run

```bash
npm install
cp .env.example .env
# Put the Prisma Postgres URLs in .env. Do not commit .env.
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000. The admin desk asks for the username and password in `.env` (`ADMIN_USERNAME` and `ADMIN_PASSWORD`). Requirement links (`/r/...`) and partner links (`/p/...`) stay open without that login.

`DATABASE_URL` is the pooled connection. `DIRECT_URL` is the direct connection used for migrations.

## Contract numbers

A contract number is the client company's first two words, the year, the Shanghai date, and a unique code:

`MAGPIE-STUDIO-2026-1101-8F2K`

If the client company is blank, the number uses Magpie Studio. An NDA uses the same pattern with an `NDA-` prefix.

## NDA

On a requirement link, a person can sign in with their name and email. The NDA is optional: they check "I want to sign the NDA" or they sign in without it. Staff can offer the NDA before the client arrives.

## Documents

Company lines on documents are Shenzhen Magpie Technology Co., Ltd. / 深圳市喜鹊派科技有限公司, hello@magpiestudio.com, Nanshan, Shenzhen. Amounts show a currency code and default to USD.
