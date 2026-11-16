import {parser} from "./shapemap.grammar"
import {LRLanguage, LanguageSupport, syntaxTree} from "@codemirror/language"
import type {SyntaxNode} from "@lezer/common"
import type {CompletionContext, CompletionResult} from "@codemirror/autocomplete"

// Where a keyword cannot start: inside these tokens, or right after a character that joins
// the word to a name, IRI, string or number.
const noKeywords = new Set(["Iriref", "PnameLn", "PnameNs", "AtpnameLn", "AtpnameNs", "BlankNodeLabel",
  "StringLiteral1", "StringLiteral2", "StringLiteralLong1", "StringLiteralLong2", "LangStringLiteral1", "LangStringLiteral2",
  "LangStringLiteralLong1", "LangStringLiteralLong2", "LineComment"])
// Comments, strings, IRIs and escapes, each from its start to its end or, unclosed, to where
// its token would end. One that is not closed is no token of the tree, so the text before a
// word is scanned for it.
const opaque = new RegExp([
  /#.*/, /'''(?:\\[^]|[^\\])*?(?:'''|$)/, /"""(?:\\[^]|[^\\])*?(?:"""|$)/,
  /'(?:\\.|[^'\\\n])*'?/, /"(?:\\.|[^"\\\n])*"?/, /<[^>\s]*>?/, /\\[^]/,
].map(part => part.source).join("|"), "g")

/// Whether a word at the end of `text` would be inside one of the `opaque` constructs.
function inOpaque(text: string) {
  // The letter stands for the word: it continues an open construct and starts none.
  const scanned = text + "x"
  opaque.lastIndex = 0
  for (let m; (m = opaque.exec(scanned)); ) if (m.index + m[0].length > text.length) return true
  return false
}

function ancestor(node: SyntaxNode | null, name: string) {
  for (; node; node = node.parent) if (node.name == name) return node
  return null
}

// The terms of `node` that end before `pos`, without comments and errors.
const termsBefore = (node: SyntaxNode, pos: number) => {
  const terms = []
  for (let c = node.firstChild; c && c.to <= pos; c = c.nextSibling) if (!c.type.isError && c.name != "LineComment") terms.push(c)
  return terms
}

/// `START` where a shape label has its `@` and nothing else yet, `FOCUS` where a triple
/// pattern takes it: first, or third after a subject that is not `FOCUS`. Nothing inside a
/// comment, string, IRI or name, closed or not. An `@` right after a string starts a
/// language tag, not a shape label: `"x"@START` and `"x"@ex:S` are strings with the
/// language tags `START` and `ex` (spec/README.md), so no `START` there.
function shapemapCompletion(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[A-Za-z]*/)!
  if (!word.text && !context.explicit) return null
  if (/[\w:.\-%\\/<>"'^]/.test(context.state.sliceDoc(word.from - 1, word.from))) return null
  if (/["']@$/.test(context.state.sliceDoc(word.from - 2, word.from))) return null
  const tree = syntaxTree(context.state)
  if (noKeywords.has(tree.resolveInner(word.from, 1).name)) return null
  if (inOpaque(context.state.sliceDoc(0, word.from))) return null
  const option = (label: string): CompletionResult => ({from: word.from, options: [{label, type: "keyword"}], validFor: /^[A-Za-z]*$/})
  const before = tree.resolveInner(word.from, -1)
  const label = ancestor(before, "ShapeLabel")
  if (label) return termsBefore(label, word.from).length ? null : option("START")
  const pattern = ancestor(before, "TriplePattern"), close = pattern?.getChild("}")
  if (!pattern || (close && close.to <= word.from)) return null
  const terms = termsBefore(pattern, word.from).filter(term => term.name != "{")
  return terms.length == 0 || (terms.length == 2 && terms[0].name != "FOCUS") ? option("FOCUS") : null
}

/// The ShapeMap language: highlighting (from `highlight.ts`, attached by the grammar) and
/// completion of `FOCUS` and `START`.
export const shapemapLanguage = LRLanguage.define({
  name: "shapemap",
  parser,
  languageData: {
    commentTokens: {line: "#"},
    closeBrackets: {brackets: ["(", "[", "{", '"', "'"]},
    autocomplete: shapemapCompletion,
  },
})

/// ShapeMap language support for CodeMirror.
export function shapemap() {
  return new LanguageSupport(shapemapLanguage)
}
