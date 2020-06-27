import { PuzzleInter } from "./interfaces.ts"
import { yellow } from "https://deno.land/std/fmt/colors.ts"

function parsePuzzle(fileContent: string): { puzzle: PuzzleInter[], errors: string[], size: number } {
    if (fileContent == "") {
        return {puzzle: [], errors: ['File is empty.'], size: 0}
    }

    let lineNumber = 1
    let y = 0
    let size = 0
    let puzzle: PuzzleInter[] = []
    let errors: string[] = []

    for (let line of fileContent.trim().split('\n')) {
        let x = 0
        if (line.trim().startsWith('#')) {
            continue;
        }

        // Split line into blocks
        let isPuzzleSize = false
        for (const block of line.replace(/	+/g, ' ').trim().split('#')[0].trim().split(' ')) {
            const value = parseInt(block, 10)

            if (!/^\d+$/.test(block)) {
                // Check if block contains only digits
                errors.push(yellow(`Line ${lineNumber}`) + `: [${block}] is not numeric.`)
            } else if (!size && value < 3) {
                // Check if block is puzzle size but with a value lesser than 3
                errors.push(yellow(`Line ${lineNumber}`) + `: puzzle size [${value}] is lesser than 3.`)
            } else if (size && isPuzzleSize) {
                // Check if there is another numeric block after puzzle size
                errors.push(yellow(`Line ${lineNumber}`) + `: an argument has been provided after puzzle size [${block}].`)
            } else if (size && (y > size || x >= size)) {
                // Check dimensions of puzzle regarding puzzle size
                errors.push(yellow(`Line ${lineNumber}`) + `: an argument is outside the grid.`)
            } else if (size && value >= size ** 2) {
                // Check values regarding puzzle size
                errors.push(yellow(`Line ${lineNumber}`) + `: [${value}] is greater or equal to ${size ** 2}.`)
            } else if (size && puzzle.findIndex(e => e.value === value) > -1) {
                // Check if value is already in puzzle structure
                errors.push(yellow(`Line ${lineNumber}`) + `: [${value}] is a dupplicate.`)
            } else if (!size) {
                // Get puzzle size
                size = value
                isPuzzleSize = true
            } else {
                // Add taquin
                puzzle.push({ x, y: y - 1, value })
            }
            ++x
        }
        ++y
        ++lineNumber
    }

    // Check number of tiles
    if (errors.length != 0 && puzzle.length !== size ** 2) {
        errors.push(`Wrong number of tiles (${puzzle.length}).`)
    }
    return {puzzle: puzzle, errors: errors, size: size}
}

export { parsePuzzle }