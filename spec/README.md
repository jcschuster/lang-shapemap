# spec

The grammar of ShapeMap Structure and Language, Draft Community Group Report 13 July 2017
(section 6, "ShapeMap grammar"), as `SOURCE` records it. The generator in `gen/` reads these
files; nothing else in the repository is a source of grammar facts.

- `shapemap-2017.ebnf`: the grammar table of the page, extracted by `gen/fetch.mjs`, one
  production per table row, as the page renders it (HTML comments removed). Not edited by
  hand: `node gen/fetch.mjs` downloads the page, checks its sha256 and rewrites the file.
- `deviations.ebnf`: hand-written productions that replace the extracted ones of the same
  name or add new ones; each is an item of "Deviations" below.
- `SOURCE`: URL, status, sha256, fetch date and spec-repository commit of the page.

The HTML is not in the repository.

## Notation

Both `.ebnf` files use the XML-EBNF of the page, as printed:

- `[number] name ::= expression`, with the page's number (`[]` for a production of
  `deviations.ebnf` that has none). Further lines of an expression are indented. Lines
  starting with `#` are comments.
- `<NAME>` is a terminal (a token); `PASSED TOKENS` is what may appear between any two
  tokens. Other names are productions.
- `'x'` and `"x"` match exactly that text; the grammar does not say that any of them match
  in another case.
- `[...]` and `[^...]` are character sets, with ranges `a-z` and code points `#xHEX` or, as
  the page writes them, `#HEX`; `\\`, `\"`, `\'`, `\n`, `\r`, `\t` are escapes in strings
  and sets.
- `|` alternative, juxtaposition sequence, `( )` grouping, `?` `*` `+` repetition.

The letter after a number names the grammar the row is restated from: `t` RDF 1.1 Turtle,
`s` SPARQL 1.1, `x` ShEx 2.0. Rows without a letter are ShapeMap's own: [1]–[7] and [17].

## How the generator reads these files

`gen/ebnf2lezer.mjs` (conflicts and the overlay: `gen/CONFLICTS.md`):

- The top rule is `shapeMap`, the node `ShapeMap`.
- Each production becomes a node named in CamelCase (`shapeAssociation` ->
  `ShapeAssociation`), except `subjectTerm`, `objectTerm` and `literal`, which only pass one
  child through.
- A terminal that a production names becomes a token named in CamelCase (`IRIREF` ->
  `Iriref`, `PNAME_LN` -> `PnameLn`, `LANG_STRING_LITERAL2` -> `LangStringLiteral2`); the
  others (`UCHAR`, `PN_LOCAL`, `LANGTAG`, ...) only help define them. `PASSED TOKENS` becomes
  `whitespace` and `LineComment`. The keywords and punctuation of the productions (`FOCUS`,
  `START`, `_`, `@`, `{`, ...) are tokens of that text.
- Where two tokens may come next and one matches a prefix of the other, the longer match
  wins, as the page states ("Text is matched against the longest matching terminal").
- A terminal that no production uses (`@unused` in the overlay) stays a token, under a
  second top rule `Unused` that no parse starts from: under the longest match its text is
  that token, which no rule accepts, so an error (`_:b`, discrepancy 3).
- Node names shared with lang-shex, which is generated from ShEx 2.1 the same way: `Iri`,
  `PrefixedName`, `Predicate`, `RdfType`, `RdfLiteral`, `String`, `LangString`,
  `NumericLiteral`, `BooleanLiteral`, the tokens `Iriref`, `PnameLn`, `PnameNs`, `AtpnameLn`,
  `AtpnameNs`, `BlankNodeLabel`, `Integer`, `Decimal`, `Double`, `StringLiteral1`,
  `StringLiteral2`, `StringLiteralLong1`, `StringLiteralLong2`, `LangStringLiteral1` ...
  `LangStringLiteralLong2`, and `LineComment`. One difference: the datatype after `^^` is
  `RdfLiteral(String, Iri)` here, as `rdfLiteral` [65x] has `iri`, and
  `RdfLiteral(String, Datatype(Iri))` in lang-shex, whose grammar has `datatype`; the
  highlighting tags both alike.

## Discrepancies in the source

