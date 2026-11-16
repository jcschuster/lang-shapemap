# Conflicts and the overlay

`gen/ebnf2lezer.mjs` turns each production of the grammar in `spec/` (the extracted table
with `spec/deviations.ebnf`) into a Lezer rule and each terminal into a token. This file
records every conflict Lezer reports for that translation and how it is resolved, and lists
what `gen/overlay.grammar` adds. Checked with @lezer/generator 1.8.1.

## LR conflicts: none

With the deviations, the grammar is LR(1) as translated: `NodeSelector` is told apart by its
first token (`{` starts a triple pattern), and within a triple pattern `FOCUS` or a subject
term comes first. The overlay has no precedence marker in a rule and no ambiguity marker;
`node --test gen/` builds the grammar and fails on any conflict or warning.

## Tokens: the longer match first

Lezer wants an order for two tokens that may both come next where one matches a prefix of
what the other matches. The generator builds the grammar, and for each pair Lezer reports
puts the token with the longer match first, as the page states. These are the pairs it
writes at the end of `@tokens`:

- `AtpnameLn` before `"@"`, `AtStart` and `AtpnameNs`: `@ex:S`, `@START:x`, `@ex:S` versus `@ex:`.
- `Decimal` before `Integer`, `Double` before `Decimal` and `Integer`.
- Each `LangStringLiteral*` before the `StringLiteral*` it extends: `"chat"@START` is a
  language-tagged string (`spec/README.md`, "Ambiguities").
- `PnameLn` before `PnameNs`, `RdfType`, `"FOCUS"`, `"START"`, `"true"` and `"false"`:
  `FOCUS:x`, `a:b`, `true:x` are prefixed names.

No two tokens match the same text. The overlay has one `@precedence` of its own,
`BlankNodeLabel` before `"_"` (`_:b` versus `_`): no state reads `BlankNodeLabel` (below),
so Lezer reports no overlap for the generator to order, but the tokenizer still matches it
where `_` may come next.

`LANGTAG` is no token of the tree: no production uses it, only the `LANG_STRING_LITERAL*`
terminals. So the precedence of `AT_START` over `LANGTAG` that the page states needs no
entry (`spec/README.md`, discrepancy 7), and `@ex:S` is `ATPNAME_LN`, never a language tag.

## What the overlay adds

- `@top ShapeMap`, repeating the generated body of `shapeMap`.
- `@hidden subjectTerm objectTerm literal`: productions that pass one child through.
- `@unused BLANK_NODE_LABEL`: defined in the specification, used by no production. An
  `@unused` terminal stays a token, under a second top rule `Unused` that no parse starts
  from, so that Lezer keeps it; by the longest match `_:b` is that token, which no rule
  accepts, so an error (`spec/README.md`, discrepancy 3). An `@unused` production would be
  left out.
- `@skip { whitespace | LineComment }`, naming the two alternatives of `PASSED TOKENS`.
- `@precedence { BlankNodeLabel, "_" }` (above).
- The tokens `{ } _ FOCUS START ^^ ,`, declared in `@tokens` so that they are nodes of the
  tree and can be highlighted: no node around them tells them apart; the braces marked with
  each other (`closedBy`, `openedBy`) for bracket matching. `@`, `true` and `false` are no
  nodes: `ShapeLabel` and `BooleanLiteral` carry them.
- The highlighting prop source (`src/highlight.ts`).
