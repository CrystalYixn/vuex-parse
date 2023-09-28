export let Vue

class Store {

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