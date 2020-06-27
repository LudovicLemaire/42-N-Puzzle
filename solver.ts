import { red, magenta, cyan, yellow, bold } from "https://deno.land/std/fmt/colors.ts"
import { PuzzleSolver } from "./puzzle.ts"
import { parsePuzzle } from "./parser.ts"

const decoder = new TextDecoder('utf-8')

async function solvePuzzle(heuristic: string, uniformCost: boolean, greedy: boolean, filename: string) {
    let fileContent = ''
    // Get file content
    try {
      fileContent = decoder.decode(await Deno.readFile(`./maps/${filename}`))
    } catch (e) {
      if (e.name === "PermissionDenied") {
        console.log(red(bold(`Error:`)), `Permission denied, read access to "./maps/map.txt", run again with the --allow-read flag.`)
      } else {
        console.log(red(bold(`Error:`)), `"./maps/${filename}" file at cannot be found.`)
      }
      return;
    }
    
    // Create Puzzle
    const Puzzle = new PuzzleSolver(heuristic, uniformCost, greedy);
    
    // Get puzzle from file content
    const parsedFile = parsePuzzle(fileContent)

    // Print errors
    if (parsedFile.errors.length) {
        console.log(red(bold(`Parsing error:`)), `[${parsedFile.errors.length}]`)
        for (const el of parsedFile.errors) {
            console.log(el)
        }
        return;
    }

    // Init Puzzle from parsed file
    Puzzle.initPuzzle(parsedFile)

    // Get snail solution
    Puzzle.getSnailPuzzle()

    // Check if puzzle is solvable
    Puzzle.isPuzzleSolvable()
    if (!Puzzle.solvable) {
        console.log(red(bold('Error:')), 'Puzzle is not solvable.')
        return;
    }

    if (Puzzle.uniformCost) {
        console.log(yellow(bold('Warning:')), 'You are trying to solve puzzle with brute-force method.')
    }
    if (Puzzle.size > 4) {
        console.log(yellow(bold('Warning:')), 'The puzzle is big so it can take time to solve.')
    }

    // Solve puzzle
    const solved = Puzzle.solve()
    console.log(cyan(`\nHeuristic:`), Puzzle.heuristic)
    if (Puzzle.greedySearch) {
        console.log(cyan('Greedy:'), 'Activated\n')
    } else {
        console.log(cyan('Greedy:'), 'Desactivated\n')
    }
    if (solved) {
        // Print results
        console.log(cyan(`Number of swaps:`), Puzzle.swapsNumber)
        console.log(cyan(`Complexity in size:`), Puzzle.complexityInSize)
        console.log(cyan(`Complexity in time:`), Puzzle.complexityInTime)
        console.log(cyan(`Execution duration:`), Puzzle.duration, `ms\n`)
        for (let [idx, el] of Puzzle.finalSet.entries()) {
            if (idx) {
                console.log(magenta(`\n ${el.move}\n`))
            }
            Puzzle.printPuzzle(el.puzzle)
        }
    }
    return;
}

export { solvePuzzle }