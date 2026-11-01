# Magpie Desk plan

Magpie Desk is the staff desk for Magpie Studio. Build and run it one module at a time. The look and UI components come from [magpie-studio](https://github.com/bitraveneth/magpie-studio). That repo has no database, so this desk uses Prisma Postgres.

## Chain

1. Requirement, with its own sendable link at `/r/[token]`.
2. Quotation, only from a ready requirement.
3. Contract, only from an accepted quotation.
4. Invoice, only from a signed contract.
5. Company QR or bank slip. Each invoice shows one of the two.
6. Partner link at `/p/[code]`, only when the lead comes from a partner. Commission is that partner's own rate times the paid invoice total.

A requirement link does not attach a partner and does not create commission.

## Contract number

`{FIRST}-{SECOND}-{YEAR}-{MMDD}-{CODE}`

The first two words come from the client company. Words such as Co and Ltd are skipped. If the company has no Latin words, the number uses Magpie Studio. The date is Shanghai time. Example: `SAMPLE-STUDIO-2026-1101-8F2K`.

## NDA

A person opening a requirement link can sign in with a name and email. Signing the NDA is their choice. If they want to sign it, the desk records an NDA number with the same company, year, date, and unique-code pattern, prefixed with `NDA-`. If they do not, they are still signed in and the NDA stays unsigned.

## Company

Shenzhen Magpie Technology Co., Ltd. / 深圳市喜鹊派科技有限公司. hello@magpiestudio.com. 15A-2, Financial Technology Building, 11 Keyuan Road, Nanshan, Shenzhen. Amounts default to USD and always show the currency code. Payment settings start empty.
