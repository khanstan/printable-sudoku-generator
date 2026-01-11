const generateBtn = document.getElementById('generate');
const printBtn = document.getElementById('print');
const templateSel = document.getElementById('template');
const perPageSel = document.getElementById('perPage');
const difficultySel = document.getElementById('difficulty');
const toggleSolution = document.getElementById('toggleSolution');
const bankDisplay = document.getElementById('bankDisplay');
const ariaLive = document.getElementById('ariaLive');
const toggleSolutionsPage = document.getElementById('toggleSolutionsPage');
const solutionsDisplay = document.getElementById('solutionsDisplay');

if (toggleSolution) toggleSolution.checked = false;
if (toggleSolutionsPage) toggleSolutionsPage.checked = false;

let currentGeneratedSet = [];

const templates = {
    single: null,
    variety: [
        { difficulty: 'easy', count: 2 },
        { difficulty: 'medium', count: 2 },
        { difficulty: 'hard', count: 2 }
    ],
    progressive: [
        { difficulty: 'easy', count: 2 },
        { difficulty: 'medium', count: 2 },
        { difficulty: 'hard', count: 1 },
        { difficulty: 'expert', count: 1 }
    ],
    challenge: [
        { difficulty: 'medium', count: 1 },
        { difficulty: 'hard', count: 2 },
        { difficulty: 'expert', count: 3 }
    ],
    beginner: [
        { difficulty: 'easy', count: 4 },
        { difficulty: 'medium', count: 2 }
    ]
};

toggleSolutionsPage?.addEventListener('change', () => displayGeneratedSet(currentGeneratedSet));

document.addEventListener('keydown', (e) => {
    const t = e.target;
    const tag = t?.tagName;
    const isTypingContext =
        tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || t?.isContentEditable;

    if (isTypingContext) return;

    if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        if (!generateBtn.disabled) generateBtn.click();
    }
    if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (!printBtn.disabled) printBtn.click();
    }
});

function createPuzzleSVG(board, cellSize = 28, outerStroke = 4) {
    const cols = 9, rows = 9;
    const w = cols * cellSize + outerStroke * 2;
    const h = rows * cellSize + outerStroke * 2;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('xmlns', svgNS);
    svg.setAttribute('shape-rendering', 'crispEdges');

    const bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', String(w));
    bg.setAttribute('height', String(h));
    bg.setAttribute('fill', 'white');
    svg.appendChild(bg);

    const frame = document.createElementNS(svgNS, 'rect');
    frame.setAttribute('x', String(outerStroke / 2));
    frame.setAttribute('y', String(outerStroke / 2));
    frame.setAttribute('width', String(w - outerStroke));
    frame.setAttribute('height', String(w - outerStroke));
    frame.setAttribute('fill', 'none');
    frame.setAttribute('stroke', '#333337');
    frame.setAttribute('stroke-width', String(outerStroke));
    frame.setAttribute('stroke-linecap', 'butt');
    frame.setAttribute('stroke-linejoin', 'miter');
    svg.appendChild(frame);

    const thinStroke = 2, thickStroke = 4;
    for (let i = 1; i < cols; i++) {
        const x = outerStroke + i * cellSize;
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', String(x));
        line.setAttribute('y1', String(outerStroke));
        line.setAttribute('x2', String(x));
        line.setAttribute('y2', String(w - outerStroke));
        const isThick = (i % 3 === 0);
        line.setAttribute('stroke', '#333337');
        line.setAttribute('stroke-width', String(isThick ? thickStroke : thinStroke));
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        line.setAttribute('stroke-linecap', 'butt');
        line.setAttribute('stroke-linejoin', 'miter');
        svg.appendChild(line);
    }
    for (let i = 1; i < rows; i++) {
        const y = outerStroke + i * cellSize;
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', String(outerStroke));
        line.setAttribute('y1', String(y));
        line.setAttribute('x2', String(w - outerStroke));
        line.setAttribute('y2', String(y));
        const isThick = (i % 3 === 0);
        line.setAttribute('stroke', '#333337');
        line.setAttribute('stroke-width', String(isThick ? thickStroke : thinStroke));
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        line.setAttribute('stroke-linecap', 'butt');
        line.setAttribute('stroke-linejoin', 'miter');
        svg.appendChild(line);
    }

    const fontSize = Math.round(cellSize * 0.55);
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const v = board[r][c];
            if (!v) continue;
            const tx = outerStroke + c * cellSize + cellSize / 2;
            const ty = outerStroke + r * cellSize + cellSize / 2 + Math.round(fontSize * 0.33);
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', String(tx));
            text.setAttribute('y', String(ty));
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-family', 'Merriweather, serif');
            text.setAttribute('font-size', String(fontSize));
            text.setAttribute('fill', '#000');
            text.textContent = String(v);
            svg.appendChild(text);
        }
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'mini-puzzle';
    wrapper.appendChild(svg);
    return wrapper;
}

