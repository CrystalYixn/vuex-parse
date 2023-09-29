import Vue from 'vue'
// import Vuex from 'vuex'
// import logger from 'vuex/dist/logger'
import Vuex from '@/vuex'

Vue.use(Vuex)

const logger = () => (store) => {
  let prevState = JSON.parse(JSON.stringify(store.state))
  store.subscribe((mutationType, rootState) => {
    const nextState = JSON.parse(JSON.stringify(rootState))
    console.log(` ================== logger ================= `, mutationType)
    console.table(prevState)
    console.table(nextState)
    prevState = nextState
  })
}

// 持久化插件
const persists = (store) => {
  const state = localStorage.getItem('VUEX')
  if (state) {
    store.replaceState(JSON.parse(state))
  }
  store.subscribe((mutationType, rootState) => {
    localStorage.setItem('VUEX', JSON.stringify(rootState))
  })
}

const store = new Vuex.Store({
  plugins: [
    logger(),
    persists,
  ],
  state: {
    age: 0,
    // 重复定义与模块路径相同的 state 时会被模块的值覆盖
    school: {
      age: 10,
    }
  },
  getters: {
    plusAge(state) {
      console.count('计算属性执行次数')
      return state.age + 10
    }
  },
  mutations: {
    add(state, payload) {
      state.age += payload
    }
  },
  actions: {
    add({ commit }, payload) {
      return new Promise((res) => {
        setTimeout(() => {
          commit('add', payload)
          res()
        }, 1000)
      })
    }
  },
  modules: {
    school: {
      // 不加此声明时, 默认会调用所有模块同名的 add 方法, 只有 state 不受命名空间影响
      namespaced: true,
      // 会产生 $store.state.school 对象
      state: { name: '学校', age: 150 },
      // 没有命名空间时, getter 会被定义在根上
      getters: {
        // 需调用 $store.getters['school/plusAge'] 来访问
        plusAge(state) {
          return state.age + 100
        }
      },

      // 没有命名空间时, 所有同名 mutation 和 action 会被收集然后定义在根上
      mutations: {
        // 需调用 $store.commit('school/add') 来指定调用 add 方法
        add(state, payload) {
          state.age += payload
        }
      },
      // 模块可以无限级嵌套
      modules: {
        a: {
          state: { name: 'whh' },
        }
      },
    },
    to: {

    }
  }
})

// store.registerModule(['school', 'dynamic'], {
//   namespaced: true,
//   state: {
//     age: 999900,
//   },
//   mutations: {
//     add(state) {
//       return state.age += 10
//     }
//   },
//   getters: {
//     plusAge(state) {
//       return state.age + 10000000
//     }
//   }
// })

export default store
