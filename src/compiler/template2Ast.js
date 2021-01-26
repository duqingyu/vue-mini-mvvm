// Regular Expressions for parsing tags and attributes
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)
const startTagClose = /^\s*(\/?)>/
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const doctype = /^<!DOCTYPE [^>]+>/i
// #7298: escape - to avoid being passed as HTML comment when inlined in page
const comment = /^<!\--/
const conditionalComment = /^<!\[/

/* <div id="app">
  <p>模板语法：{{a}}</p>
  <p>
    <span>双向绑定：{{b}}</span>
    <input type="text" v-model="b" />
  </p>
</div> */

export function template2Ast(html) {
  let text,
    root,
    currentParent,
    stack = []

  while (html) {
    let textEnd = html.indexOf('<')
    if (textEnd === 0) {
      const startTagMatch = parseStartTag()
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue
      }

      const endTagMatch = parseEndTag()
      if (endTagMatch) {
        advance(endTagMatch[0].length)
        end(endTagMatch[1])
        continue
      }
    }
    if (textEnd > 0) {
      text = html.substring(0, textEnd)
    }
    if (text) {
      advance(text.length)
      chars(text)
    }
  }

  function advance(n) {
    html = html.substring(n)
  }
  function parseStartTag() {
    const start = html.match(startTagOpen)

    let end, attrs

    if (start) {
      const match = {
        tagName: start[1],
        attrs: []
      }
      advance(start[0].length)
      while (
        !(end = html.match(startTagClose)) &&
        (attrs = html.match(attribute))
      ) {
        match.attrs.push({
          name: attrs[1],
          value: attrs[3] || attrs[4] || attrs[5] // 'id=app', "id=app", `id="app"都不太一样..`
        })
        advance(attrs[0].length)
      }
      if (end) {
        advance(end[0].length)
        return match
      }
    }
  }

  function parseEndTag() {
    return html.match(endTag)
  }
  function start(tagName, attrs) {
    const element = createAstElement(tagName, attrs)

    if (!root) {
      root = element
    }
    currentParent = element
    stack.push(element)
  }
  function end(tagName) {
    const element = stack.pop()
    currentParent = stack[stack.length - 1]
    if (currentParent) {
      element.parent = currentParent
      currentParent.children.push(element)
    }
  }
  function chars(text) {
    text = text.trim()
    if (text.length > 0) {
      currentParent.children.push({
        type: 3,
        text
      })
    }
  }
  function createAstElement(tag, attrs) {
    return {
      tag,
      attrs,
      type: 1,
      children: [],
      parent: undefined
    }
  }

  return root
}
