import { moment } from "https://deno.land/x/moment/moment.ts"
import { PriorityQueue } from "./PriorityQueue.ts"
import { HEURISTICS } from "./constants.ts"
import { PuzzleInter, ElemInter } from "./interfaces.ts"

class Puzzle {
	public size: number
	public snail: PuzzleInter[]
	public puzzle: PuzzleInter[]
	public solvable: boolean

	constructor() {
		this.size = 0
		this.snail = []
		this.puzzle = []
		this.solvable = false
	}

	initPuzzle(parsedFile: { puzzle: PuzzleInter[], errors: string[], size: number }) {
		this.size = parsedFile.size
		for (const el of parsedFile.puzzle) {
			this.puzzle.push(el)
		}
	}

	getSnailPuzzle() {
		if (!this.size || this.size < 3) {
			return;
		}
		let n = this.size
		let direction = 1
		let counter = 0
		let y = 0
		let x = -1

		while (n) {
			// fill on x axis
			let col = 0
			while (col < n) {
				x += direction
				this.snail.push({ x, y, value: (counter + 1 < this.size ** 2) ? counter + 1 : 0 })
				++counter
				++col
			}

			// fill on y axis
			let line = 0
			while (line < n - 1) {
				y += direction
				this.snail.push({ x, y, value: (counter + 1 < this.size ** 2) ? counter + 1 : 0 })
				++counter
				++line
			}

			// change direction
			direction *= -1
			--n
		}
	}

	getMixedLevel(puzzle: PuzzleInter[]) {
		let numberOfPermutations = 0

		let valueA = this.size % 2
		while (valueA < (this.size ** 2) - 1) {
			let valueB = valueA + 1
			while (valueB < this.size ** 2) {
				const objA = puzzle.find(e => e.value === valueA )
				const objB = puzzle.find(e => e.value === valueB )
				const retA = this.snail.find(e => e.x === objA!.x && e.y === objA!.y)
				const retB = this.snail.find(e => e.x === objB!.x && e.y === objB!.y)
				numberOfPermutations += (retB!.value && (!retA!.value || retA!.value > retB!.value)) ? 1 : 0
				++valueB
			}
			++valueA
		}
		return numberOfPermutations;
	}

	isPuzzleSolvable() {
		const numberOfPermutations = this.getMixedLevel(this.puzzle)
		
		if (this.size % 2 === 1) {
			// if odd, there is enough data to know if puzzle is solvable
			this.solvable = numberOfPermutations % 2 === 0
		} else {
			// if even, position of 0 from bottom is needed
			const row = this.puzzle.find(e => e.value === 0 )
			const snailRow = this.snail.find(e => e.value === 0 )
			const numberOfRows = Math.abs(snailRow!.y - row!.y) + Math.abs(snailRow!.x - row!.x)
			this.solvable = (numberOfRows % 2 !== numberOfPermutations % 2)
		}
	}

	printPuzzlePaddedValue(value: number) {
		let str = value.toString()
		const aimedSize = ((this.size ** 2) - 1).toString().length
		while (str.length < aimedSize) {
			str = ` ${str}`
		}
		return str;
	}

	printPuzzle(puzzle: PuzzleInter[]) {
		let y = 0
		while (y < this.size) {
			let x = 0
			let toWrite = ''
			while (x < this.size) {
				const obj = puzzle.find(e => e.x === x && e.y === y)
				toWrite += this.printPuzzlePaddedValue(obj!.value)
				++x
				if (x < this.size) {
					toWrite += ' '
				}
			}
			console.log(toWrite)
			++y
		}
	}
}

class PuzzleSolver extends Puzzle {
	public heuristic: string
	public uniformCost: boolean
	public greedySearch: boolean

	public swapsNumber: number
	public complexityInSize: number
	public complexityInTime: number
	public duration: number
	
	public finalSet: ElemInter[]
	private closedSet: ElemInter[]
	private OpenSet: PriorityQueue


	constructor(heuristic: string, uniformCost: boolean, greedySearch: boolean) {
		super()

		this.heuristic = heuristic || HEURISTICS.MANHATTAN
		this.uniformCost = uniformCost || false
		this.greedySearch = greedySearch || false

		this.swapsNumber = 0
		this.complexityInSize = 1
		this.complexityInTime = 1
		this.duration = 0

		this.finalSet = []
		this.closedSet = []
		this.OpenSet = new PriorityQueue()
	}

	// convert puzzle structure into string used as index
	puzzleToIndex(puzzle: PuzzleInter[]) {
		let y = 0
		let str = ''

		while (y < this.size) {
			let x = 0
			while (x < this.size) {
				const obj = puzzle.find(e => e.x === x && e.y === y)
				str += `${obj!.value}`
				++x
			}
			++y
		}
		return str
	}

	// Function to retrieves steps of the final set
	getFinalSet() {
		this.finalSet.push(this.closedSet[this.closedSet.length - 1])
		while (this.finalSet[0].parent) {
			this.finalSet.splice(0, 0, this.closedSet.find((e: ElemInter) => e.index === this.finalSet[0].parent)!)
		}
	}

