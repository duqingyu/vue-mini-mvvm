const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g

// _c => createElement
// _v => createTextNode
// _s => {{vale}} => _s(name)
// with(this){return _c('div', {'id':"app"},_c('p', undefined,_v("模板语法："+_s(a))),_c('p', {'style':{"color":" red"," font-size":" 20px"}},_c('span', undefined,_v("双向绑定："+_s(b))),_c('input', {'type':"text",'v-model':"b"},)))}

function formatProps(attrs) {
  let attrStr = ''

  attrs.map((attr) => {
    if (attr.name === 'style') {
      let styleAttrs = attr.value.split(';').reduce((res, cur) => {
        const [name, val] = cur.split(':')
        // console.log(name, val)
        res[name] = val
        return res
      }, {})
      attr.value = styleAttrs
    }

    attrStr += `'${attr.name}':${JSON.stringify(attr.value)},`
  })
  return `{${attrStr.slice(0, -1)}}`
}

function generateChild(node) {
  if (node.type === 1) {
    return generate(node)
  } else if (node.type === 3) {
    let text = node.text

    if (!defaultTagRE.test(text)) {
      return `_v(${JSON.stringify(text)})`
    }

    let match,
      index,
      lastIndex = (defaultTagRE.lastIndex = 0),
      textArr = []

    while ((match = defaultTagRE.exec(text))) {
      index = match.index
      if (index > lastIndex) {
        textArr.push(JSON.stringify(text.slice(lastIndex, index)))
      }
      textArr.push(`_s(${match[1].trim()})`)
      lastIndex = index + match[0].length
    }
    if (lastIndex < text.length) {
      textArr.push(JSON.stringify(text.slice(lastIndex)))
    }

    return `_v(${textArr.join('+')})`
  }
}
function getChildren(el) {
  const children = el.children
  if (children) {
    return children.map((c) => generateChild(c)).join(',')
  }
}

export function generate(el) {
  let children = getChildren(el)
  let code = `_c('${el.tag}', ${
    el.attrs.length ? `${formatProps(el.attrs)}` : 'undefined'
  },${children ? `${children}` : ''})`

  return code
}
