import { solvePuzzle } from "./solver.ts"

let heuristic = 'Mixed Level'
let uniformCost = false
let greedy = false
let filename = '4x4solvable.txt'
solvePuzzle(heuristic, uniformCost, greedy, filename)