Found while reading the page and testing the grammar. Items marked **deviation** are where the
grammar read here differs from the extracted table.

1. The page's Example 3, `{FOCUS a <http://schema.example/Some/Type>}@START`, does not parse:
   the predicate of `triplePattern` [6] is `iri`, and `'a'` is an alternative of
   `subjectTerm` [4], so `a` may be a node but not a predicate. The editor's draft
   (shexSpec/shape-map d02943b5) adds `predicate ::= iri | RDF_TYPE` and drops `'a'` from
   `subjectTerm`. **Deviation** D1.
2. Prefixed names are in HTML comments: the `prefixedName` alternative of `iri` [136s],
   `prefixedName` [137s], `PNAME_NS` [140s], `PNAME_LN` [141s], and in `shapeLabel` [7]
   `ATPNAME_NS` [70] and `ATPNAME_LN` [71] (with a second, also commented-out pair
   `AT_PNAME_NS` [15], `AT_PNAME_LN` [16]). shex.js and rudof accept prefixed names; no
   example of the page uses one. **Deviation** D2.
3. `BLANK_NODE_LABEL` [142s] is defined, but its alternative in `subjectTerm` is in an HTML
   comment, so no production uses it. Kept in the grammar and marked unused (`@unused` in
   the overlay), and so a token that no rule accepts: by the longest match `_:b` is one
   `BLANK_NODE_LABEL`, so `{_:b FOCUS}@<S>` and `_:b@<S>` are errors, not the wildcard `_`
   and the prefixed name `:b`; `{_ :b FOCUS}@<S>` parses. See "Candidates". The `PN_*`
   terminals are used only through D2.
4. Example 2, `<http://data.example/#n1> @ <http://data.example/#S2>,`, ends in a comma,
   which `shapeMap` [1] does not allow. Not a deviation (decided by Johannes 2026-11-16);
   see "Candidates". `fixtures/invalid/spec-example-2.shapemap` records it.
5. Example 1 is a JSON ShapeMap, not the compact syntax (and not well-formed JSON: its IRI
   strings are not closed). Not a fixture.
6. Section 3 defines the members status, reason and appInfo of a shape association, but
   their productions, `status` [8], `reason` [9] and `jsonAttributes` [10]–[14], are in HTML
   comments. See "Candidates".
7. The page states that `AT_START` "has precendence over LANGTAG" (sic). No production
   uses `LANGTAG`; it occurs only inside the `LANG_STRING_LITERAL*` terminals. A tokenizer
   that tries only the tokens a production may use next never reads a lone `LANGTAG`, so
   `<n>@START` is `AT_START` either way; the precedence would matter only for a tokenizer
   that tries every terminal everywhere.
8. The grammar writes the keywords `"FOCUS"`, `"START"`, `"@START"`, `"true"` and `"false"`
   in one case and, unlike ShEx and SPARQL, does not say that they match in any case. Read
   as written; shex.js matches `FOCUS`, `START` and `@START` in any case. See "Candidates".
9. `PASSED TOKENS` are whitespace and `#` comments; shex.js also skips `/* */` comments. See
   "Candidates".
10. Notation: the sets of `STRING_LITERAL_LONG1` [158s] (`[^\\'\\]`) and `ECHAR` [160s]
    (`[tbnrf\\\"\\']`) name the backslash twice, and `IRIREF` [18t] writes `#0000- ` for the
    range from U+0000 to the space. The generator reads them as written and merges repeated
    characters.

## Deviations

- **D1**, decided by Johannes 2026-11-16: `a` (rdf:type) is a predicate of a triple pattern
  and no longer a subject term, as in the editor's draft: `subjectTerm ::= iri`, the
  predicate of `triplePattern` is `predicate ::= iri | RDF_TYPE`, `<RDF_TYPE> ::= "a"`.
  Example 3 parses. `a@<S>` is an error, as in shex.js.
- **D2**, decided by Johannes 2026-11-16: prefixed names, with the rows the page has in HTML
  comments: `iri ::= IRIREF | prefixedName`, `prefixedName ::= PNAME_LN | PNAME_NS`, and
  `ATPNAME_NS` and `ATPNAME_LN` in `shapeLabel`, so `<n>@ex:S` needs no space after `@`, as
  in shex.js and rudof.

