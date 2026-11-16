# Changelog

All notable changes to `codemirror-lang-shapemap` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html) over what the package exposes:
node names and the exported JavaScript API.

The ShapeMap report the grammar is generated from is recorded in `package.json` under
`shapemap.specification`; it moves when the report does, not when the package does.

## [Unreleased]

## [0.1.2] - 2026-11-16

### Added

- Tokens `"^^"` and `","` in the tree, highlighted as an operator and a separator.
- `closedBy`/`openedBy` on `{` and `}`, so that bracket matching follows the tree instead of
  scanning the text.

## [0.1.1] - 2026-11-16

## Changed

- No changes

## [0.1.0] - 2026-11-16

### Added

- `codemirror-lang-shapemap`: a CodeMirror 6 language (Lezer parser) for ShapeMap, generated
  from section 6 of ShapeMap Structure and Language, Draft Community Group Report
  13 July 2017, with highlighting and completion of `FOCUS` and `START`. Deviations from
  the report: `a` as the predicate of a triple pattern instead of a subject term, and
  prefixed names, also directly after `@`.
