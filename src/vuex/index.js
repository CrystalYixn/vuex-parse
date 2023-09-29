export let Vue

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
      Object.keys(modules).forEach(k => {
        this.register(path.concat(k), modules[k])
      })
    }
  }
}

class Store {
  constructor(options) {
    this._modules = new ModuleCollection(options)
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