## Ambiguities between longest match and shex.js

Read here by the longest match, as the page states; shex.js (npm `shape-map` 1.1.0) tries
its tokens in a fixed order and takes the first that matches. Each is a case of
`packages/codemirror-lang-shapemap/test/ambiguities.txt`, whose name says what shex.js does,
and `.github/scripts/check-fixtures.mjs` checks that.

Rejected here, accepted by shex.js:

- `{FOCUS:p <o>}@<S>`: `FOCUS:p` is a prefixed name, the subject, so the triple pattern
  lacks a term. shex.js reads `FOCUS` and the predicate `:p`.
- `"chat"@START`: `LANG_STRING_LITERAL2` with the language tag `START`, and then no shape
  label. shex.js reads the string `"chat"` and the shape label `@START`. With a space,
  `"chat" @START` or `"chat"@ START`, the shape label is `START` here too.
- `"chat"@ex:S`, also `'chat'@ex:S` and `"""chat"""@ex:S`: the language-tagged string
  `"chat"@ex` and then the prefixed name `:S`, which is no shape label. shex.js reads the
  string and the shape label `@ex:S`. For both, the package's completion offers no `START`
  right after a string and its `@`.

Accepted here, rejected by shex.js:

- `FOCUS:x@<S>`, and after `@ `, `START:x`: prefixed names. shex.js reads the keyword
  first. `a:b`, `true:x` and `false:x` are prefixed names in both.
- `{FOCUS: <p> FOCUS}@<S>`: `FOCUS:` is a `PNAME_NS`, the subject. shex.js reads `FOCUS`
  and then the prefixed name `:`, which leaves a term too many.
- `<n>@START:` and `<n>@START:x`: `ATPNAME_NS` and `ATPNAME_LN` with the prefix `START`.
  shex.js reads `@START` and then a prefixed name, which no shape label takes.

Accepted here, rejected by shex.js, whose first match is a token the grammar does not
have:

- `EX:n@<S>` and `<n>@ EX:S`: prefixed names. shex.js takes `EX` for the name of an
  extension node selector (`[A-Z][A-Z0-9_]+`, see "Candidates").
- `FOCUSED:x@<S>`: a prefixed name. shex.js reads `FOCUS`, then `ED` as an extension name.
- `{FOCUS a_}@<S>`: the predicate `a` and the wildcard `_`, as no terminal matches `a_`.
  shex.js reads `a_` as one word, which it rejects.

## Candidates

Accepted by shex.js (npm `shape-map` 1.1.0, as `fixtures/invalid/` records it), not part of
this grammar: decided by Johannes 2026-11-16. Such text gets error nodes.

- Status `!` and `?` after `@` (`status` [8], in HTML comments).
- Reason `/ "…"` (`reason` [9], in HTML comments).
- JSON appinfo `$appinfo: …` (`jsonAttributes` [10]–[14], in HTML comments).
- Node selectors that run a query: `SPARQL "…"`, any upper-case name and a string, an IRI
  and a string.
- A trailing comma, although Example 2 has one.
- A blank node as node selector (`BLANK_NODE_LABEL`).
- Keywords in any case: `focus`, `start`, `@start`.
- `/* */` comments.
- An empty map (only whitespace and comments).
- A prefixed name ending in `.` (shex.js; Turtle's and this `PN_LOCAL` [169s] cannot end so).
- Whitespace between a string and its language tag.

## Editor's draft

The editor's draft (https://shexspec.github.io/shape-map/, shexSpec/shape-map d02943b5,
2019-05-09) was never published as a report. Against the 2017 grammar it renames
`nodeSelector` to `nodeSpec` and `shapeLabel` to `shapeSpec`, adds `predicate` and
`RDF_TYPE`, and has `BLANK_NODE_LABEL` instead of `'a'` in `subjectTerm`. Only D1 is taken
from it; the names stay those of the report.

## Redistribution

The report is published under the W3C Community Contributor License Agreement, which allows
derivative works (§2.1) on condition of an attribution to the specification with its name
and version (§2.2). The rows restated from RDF 1.1 Turtle and SPARQL 1.1 come from W3C
Recommendations under the W3C Document License, which allows derivative works in software
with its notice. `NOTICE` has both.
