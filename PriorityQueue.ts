import { ElemInter } from "./interfaces.ts"

class QElement {
  public element: ElemInter
  public priority: number

  public constructor(element: ElemInter, priority: number) {
    this.element = element
    this.priority = priority
  }
}

class PriorityQueue {
  public items: QElement[]

  constructor() {
    this.items = []
  }

  // enqueue function to add element to the queue per priority
  enqueue(element: ElemInter, priority: number) {
    const qElement = new QElement(element, priority)
    let placed = false

    // iterating through the entire item array to add element at the correct location of the Queue
    let i = 0
    while (i < this.items.length) {
      if (this.items[i].priority > qElement.priority) {
        // Once the correct location is found it is enqueued
        this.items.splice(i, 0, qElement)
        placed = true
        break
      }
      ++i
    }

    // if the element have the highest priority it is added at the end of the queue
    if (!placed) {
      this.items.push(qElement)
    }
  }

  // dequeue method to remove element from the queue
  dequeue() {
    return (this.items.length) ? this.items.shift() : null
  }
}

export { PriorityQueue }