function range(n) { return Array.from({ length: n }, (_, i) => i) }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]] } return arr }
function cloneBoard(b) { return b.map(r => r.slice()) }

function isSafe(board, row, col, val) {
    for (let i = 0; i < 9; i++) if (board[row][i] === val) return false;
    for (let i = 0; i < 9; i++) if (board[i][col] === val) return false;
    const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (board[br + r][bc + c] === val) return false;
    return true;
}

function generateFullBoardWithRetries(retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            return generateFullBoard();
        } catch { }
    }
    throw new Error('Failed to generate full board after retries');
}

function generateFullBoard(maxAttempts = 10000) {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    let attempts = 0;
    function fill(pos = 0) {
        attempts++;
        if (attempts > maxAttempts) return false;
        if (pos === 81) return true;
        const r = Math.floor(pos / 9), c = pos % 9;
        let digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].slice());
        for (const d of digits) {
            if (isSafe(board, r, c, d)) {
                board[r][c] = d;
                if (fill(pos + 1)) return true;
                board[r][c] = 0;
            }
        }
        return false;
    }
    if (!fill()) {
        throw new Error('Failed to generate full board');
    }
    return board;
}

function countSolutions(board, limit = 2) {
    const b = cloneBoard(board);
    let count = 0;

    function findBestEmpty() {
        let best = null;
        let bestCandidates = null;

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (b[r][c] !== 0) continue;

                const candidates = [];
                for (let d = 1; d <= 9; d++) {
                    if (isSafe(b, r, c, d)) candidates.push(d);
                }

                if (candidates.length === 0) return { r, c, candidates: [] };
                if (!best || candidates.length < bestCandidates.length) {
                    best = { r, c };
                    bestCandidates = candidates;
                    if (candidates.length === 1) return { r, c, candidates };
                }
            }
        }

        if (!best) return null;
        return { r: best.r, c: best.c, candidates: bestCandidates };
    }

    function solve() {
        if (count >= limit) return;

        const cell = findBestEmpty();
        if (cell === null) {
            count++;
            return;
        }
        if (cell.candidates.length === 0) return;

        for (const d of cell.candidates) {
            b[cell.r][cell.c] = d;
            solve();
            if (count >= limit) return;
            b[cell.r][cell.c] = 0;
        }
    }

    solve();
    return count;
}

const difficultyHoles = { easy: 32, medium: 42, hard: 50, expert: 54 };

