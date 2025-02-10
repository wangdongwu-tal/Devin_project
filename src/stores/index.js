import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', {
  state: () => ({
    count: 0,
    user: null
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2,
    isLoggedIn: (state) => !!state.user
  },
  
  actions: {
    increment() {
      this.count++
    },
    setUser(user) {
      this.user = user
    }
  }
})
