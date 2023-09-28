export let Vue

class Store {
  constructor(options) {
    const {
      state,
      getters,
      mutations,
      actions,
    } = options

    this.getters = {}
    this._vm = new Vue({
      data: {
        $$state: state
      },
      computed: getters,
    })

    Object.keys(getters).forEach(k => {
      Object.defineProperty(this.getters, k, {
        get() {
          // return this._vm[k](this.state)
          return getters[k](state)
        }
      })
    })
  }
  get state() {
    return this._vm._data.$$state
  }
  commit = () => {

  }
  dispatch(type, payload) {

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