	// LinearConflict heuristic
	getConflicts(puzzle: PuzzleInter[]) {
		let conflicts = 0
		let i = 1

		// look through all combinations of digits
		while (i < (this.size ** 2) - 1) {
			let j = i + 1
			while (j < this.size ** 2) {
				const objI = puzzle.find(e => e.value === i )
				const objJ = puzzle.find(e => e.value === j )
				const snailObjI = this.snail.find(e => e.value === i )
				const snailObjJ = this.snail.find(e => e.value === j )

				// If both tiles are currently on the same line, their final location will be too
				if (objI!.x === objJ!.x && snailObjI!.x === snailObjJ!.x) {
					// If tiles are reversed regarding their final location then there is a conflict
					if ((objI!.y > objJ!.y && snailObjI!.y < snailObjJ!.y)
						|| (objI!.y < objJ!.y && snailObjI!.y > snailObjJ!.y)) {
						++conflicts
					}

				}
				// Same regarding columns (but inline)
				if (objI!.y === objJ!.y && snailObjI!.y === snailObjJ!.y
					&& ((objI!.x > objJ!.x && snailObjI!.x < snailObjJ!.x)
					|| (objI!.x < objJ!.x && snailObjI!.x > snailObjJ!.x))) {
					++conflicts
				}
				++j
			}
			++i
		}
		return conflicts
	}

	getDistance(puzzle: PuzzleInter[]) {
		let distance = 0
		for (const el of puzzle) {
			const snail = this.snail.find(e => e.value === el.value )
			const dx = Math.abs(snail!.x - el.x)
			const dy = Math.abs(snail!.y - el.y)
			distance += (this.heuristic === HEURISTICS.EUCLIDEAN)
				? (dx + dy + (Math.sqrt(2) - 2) * Math.min(dx, dy))
				: dx + dy
		}
		if (distance === 0) {
			return distance
		} else if (this.uniformCost && distance) {
			return 1
		} else if (this.heuristic === HEURISTICS.LINEARCONFLICT) {
			return distance + this.getConflicts(puzzle)
		} else if (this.heuristic === HEURISTICS.MIXED) {
			return distance + this.getMixedLevel(puzzle)
		} else {
			return distance
		}
	}

	// Swap two tiles
	swapTiles(element: ElemInter, move: string) {

		// Get map index following move and coordinates
		const puzzle = JSON.parse(JSON.stringify(element.puzzle))
		const zeroIdx = puzzle.findIndex((e: PuzzleInter) => e.value === 0)
		let swappedIdx = -1

		if (move === '⮛') {
			swappedIdx = puzzle.findIndex((e: PuzzleInter) => e.x === puzzle[zeroIdx].x && e.y === puzzle[zeroIdx].y + 1)
		} else if (move === '⮙') {
			swappedIdx = puzzle.findIndex((e: PuzzleInter) => e.x === puzzle[zeroIdx].x && e.y === puzzle[zeroIdx].y - 1)
		} else if (move === '⮘') {
			swappedIdx = puzzle.findIndex((e: PuzzleInter) => e.x === puzzle[zeroIdx].x - 1 && e.y === puzzle[zeroIdx].y)
		} else if (move === '⮚') {
			swappedIdx = puzzle.findIndex((e: PuzzleInter) => e.x === puzzle[zeroIdx].x + 1 && e.y === puzzle[zeroIdx].y)
		}

		// swap values
		if (move === '⮘' || move === '⮚') {
			[puzzle[zeroIdx].x, puzzle[swappedIdx].x] = [puzzle[swappedIdx].x, puzzle[zeroIdx].x]
		} else {
			[puzzle[zeroIdx].y, puzzle[swappedIdx].y] = [puzzle[swappedIdx].y, puzzle[zeroIdx].y]
		}

		const distance = this.getDistance(puzzle)
		const index = this.puzzleToIndex(puzzle)

		// Check in closeSet if a solution drives us to this puzzle with a lower cost
		if (!this.greedySearch) {
			const inClosedSet = this.closedSet.find(e => e.index === index );
			if (inClosedSet && inClosedSet.cost <= element.cost + 1 && inClosedSet.move === move) {
				return;
			}
		}

		this.OpenSet.enqueue({
			parent: element.index,
			index,
			move,
			puzzle,
			cost: element.cost + 1,
			distance,
		}, distance + element.cost + 1)
	}

	// Main solving function
	solve() {
		const timestamp = moment()

		this.OpenSet.enqueue({
			parent: null,
			index: this.puzzleToIndex(this.puzzle),
			move: null,
			puzzle: JSON.parse(JSON.stringify(this.puzzle)),
			cost: 0,
			distance: this.getDistance(this.puzzle),
		}, 0)

		let solutionFound = false

		// A* loop
		while (!solutionFound) {
			this.complexityInSize = Math.max(this.complexityInSize, this.OpenSet.items.length)

			// pop first element from openSet
			const element = this.OpenSet.dequeue()!.element

			// move element to closeSet
			this.closedSet.push(element)

			// solution found
			if (element.distance === 0) {
				solutionFound = true
				this.swapsNumber = element.cost
				this.complexityInTime = this.closedSet.length
				this.duration = Math.abs(timestamp.diff(moment()))
				this.getFinalSet()
				return true
			}

			// find data of element 0
			const zero = element.puzzle.find((e: PuzzleInter) => e.value === 0)

			if (zero) {
				if (element.move !== '⮙' && zero.y + 1 < this.size) {
					this.swapTiles(element, '⮛')
				}
				if (element.move !== '⮛' && zero.y) {
					this.swapTiles(element, '⮙')
				}
				if (element.move !== '⮘' && zero.x + 1 < this.size) {
					this.swapTiles(element, '⮚')
				}
				if (element.move !== '⮚' && zero.x) {
					this.swapTiles(element, '⮘')
				}
			}			
		}
		return false
	}
}

export { PuzzleSolver, Puzzle }