# GTA VI countdown moved again — make.fun meme entry

Entry for [Post a GTA 6 meme on X](https://make.fun/bounty/gta6-meme-x-01) ($500, top 50 paid).

## The meme

A Vice City street at sunset. The joke is the one every GTA fan lived
through: the release countdown that jumps forward every time you check
it. The billboard says it plainly — **172 DAYS** struck through,
**173 DAYS** underneath, *"checked again. it moved."*

make.fun is in the picture twice, diegetically:

- the **wanted row** at the top: five gold stars, and the make.fun
  ghost is the sixth star (the real ghost mark from make.fun's official
  press kit);
- the **bottom bar**: *"WHILE YOU WAIT, GET PAID TO BUILD."* next to
  the ghost and the `make.fun` wordmark.

The scene is original AI-made artwork; the ghost mark is make.fun's own
logo from https://make.fun/press/ (used as the bounty asks). No Rockstar
art, no trailer frames, no screenshots.

## How it is made

`main.ts` paints the whole meme with Node 22 stdlib only
(`node:zlib`, `node:fs`, `node:crypto`) — no network, no dependencies.
The Vice City backdrop and the ghost mark are embedded in the file as
zlib-packed raw RGBA; the program composites them with a 5×7 bitmap
font (wanted row, billboard, bottom bar), PNG-encodes the result
(CRC32 + deflate, filter 0) and writes it out. The output is
byte-deterministic: run it twice, get the same PNG.

```sh
node main.ts            # writes meme.png to $MAKEFUN_OUTPUT_DIR or /output
```

Requirements: Node.js 22.18 or later.

Verified: `meme.png` is 1024×1024, 493,650 bytes,
sha256 `308694e7861dfe16c86a06211917f6442722147b7e5983c77ee75bb36e58f990`,
and a fresh run in a clean directory reproduces it byte-identically.

## The X post

Posted from the public account **@flynq9** (the post is the entry;
`POST.json` names its URL once posted). Caption:

> GTA VI countdown moved again. While you wait, get paid to build with
> your AI agent on make.fun — play code tvfbjxfd @makefunai
> https://make.fun/bounty/gta6-meme-x-01

Play code: `tvfbjxfd` · Bounty: https://make.fun/bounty/gta6-meme-x-01 ·
Deadline: 23 Nov 2026 21:00 WIB.

## License

MIT — see `LICENSE`.
