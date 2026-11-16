import {shapemapLanguage} from "../dist/index.js"
import {getStyleTags, highlightTree, tagHighlighter, tags as t} from "@lezer/highlight"
import {fileTests} from "@lezer/generator/dist/test"
import assert from "assert"
import * as fs from "fs"
import * as path from "path"
import {fileURLToPath} from "url"

const here = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.join(here, "..", "..", "..", "fixtures")
const parse = text => shapemapLanguage.parser.parse(text)
const read = (dir, file) => fs.readFileSync(path.join(fixtures, dir, file), "utf8")
const shapemaps = dir => fs.readdirSync(path.join(fixtures, dir)).filter(file => file.endsWith(".shapemap")).sort()

function errors(text) {
  const found = []
  parse(text).iterate({enter: node => { if (node.type.isError) found.push(node.from) }})
  return found
}

describe("fixtures", () => {
  for (const file of shapemaps("valid"))
    it(`valid/${file} parses without error nodes`, () => assert.deepStrictEqual(errors(read("valid", file)), []))
  for (const file of shapemaps("invalid"))
    it(`invalid/${file} parses with an error node`, () => assert.ok(errors(read("invalid", file)).length))
})

describe("highlighting", () => {
  // One class per tag the highlight table uses, so modified tags stay distinct.
  const highlighter = tagHighlighter([
    {tag: t.keyword, class: "keyword"},
    {tag: t.special(t.variableName), class: "wildcard"},
    {tag: t.special(t.typeName), class: "start"},
    {tag: t.className, class: "shape"},
    {tag: t.propertyName, class: "predicate"},
    {tag: t.typeName, class: "datatype"},
    {tag: t.url, class: "iri"},
    {tag: t.namespace, class: "prefix"},
    {tag: t.string, class: "string"},
    {tag: t.integer, class: "integer"},
    {tag: t.float, class: "float"},
    {tag: t.bool, class: "bool"},
    {tag: t.lineComment, class: "comment"},
    {tag: t.brace, class: "brace"},
  ])

  function classes(text) {
    const result = []
    highlightTree(parse(text), highlighter, (from, to, cls) => result.push([text.slice(from, to), cls]))
    return result
  }

  it("tells nodes, shapes, predicates, datatypes, keywords, literals and comments apart", () => {
    const text = [
      "# c",
      "<n>@<S>, ex:n @ ex:S, :n@:S, ex:@ex:,",
      "{FOCUS ex:p _}@START, {_ a FOCUS} @ START,",
      `'s'@<S>, "l"@en@<S>, "t"^^xsd:string@<S>, 1@<S>, 1.5@<S>, 1e3@<S>, true@<S>`,
    ].join("\n")
    assert.deepStrictEqual(classes(text), [
      ["# c", "comment"],
      ["<n>", "iri"], ["@<S>", "shape"], ["ex:n", "iri"], ["@ ex:S", "shape"], [":n", "iri"], ["@:S", "shape"], ["ex:", "prefix"], ["@ex:", "shape"],
      ["{", "brace"], ["FOCUS", "keyword"], ["ex:p", "predicate"], ["_", "wildcard"], ["}", "brace"], ["@START", "start"],
      ["{", "brace"], ["_", "wildcard"], ["a", "keyword"], ["FOCUS", "keyword"], ["}", "brace"], ["@ ", "shape"], ["START", "start"],
      ["'s'", "string"], ["@<S>", "shape"], ['"l"@en', "string"], ["@<S>", "shape"], ['"t"', "string"], ["xsd:string", "datatype"], ["@<S>", "shape"],
      ["1", "integer"], ["@<S>", "shape"], ["1.5", "float"], ["@<S>", "shape"], ["1e3", "float"], ["@<S>", "shape"], ["true", "bool"], ["@<S>", "shape"],
    ])
  })

  // Nodes that carry no tag of their own: their children do, or a rule with a context.
  const untagged = new Set([
    "ShapeMap", "ShapeAssociation", "NodeSelector", "TriplePattern", "NumericLiteral", "RdfLiteral", "String", "LangString",
    "Iri", "Predicate", "PrefixedName", "Unused",
  ])

  it("tags every node type, or lists it as untagged", () => {
    // Context-free selectors are enough: every tagged node type has one.
    for (const type of shapemapLanguage.parser.nodeSet.types) {
      if (!type.name || type.isError) continue
      assert.equal(!!getStyleTags({type, matchContext: () => false}), !untagged.has(type.name), type.name)
    }
  })
})

describe("coverage", () => {
  it("every node type occurs in a test case or fixture", () => {
    const seen = new Set()
    const visit = text => parse(text).iterate({enter: node => { seen.add(node.name) }})
    for (const file of fs.readdirSync(here).filter(f => f.endsWith(".txt")))
      for (const {text} of fileTests(fs.readFileSync(path.join(here, file), "utf8"), file)) visit(text)
    for (const file of shapemaps("valid")) visit(read("valid", file))
    const names = shapemapLanguage.parser.nodeSet.types.filter(type => type.name && !type.isError).map(type => type.name)
    // Unused is a top rule that no parse starts from (gen/CONFLICTS.md).
    assert.deepStrictEqual(names.filter(name => !seen.has(name)), ["Unused"])
  })
})
