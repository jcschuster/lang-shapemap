// Runs the shex.js ShapeMap parser (npm `shape-map`) over fixtures/ and the package's
// test/ambiguities.txt. Each valid/X.shapemap must be accepted. Each invalid/X.shapemap must
// say why it is invalid (`# invalid:`) and record what shex.js does with it (`# shex.js:
// accepts` or `# shex.js: rejects`); the record must hold. So must the name of each case of
// test/ambiguities.txt that says "shex.js accepts" or "shex.js rejects". Prints one line per
// disagreement and exits 1 if there is any.
import ShapeMap from "shape-map"
import {fileTests} from "@lezer/generator/dist/test"
import {readdirSync, readFileSync} from "node:fs"
import {join} from "node:path"
import {pathToFileURL} from "node:url"

const fixtures = join(import.meta.dirname, "..", "..", "fixtures")
const ambiguities = join(import.meta.dirname, "..", "..", "packages", "codemirror-lang-shapemap", "test", "ambiguities.txt")

// A ShapeMap takes its prefixes from the schema and the data, so each prefix the parser
// asks for is declared and the text parsed again: only the syntax is checked.
function oracleError(file, text) {
  const base = pathToFileURL(file).href
  const prefixes = {}
  for (;;) {
    try {
      ShapeMap.Parser.construct(base, {base, prefixes}, {base, prefixes}).parse(text)
      return null
    } catch (error) {
      const unknown = /unknown prefix "(.*?):"/.exec(error.message)?.[1]
      if (unknown === undefined || unknown in prefixes) return error.message.split("\n")[0]
      prefixes[unknown] = `urn:prefix:${unknown}:`
    }
  }
}

const failures = []
for (const dir of ["valid", "invalid"]) {
  for (const name of readdirSync(join(fixtures, dir)).filter(name => name.endsWith(".shapemap")).sort()) {
    const file = join(fixtures, dir, name)
    const text = readFileSync(file, "utf8")
    const error = oracleError(file, text)
    if (dir == "valid") {
      if (error) failures.push(`shex.js rejects valid/${name}: ${error}`)
      continue
    }
    if (!/^# invalid: \S/m.test(text)) failures.push(`invalid/${name} has no "# invalid:" reason`)
    const recorded = /^# shex\.js: (accepts|rejects)$/m.exec(text)?.[1]
    if (!recorded) failures.push(`invalid/${name} has no "# shex.js: accepts|rejects" line`)
    else if (recorded != (error ? "rejects" : "accepts"))
      failures.push(`invalid/${name} says shex.js ${recorded} it, but it ${error ? `rejects it: ${error}` : "accepts it"}`)
  }
}

for (const {name, text} of fileTests(readFileSync(ambiguities, "utf8"), "ambiguities.txt")) {
  const recorded = /shex\.js (accepts|rejects)/.exec(name)?.[1]
  const error = oracleError(ambiguities, text)
  if (recorded && recorded != (error ? "rejects" : "accepts"))
    failures.push(`ambiguities.txt "${name}": shex.js ${error ? `rejects it: ${error}` : "accepts it"}`)
}

for (const failure of failures) console.log(failure)
process.exitCode = failures.length ? 1 : 0