function makePuzzle(fullBoard, difficulty = 'medium') {
    const holesTarget = difficultyHoles[difficulty] || 42;
    const puzzle = cloneBoard(fullBoard);
    let positions = shuffle(range(81));
    let removed = 0;
    let failedAttempts = 0;
    const maxFailedAttempts = 30;
    for (const pos of positions) {
        if (removed >= holesTarget) break;
        if (failedAttempts >= maxFailedAttempts) break;
        const r = Math.floor(pos / 9), c = pos % 9;
        const backup = puzzle[r][c];
        puzzle[r][c] = 0;
        const sols = countSolutions(puzzle, 2);
        if (sols !== 1) {
            puzzle[r][c] = backup;
            failedAttempts++;
        } else {
            removed++;
            failedAttempts = 0;
        }
    }
    if (removed < holesTarget - 5) {
        console.warn(`Only removed ${removed} cells (target: ${holesTarget})`);
    }
    return puzzle;
}

function gradePuzzle(puzzle) {
    const b = cloneBoard(puzzle);
    const used = { level: 0, guesses: 0, steps: 0 };

    function candidatesAt(board, r, c) {
        if (board[r][c] !== 0) return [];
        const out = [];
        for (let d = 1; d <= 9; d++) {
            if (isSafe(board, r, c, d)) out.push(d);
        }
        return out;
    }

    function applyNakedSingles(board) {
        let changed = false;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] !== 0) continue;
                const cand = candidatesAt(board, r, c);
                if (cand.length === 1) {
                    board[r][c] = cand[0];
                    changed = true;
                    used.level = Math.max(used.level, 1);
                    used.steps++;
                }
            }
        }
        return changed;
    }

    function applyHiddenSingles(board) {
        let changed = false;

        function hiddenSingleInCells(cells) {
            const positionsByDigit = Array.from({ length: 10 }, () => []);
            for (const [r, c] of cells) {
                if (board[r][c] !== 0) continue;
                const cand = candidatesAt(board, r, c);
                for (const d of cand) positionsByDigit[d].push([r, c]);
            }
            for (let d = 1; d <= 9; d++) {
                if (positionsByDigit[d].length === 1) {
                    const [r, c] = positionsByDigit[d][0];
                    board[r][c] = d;
                    changed = true;
                    used.level = Math.max(used.level, 2);
                    used.steps++;
                    return true;
                }
            }
            return false;
        }

        for (let r = 0; r < 9; r++) {
            const cells = [];
            for (let c = 0; c < 9; c++) cells.push([r, c]);
            if (hiddenSingleInCells(cells)) return true;
        }
        
        for (let c = 0; c < 9; c++) {
            const cells = [];
            for (let r = 0; r < 9; r++) cells.push([r, c]);
            if (hiddenSingleInCells(cells)) return true;
        }

        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                const cells = [];
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        cells.push([br * 3 + r, bc * 3 + c]);
                    }
                }
                if (hiddenSingleInCells(cells)) return true;
            }
        }

        return changed;
    }

    function applyLockedCandidates(board) {
        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                const candCellsByDigit = Array.from({ length: 10 }, () => []);
                const boxCells = [];
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        const rr = br * 3 + r, cc = bc * 3 + c;
                        boxCells.push([rr, cc]);
                        if (board[rr][cc] !== 0) continue;
                        const cand = candidatesAt(board, rr, cc);
                        for (const d of cand) candCellsByDigit[d].push([rr, cc]);
                    }
                }

                for (let d = 1; d <= 9; d++) {
                    const cells = candCellsByDigit[d];
                    if (cells.length <= 1) continue;

                    const allSameRow = cells.every(x => x[0] === cells[0][0]);
                    const allSameCol = cells.every(x => x[1] === cells[0][1]);

                    if (allSameRow) {
                        const row = cells[0][0];
                        const spots = [];
                        for (let c = 0; c < 9; c++) {
                            const inThisBox = (Math.floor(row / 3) === br && Math.floor(c / 3) === bc);
                            if (inThisBox) continue;
                            if (board[row][c] !== 0) continue;
                            if (isSafe(board, row, c, d)) spots.push([row, c]);
                        }

                        if (spots.length === 1) {
                            const [rr, cc] = spots[0];
                            board[rr][cc] = d;
                            used.level = Math.max(used.level, 3);
                            used.steps++;
                            return true;
                        }
                    }

                    if (allSameCol) {
                        const col = cells[0][1];
                        const spots = [];
                        for (let r = 0; r < 9; r++) {
                            const inThisBox = (Math.floor(r / 3) === br && Math.floor(col / 3) === bc);
                            if (inThisBox) continue;
                            if (board[r][col] !== 0) continue;
                            if (isSafe(board, r, col, d)) spots.push([r, col]);
                        }
                        if (spots.length === 1) {
                            const [rr, cc] = spots[0];
                            board[rr][cc] = d;
                            used.level = Math.max(used.level, 3);
                            used.steps++;
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function findBestEmpty(board) {
        let best = null;
        let bestCand = null;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] !== 0) continue;
                const cand = candidatesAt(board, r, c);
                if (cand.length === 0) return { r, c, cand: [] };
                if (!best || cand.length < bestCand.length) {
                    best = { r, c };
                    bestCand = cand;
                    if (cand.length === 1) return { r, c, cand };
                }
            }
        }
        return best ? { r: best.r, c: best.c, cand: bestCand } : null;
    }

    function solved(board) {
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (board[r][c] === 0) return false;
        return true;
    }

    function logicalSolveLoop(board) {
        while (true) {
            if (applyNakedSingles(board)) continue;
            if (applyHiddenSingles(board)) continue;
            if (applyLockedCandidates(board)) continue;
            break;
        }
    }

    function solveWithGuessing(board) {
        logicalSolveLoop(board);
        if (solved(board)) return true;

        const cell = findBestEmpty(board);
        if (cell === null) return true;
        if (cell.cand.length === 0) return false;

        used.level = Math.max(used.level, 4);
        used.guesses++;

        for (const d of cell.cand) {
            const snapshot = cloneBoard(board);
            snapshot[cell.r][cell.c] = d;
            if (solveWithGuessing(snapshot)) {
                for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) board[r][c] = snapshot[r][c];
                return true;
            }
        }
        return false;
    }

    solveWithGuessing(b);

    const label =
        used.level <= 1 ? 'easy' :
            used.level === 2 ? 'medium' :
                used.level === 3 ? 'hard' :
                    'expert';

    const givens = puzzle.flat().filter(x => x !== 0).length;

    return { label, givens, ...used };
}

