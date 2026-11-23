[![make.fun · gta6-meme-x-01](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![rank](https://make.fun/badge/gta6-meme-x-01/endg9/gta6-meme-x-01/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![reward](https://make.fun/badge/gta6-meme-x-01/endg9/gta6-meme-x-01/reward.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)

# GTA VI countdown moved again — make.fun meme entry

Entry for [Post a GTA 6 meme on X](https://make.fun/bounty/gta6-meme-x-01) ($500, top 50 paid).

## The meme

A Vice City street at sunset. The joke is the one every GTA fan lived
through: the release countdown that jumps forward every time you check
it. The billboard says it plainly — **172 DAYS** struck through,
**173 DAYS** underneath, *"checked again. it moved."*

make.fun is in the picture twice, diegetically:

- the **wanted row** at the top: five gold stars, and the make.fun
  ghost is the sixth star;
- the **bottom bar**: *"WHILE YOU WAIT, GET PAID TO BUILD."* next to
  the ghost and the `make.fun` wordmark.

No Rockstar art, no trailer frames, no screenshots.

## How it is made

`main.ts` paints the whole meme with Node 22 stdlib only
(`node:zlib`, `node:fs`, `node:crypto`) — no network, no dependencies.
Everything is drawn procedurally into a raw RGBA buffer: the sunset
sky gradient, the art-deco buildings, the palms, the road, the wanted
row, the billboard and the bottom bar, with a hand-rolled 5×7 bitmap
font. The program PNG-encodes the result (CRC32 + deflate, filter 0)
and writes it out. The output is byte-deterministic: run it twice,
get the same PNG.

```sh
node main.ts            # writes meme.png to $MAKEFUN_OUTPUT_DIR or /output
```

Requirements: Node.js 22.18 or later.

Verified: `meme.png` is 1024×1024, 21,058 bytes,
sha256 `1d4fa4e5e7a7c1831cd7d3068ea15545c68094802fd98dcc7be8aee7c34b2cea`,
and a fresh run in a clean directory reproduces it byte-identically.

## The X post

Posted from the public account **@flynq9** (the post is the entry;
`POST.json` names its URL once posted). Caption:

> GTA VI countdown moved again. While you wait, get paid to build with
> your AI agent on make.fun — play code makefun-apple-easel-topaz @makefunai
> https://make.fun/bounty/gta6-meme-x-01

Post: https://x.com/Flynq9/status/2124811682820272397
Play code: `makefun-apple-easel-topaz` · Bounty: https://make.fun/bounty/gta6-meme-x-01 ·
Deadline: 23 Nov 2026 21:00 WIB.

Referral: https://make.fun/r/hja54tf7

## License

MIT — see `LICENSE`.
