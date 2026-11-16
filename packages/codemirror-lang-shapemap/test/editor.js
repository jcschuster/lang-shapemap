import {shapemap} from "../dist/index.js"
import {EditorState} from "@codemirror/state"
import {CompletionContext} from "@codemirror/autocomplete"
import assert from "assert"

const state = doc => EditorState.create({doc, extensions: [shapemap()]})

describe("completion", () => {
  // Labels offered at the end of `doc`.
  function labels(doc, explicit = false) {
    const s = state(doc)
    const [source] = s.languageDataAt("autocomplete", doc.length)
    const result = source(new CompletionContext(s, doc.length, explicit))
    return result && result.options.map(option => option.label)
  }

  it("offers START after @", () => {
    assert.deepStrictEqual(labels("<n>@ST"), ["START"])
    assert.deepStrictEqual(labels("<n> @ S"), ["START"])
    assert.deepStrictEqual(labels("<n>@\nST"), ["START"])
    assert.deepStrictEqual(labels("<n>@ # c\nST"), ["START"])
    assert.deepStrictEqual(labels('"x"@ S'), ["START"])
    assert.deepStrictEqual(labels('"x"@en@S'), ["START"])
    assert.deepStrictEqual(labels("<n>@", true), ["START"])
  })

  it("offers FOCUS where a triple pattern takes it", () => {
    assert.deepStrictEqual(labels("{FO"), ["FOCUS"])
    assert.deepStrictEqual(labels("{_ <p> F"), ["FOCUS"])
    assert.deepStrictEqual(labels("{ <s> ex:p F"), ["FOCUS"])
    assert.deepStrictEqual(labels("<n>@<S>,\n{F"), ["FOCUS"])
    assert.deepStrictEqual(labels("{", true), ["FOCUS"])
  })

  it("offers no FOCUS where the triple pattern takes another term, or after it", () => {
    for (const doc of ["{FOCUS F", "{FOCUS <p> F", "{FOCUS a F", "{ <s> F", "{FOCUS <p> <o>} F", "{FOCUS <p> <o>}F"])
      assert.equal(labels(doc), null, JSON.stringify(doc))
  })

  it("offers nothing inside a comment, string, IRI or name, closed or not", () => {
    for (const doc of ["# see @ST", "<n>@<S> # x @ST", '"a @ST', "'''a\n@ST", "<http://x@ST", "{FOCUS # note F",
      '{FOCUS <p> "ab F', "{FOCUS ex:p", "{FOCUS <p> <o"])
      assert.equal(labels(doc), null, JSON.stringify(doc))
  })

  it("offers nothing elsewhere, nor START right after a string", () => {
    assert.equal(labels("<n>@<S>, ex"), null)
    assert.equal(labels('"chat"@S'), null)
    assert.equal(labels("'''chat'''@S"), null)
    assert.equal(labels('"chat"@', true), null)
    assert.equal(labels("<n>@"), null)
  })
})

describe("language data", () => {
  it("has line comments and closes brackets", () => {
    const s = state("")
    assert.deepStrictEqual(s.languageDataAt("commentTokens", 0), [{line: "#"}])
    assert.deepStrictEqual(s.languageDataAt("closeBrackets", 0), [{brackets: ["(", "[", "{", '"', "'"]}])
  })
})
