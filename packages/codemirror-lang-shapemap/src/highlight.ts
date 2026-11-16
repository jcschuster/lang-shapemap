import type {NodePropSource} from "@lezer/common"
import {styleTags, tags as t} from "@lezer/highlight"

export const shapemapHighlighting: NodePropSource = styleTags({
  "FOCUS RdfType": t.keyword,
  _: t.special(t.variableName),
  "START AtStart": t.special(t.typeName),
  ShapeLabel: t.className,
  "ShapeLabel/Iri! AtpnameLn AtpnameNs": t.className,
  "Predicate/Iri!": t.propertyName,
  "RdfLiteral/Iri!": t.typeName,
  Iriref: t.url,
  PnameLn: t.url,
  PnameNs: t.namespace,
  BlankNodeLabel: t.special(t.variableName),
  "StringLiteral1 StringLiteral2 StringLiteralLong1 StringLiteralLong2": t.string,
  "LangStringLiteral1 LangStringLiteral2 LangStringLiteralLong1 LangStringLiteralLong2": t.string,
  Integer: t.integer,
  "Decimal Double": t.float,
  BooleanLiteral: t.bool,
  LineComment: t.lineComment,
  "{ }": t.brace,
  "^^": t.operator,
  ",": t.separator,
})