generateBtn.addEventListener('click', async () => {
    generateBtn.disabled = true;
    const originalText = generateBtn.textContent;
    try {
        const templateKey = templateSel.value;
        let specs;
        if (templateKey === 'single') {
            const count = parseInt(perPageSel?.value || '6', 10);
            const difficulty = difficultySel.value;
            specs = [{ difficulty, count }];
        } else {
            specs = templates[templateKey];
        }
        const totalCount = specs.reduce((sum, s) => sum + s.count, 0);
        const generated = [];
        let currentIndex = 0;
        for (const spec of specs) {
            for (let i = 0; i < spec.count; i++) {
                currentIndex++;
                generateBtn.textContent = `Generating ${currentIndex}/${totalCount}...`;
                announceToScreenReader(`Generating puzzle ${currentIndex} of ${totalCount}`);
                await new Promise(resolve => setTimeout(resolve, 10));
                const full = generateFullBoard();
                let puzzle = null;
                let grade = null;

                for (let attempt = 1; attempt <= 6; attempt++) {
                    const candidate = makePuzzle(full, spec.difficulty);
                    const g = gradePuzzle(candidate);

                    const rank = { easy: 1, medium: 2, hard: 3, expert: 4 };
                    if (rank[g.label] >= rank[spec.difficulty]) {
                        puzzle = candidate;
                        grade = g;
                        break;
                    }

                    if (!grade || rank[g.label] > rank[grade.label]) {
                        puzzle = candidate;
                        grade = g;
                    }
                }

                generated.push({
                    puzzle,
                    solution: full,
                    requestedDifficulty: spec.difficulty,
                    actualDifficulty: grade.label,
                    givens: grade.givens,
                    gradeMeta: { level: grade.level, guesses: grade.guesses, steps: grade.steps }
                });
            }
        }
        currentGeneratedSet = generated;
        displayGeneratedSet(currentGeneratedSet);
        announceToScreenReader(`Generated ${totalCount} puzzles successfully`);
    } catch (error) {
        console.error('Generation failed:', error);
        alert('Failed to generate puzzles. Please try again.');
        announceToScreenReader('Failed to generate puzzles');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = originalText;
    }
});

