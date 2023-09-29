export let Vue

function forEachObj(obj, cb) {
  Object.keys(obj).forEach(k => cb(k, obj[k]))
}

function installModule(store, rootState, path, rootModule) {
  if (path.length > 0) {
    // 安装模块到根 state 上
    const parent = path.slice(0, -1).reduce((start, current) => {
      return start[current]
    }, rootState)
    parent[path[path.length - 1]] = rootModule.state
  }

  const namespaced = store._modules.getNamespace(path)
  rootModule.forEachMutations((key, val) => {
    store._mutations[namespaced + key] = store._mutations[namespaced + key] || []
    store._mutations[namespaced + key].push((payload) => {
      val(rootModule.state, payload)
    })
  })
  rootModule.forEachActions((key, val) => {
    store._actions[namespaced + key] = store._actions[namespaced + key] || []
    store._actions[namespaced + key].push((payload) => {
      val(store, payload)
    })
  })
  rootModule.forEachGetters((key, val) => {
    store._wrappedGetters[namespaced + key] = () => {
      return val(rootModule.state)
    }
  })
  rootModule.forEachModule((key, val) => {
    installModule(store, rootState, path.concat([key]), val)
  })
}

function resetStoreVM(store, state) {
  store.getters = {}
  const computed = {}
  const wrappedGetters = store._wrappedGetters

  forEachObj(wrappedGetters, (k, v) => {
    computed[k] = v
    Object.defineProperty(store.getters, k, {
      get: () => {
        return store._vm[k]
      }
    })
  })

  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed,
  })
}

class Module {
  constructor(module) {
    this._raw = module
    this._children = {}
    this.state = module.state
  }

  get namespaced() {
    return !!this._raw.namespaced
  }

  appendChild(key, module) {
    this._children[key] = module
  }

  getChild(key) {
    return this._children[key]
  }

  forEachMutations(cb) {
    this._raw.mutations && forEachObj(this._raw.mutations, cb)
  }

  forEachActions(cb) {
    this._raw.actions && forEachObj(this._raw.actions, cb)
  }

  forEachGetters(cb) {
    this._raw.getters && forEachObj(this._raw.getters, cb)
  }

  forEachModule(cb) {
    forEachObj(this._children, cb)
  }
}

class ModuleCollection {
  constructor(options) {
    this.root = null
    this.register([], options)
  }

  register(path, rootModule) {
    let newModule = new Module(rootModule)
    if (this.root === null) {
      this.root = newModule
    } else {
      // 通过 key 从根上一直找到当前前一个 store, 因为深度遍历故前一个一定为父
      const parent = path.slice(0, -1).reduce((start, current) => {
        return start.getChild(current)
      }, this.root)
      const lastModuleName = path[path.length - 1]
      parent.appendChild(lastModuleName, newModule)
    }
    const { modules } = rootModule
    // 如果有孩子, 则深度注册所有孩子, key 信息全部在 path 中
    if (modules) {
      forEachObj(modules, (k, v) => {
        this.register(path.concat(k), v)
      })
    }
  }

  getNamespace(path) {
    let module = this.root
    return path.reduce((str, key) => {
      module = module.getChild(key)
      return str + (module.namespaced ? `${key}/` : '')
    }, '')
  }
}

class Store {
  constructor(options) {
    // AST 内部对象格式化
    this._modules = new ModuleCollection(options)
    this._mutations = Object.create(null)
    this._actions = Object.create(null)
    this._wrappedGetters = Object.create(null)
    
    const state = this._modules.root.state
    // 把所有模块的属性放到根上, 进行合并
    installModule(this, state, [], this._modules.root)
    resetStoreVM(this, state)
    console.table(this._modules)
  }

  get state() {
    return this._vm._data.$$state
  }

  commit = (type, payload) => {
    this._mutations[type].forEach(fn => fn.call(this, payload))
  }

  dispatch = (type, payload) => {
    this._actions[type].forEach(fn => fn.call(this, payload))
  }
}

const install = (_Vue) => {
  Vue = _Vue

  Vue.mixin({
    beforeCreate() {
      if (this.$options.store) {
        this.$store = this.$options.store
      } else if (this.$parent?.$store) {
        this.$store = this.$parent.$store
      }
    }
  })
}

export default {
  Store,
  install,
}