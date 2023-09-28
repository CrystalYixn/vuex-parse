import Vue from 'vue'
// import Vuex from 'vuex'
import Vuex from '@/vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    age: 0
  },
  getters: {
    plusAge(state) {
      console.count('计算属性执行次数')
      return state.age + 100
    }
  },
  mutations: {
    add(state, payload) {
      state.age += payload
    }
  },
  actions: {
    add({ commit }, payload) {
      setTimeout(() => {
        commit('add', payload)
      }, 1000)
    }
  },
})
