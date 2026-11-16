# lang-shapemap

Editor language support for [ShapeMap](https://shex.io/shape-map/), the notation that pairs
RDF nodes with ShEx shapes: [`codemirror-lang-shapemap`](packages/codemirror-lang-shapemap),
a CodeMirror 6 language whose Lezer grammar is generated from the grammar (section 6) of
ShapeMap Structure and Language, Draft Community Group Report 13 July 2017. Changes are in
[CHANGELOG.md](CHANGELOG.md).

## Layout

- `spec/`: the grammar table extracted from the report (`shapemap-2017.ebnf`), the
  deviations from it (`deviations.ebnf`), its notation, discrepancies, deviations and
  candidates (`README.md`), and the pinned report (`SOURCE`).
- `gen/`: `fetch.mjs` downloads the report, checks its sha256 and extracts the grammar;
  `ebnf2lezer.mjs` writes the Lezer grammar from `spec/` and `overlay.grammar`;
  `CONFLICTS.md` explains the overlay. `node --test gen/` tests the generator.
- `fixtures/valid/`: ShapeMaps the grammar reads; `fixtures/invalid/`: ShapeMaps outside it,
  each with a `# invalid:` line giving the reason and a `# shex.js:` line recording whether
  shex.js accepts it. Each fixture's header names its source: the report's examples,
  rudof's example maps (MIT, `fixtures/rudof-LICENSE-MIT`), or hand-written.
- `packages/codemirror-lang-shapemap/`: the package.

## Working on it

The devshell (`nix develop`, or direnv) has every tool. Then:

```sh
pnpm install
pnpm generate                  # writes the grammar
.github/scripts/test-all.sh    # every check CI runs
```

Generated files are committed, and `pnpm generate` leaves a clean tree. `node gen/fetch.mjs`
downloads the pinned report, checks its sha256 and rewrites `spec/shapemap-2017.ebnf`.
`pnpm test` runs the generator's tests, `.github/scripts/check-fixtures.mjs` (the shex.js
ShapeMap parser, npm `shape-map`, must accept each valid fixture, and the `# shex.js:` line
of each invalid one must hold, as must what the names of the cases in the package's
`test/ambiguities.txt` say shex.js does) and the package's tests.

A new report is worked into `spec/` by hand: `reference.yml` checks every Sunday which
report https://shex.io/shape-map/ serves, and opens an issue when it is not the one
`spec/SOURCE` pins, or when `gen/fetch.mjs` no longer writes `spec/shapemap-2017.ebnf` as
committed from the pinned one.

## Releasing

A release is a merged pull request labelled `release`: `release.yml` then stages the package
on npm and creates the GitHub release `vX.Y.Z`, using the version's CHANGELOG section as
release notes. To make one, run `.github/scripts/version.sh X.Y.Z`, add a
`## [X.Y.Z] - date` section to `CHANGELOG.md`, open a pull request and label it `release`.

## Licence

MIT; see [LICENSE](LICENSE). The grammar is derived from the ShapeMap report and from rows it
restates from W3C Recommendations; the rudof fixtures are rudof's; see [NOTICE](NOTICE).
