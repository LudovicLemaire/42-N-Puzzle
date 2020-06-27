interface PuzzleInter {
	x: number,
	y: number,
	value: number,
}

interface ElemInter {
	parent: string | null,
	index: string,
	move: string | null,
	puzzle: PuzzleInter[],
	cost: number,
	distance: number,
}

export { PuzzleInter, ElemInter }