export let Vue

class Store {
  constructor(options) {
    const {
      state,
      getters,
      mutations,
      actions,
    } = options
    this.mutations = mutations
    this.actions = actions
    this.getters = {}
    const computed = {}

    Object.keys(getters).forEach(k => {
      // 先做一层劫持代理进行闭包缓存入参, 再让 vue 进行计算缓存
      computed[k] = () => {
        return getters[k](this.state)
      }
      Object.defineProperty(this.getters, k, {
        get: () => {
          return this._vm[k]
        }
      })
    })

    this._vm = new Vue({
      data: {
        $$state: state
      },
      computed,
    })

  }
  get state() {
    return this._vm._data.$$state
  }
  commit = (type, payload) => {
    this.mutations[type](this.state, payload)
  }
  dispatch(type, payload) {
    this.actions[type](this, payload)
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