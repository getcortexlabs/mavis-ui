/** Prove that a retained mutable value does not borrow JavaScript identity from another owner. */
export function valueOwnership({ fields, fail, deferred }) {
  const changedRecords = new Set()
  const changedArrays = new Set()
  const arrayKey = (type) => JSON.stringify(type)
  const functions = new Map()
  const mutable = (type, seen = new Set()) => {
    if (type.k === 'optional') return mutable(type.of, seen)
    if (type.k === 'array') return changedArrays.has(arrayKey(type)) || mutable(type.of, seen)
    if (type.k !== 'record' || seen.has(type.name)) return false
    if (changedRecords.has(type.name)) return true
    return fields(type.name).some((field) => mutable(field.type, new Set([...seen, type.name])))
  }
  function fresh(value, locals = new Map(), seen = new Set()) {
    if (!mutable(value.type) || value.e === 'undefined') return true
    const check = (item) => fresh(item, locals, seen)
    const copiedItems = (list) => !mutable(list.type.of) || check(list)
    switch (value.e) {
      case 'array':
        return value.items.every(check)
      case 'spread':
        return value.lists.every(copiedItems)
      case 'record':
        return fields(value.name).every((field) => {
          const written = value.fields.find((entry) => entry.name === field.name)
          if (written) return check(written.value)
          return !mutable(field.type) || (value.spread && check(value.spread))
        })
      case 'cond':
        return check(value.then) && check(value.else)
      case 'logical':
        return value.op === '??' && check(value.left) && check(value.right)
      case 'narrowed':
        return check(value.source)
      case 'field':
      case 'index':
        return check(value.object)
      case 'collection-new':
      case 'collection-array':
        return true
      case 'local':
        if (!locals.has(value.name)) return false
        {
          const entry = locals.get(value.name)
          if (entry.used) return false
          entry.used = true
          return entry.fresh
        }
      case 'call':
        if (value.method === 'split') return true
        // A callback allocation is new for each item; a captured local allocation is not.
        if (value.method === 'map') return fresh(value.args[0].body, new Map(), seen)
        if (['filter', 'slice', 'toSorted', 'toReversed'].includes(value.method))
          return copiedItems(value.object)
        return false
      case 'invoke': {
        const key = `${value.module}.${value.name}`
        const fn = functions.get(key)
        if (!fn || seen.has(key)) return false
        const context = new Map(
          fn.params.map((param, index) => [
            param.name,
            { fresh: check(value.args[index]), used: false },
          ]),
        )
        let returned = false
        const visit = (statements, scope) =>
          statements.every((statement) => {
            if (statement.s === 'const')
              scope.set(statement.name, {
                fresh: fresh(statement.value, scope, new Set([...seen, key])),
                used: false,
              })
            if (statement.s === 'return' && statement.value) {
              returned = true
              return fresh(statement.value, scope, new Set([...seen, key]))
            }
            return ['then', 'else', 'body', 'catch', 'finally'].every(
              (branch) =>
                !Array.isArray(statement[branch]) || visit(statement[branch], new Map(scope)),
            )
          })
        return visit(fn.body, context) && returned
      }
      default:
        return false
    }
  }
  return {
    changeRecord(type) {
      if (type.k === 'record') changedRecords.add(type.name)
    },
    changeArray(type) {
      changedArrays.add(arrayKey(type))
    },
    function(module, fn) {
      functions.set(`${module}.${fn.name}`, fn)
    },
    own(value, node) {
      deferred.push({
        node,
        check() {
          if (!fresh(value))
            fail(
              node,
              'This value can share a mutable list or record with another owner in JavaScript, while Swift copies it. Make an independent copy, including mutable nested values, before retaining it.',
            )
        },
      })
      return value
    },
  }
}
