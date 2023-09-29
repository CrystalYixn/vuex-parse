export let Vue

function forEachObj(obj, cb) {
  Object.keys(obj).forEach(k => cb(k, obj[k]))
}

function installModule(store, rootState, path, rootModule) {
  if (path.length > 0) {

  }

  rootModule.forEachMutations((key, val) => {
    store._mutations[key] = store._mutations[key] || []
    store._mutations[key].push((payload) => {
      val(rootModule.state, payload)
    })
  })
  rootModule.forEachActions((key, val) => {
    store._actions[key] = store._actions[key] || []
    store._actions[key].push((payload) => {
      val(store, payload)
    })
  })
  rootModule.forEachGetters((key, val) => {
    store._wrappedGetters[key] = () => {
      return val(rootModule.state)
    }
  })
  rootModule.forEachModule((key, val) => {
    installModule(store, rootState, path.concat([key]), val)
  })
}

class Module {
  constructor(module) {
    this._raw = module
    this._children = {}
    this.state = module.state
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
}

class Store {
  constructor(options) {
    // AST 内部对象格式化
    this._modules = new ModuleCollection(options)
    this._mutations = Object.create(null)
    this._actions = Object.create(null)
    this._wrappedGetters = Object.create(null)
    
    const state = this._modules.root.sate
    // 把所有模块的属性放到根上, 进行合并
    installModule(this, state, [], this._modules.root)
    console.log(this._modules)
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