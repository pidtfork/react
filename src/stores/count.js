import { create } from 'zustand'

// Zustand 的核心是创建一个 store，它实际上是一个 Hook：
// 创建一个 store
export const useCount = create((set) => ({
  // 状态
  count: 0,
  // 方法
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))



 