printBtn.addEventListener('click', () => {
    if (currentGeneratedSet && currentGeneratedSet.length > 0) {
        displayGeneratedSet(currentGeneratedSet);
    } else {
        document.body.classList.remove('print-solutions-page');
        if (solutionsDisplay) solutionsDisplay.innerHTML = '';
    }

    window.print();
});

toggleSolution.addEventListener('change', () => {
    if (currentGeneratedSet && currentGeneratedSet.length > 0) {
        displayGeneratedSet(currentGeneratedSet);
        const state = toggleSolution.checked ? 'showing solutions' : 'showing puzzles';
        announceToScreenReader(`Now ${state}`);
    }
});

function announceToScreenReader(message) {
    if (!ariaLive) return;
    ariaLive.textContent = '';
    setTimeout(() => { ariaLive.textContent = message; }, 0);
}

document.body.classList.remove('print-solutions-page');

document.addEventListener('DOMContentLoaded', () => {
    if (solutionsDisplay) solutionsDisplay.innerHTML = '';
    document.body.classList.remove('print-solutions-page');
    currentGeneratedSet = [];
    if (bankDisplay) bankDisplay.innerHTML = '';
    if (templateSel) {
        templateSel.value = 'single';
        templateSel.addEventListener('change', () => {
            const singleControls = document.querySelector('.single-difficulty-controls');
            if (templateSel.value === 'single') {
                singleControls.style.display = 'flex';
            } else {
                singleControls.style.display = 'none';
            }
        });
    }
});

function displayGeneratedSet(puzzles) {
    if (!bankDisplay) return;
    if (solutionsDisplay) solutionsDisplay.innerHTML = '';

    bankDisplay.innerHTML = '';
    const n = puzzles.length;
    if (n >= 9) bankDisplay.style.gridTemplateColumns = 'repeat(3,1fr)';
    else if (n >= 4) bankDisplay.style.gridTemplateColumns = 'repeat(2,1fr)';
    else bankDisplay.style.gridTemplateColumns = 'repeat(1,1fr)';
    const showSolution = toggleSolution?.checked;
    for (const item of puzzles) {
        const board = showSolution ? item.solution : item.puzzle;

        const mini = createPuzzleSVG(board || [], 28, 4);

        const printLabel = document.createElement('div');
        printLabel.className = 'difficulty-label';
        printLabel.textContent = item.actualDifficulty;
        mini.insertBefore(printLabel, mini.firstChild);

        bankDisplay.appendChild(mini);
    }
    const printSolutions = !!toggleSolutionsPage?.checked;

    document.body.classList.toggle('print-solutions-page', printSolutions);

    if (solutionsDisplay) solutionsDisplay.innerHTML = '';

    if (printSolutions && solutionsDisplay) {
        const title = document.createElement('div');
        title.className = 'difficulty-label';
        title.textContent = 'Solutions';
        solutionsDisplay.appendChild(title);

        const grid = document.createElement('section');
        grid.className = 'bank-display';
        solutionsDisplay.appendChild(grid);

        for (const item of puzzles) {
            const mini = createPuzzleSVG(item.solution || [], 22, 3);

            const label = document.createElement('div');
            label.className = 'difficulty-label';
            label.textContent = item.actualDifficulty;

            mini.insertBefore(label, mini.firstChild);
            grid.appendChild(mini);
        }
    }
}