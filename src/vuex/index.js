export let Vue

function forEachObj(obj, cb) {
  Object.keys(obj).forEach(k => cb(k, obj[k]))
}

/** 获取最新 state */
function getState(store, path) {
  return path.reduce((start, current) => start[current], store.state)
}

/** 挂载属性到 store 对象上 */
function installModule(store, rootState, path, rootModule) {
  if (path.length > 0) {
    // 安装模块 state 到根 state 上
    const parent = path.slice(0, -1).reduce((start, current) => {
      return start[current]
    }, rootState)
    // 动态注册模块后必须使用 Vue.set 来更新属性, 否则不会重新收集依赖
    Vue.set(parent, path[path.length - 1], rootModule.state)
  }

  const namespaced = store._modules.getNamespace(path)
  rootModule.forEachMutations((key, val) => {
    store._mutations[namespaced + key] = store._mutations[namespaced + key] || []
    store._mutations[namespaced + key].push((payload) => {
      // QAA 为什么 replaceState 后页面不刷新
      // rootModule.state 指向的为替换前的对象, 而到渲染阶段依赖收集的是新对象
      // val(rootModule.state, payload)
      val(getState(store, path), payload)
      store.subscribes.forEach(fn => fn({ type: key, payload }, store.state))
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
      // QAA replaceState 后页面显示的计算属性会刷新?
      // rootModule.state 指向的为替换前的对象, mutation 更改的也是旧对象
      // 修改与显示都指向的老对象, 所以会变化
      // return val(rootModule.state)
      return val(getState(store, path))
    }
  })
  rootModule.forEachModule((key, val) => {
    installModule(store, rootState, path.concat([key]), val)
  })
}

/** store 响应式化 */
function resetStoreVM(store, state) {
  store.getters = {}
  const computed = {}
  const wrappedGetters = store._wrappedGetters
  const oldVm = store._vm

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

  // QA 为什么旧实例没有被自动销毁? 有谁还在指向旧实例吗
  if (oldVm) {
    Vue.nextTick(() => oldVm.$destroy)
  }
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

  /** 更新内部对象的树结构 */
  register(path, rootModule) {
    let newModule = new Module(rootModule)
    rootModule.newModule = newModule
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
    this.plugins = options.plugins || []
    this.subscribes = []
    
    const state = this._modules.root.state
    // 把所有模块的属性放到根上, 进行合并
    installModule(this, state, [], this._modules.root)
    resetStoreVM(this, state)
    this.plugins.forEach(p => p(this))

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

  registerModule(path, module) {
    this._modules.register(path, module)
    installModule(this, this.state, path, module.newModule)
    // 注册新的计算属性
    resetStoreVM(this, this.state)
  }

  subscribe(fn) {
    this.subscribes.push(fn)
  }

  replaceState(state) {
    this._vm._data.$$state = state
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