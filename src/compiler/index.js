import { template2Ast } from './template2Ast.js'
import { generate } from './generate.js'

export function compileToFunctions(template) {
  const ast = template2Ast(template)
  console.log('======ast========', ast)
  const code = generate(ast)
  console.log('=======code=======', code)
  const render = new Function(`
    with(this){return ${code}}
  `)
  console.log('=======render=======', render)
  return {
    ast,
    code,
    render
  }
}
