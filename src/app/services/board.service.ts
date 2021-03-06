import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Cell } from '../models/cell';
import { CellState } from '../models/cellState';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  boardSize = 15;

  interval!: number;
  tickRate: number = 800;

  private board = new BehaviorSubject<Cell[][]>([]);
  board$ = this.board.asObservable();

  private tick = new BehaviorSubject<number>(0);
  tick$ = this.tick.asObservable();

  private run = new BehaviorSubject<boolean>(false);
  run$ = this.run.asObservable();

  // Rules for next state based off #neighbours
  private rules = new BehaviorSubject<any>(this.getDefaultRules());
  rules$ = this.rules.asObservable();

  initializeRules() {
    this.resetRules();
  }

  resetRules() {
    this.rules.next(this.getDefaultRules());
  }

  getDefaultRules() {
    let rules = {
      // Lower than this => Dead [Default 2]
      underpopulation_threshold: 2,
      // Greater than this => Dead [Default 3]
      overpopulation_threshold: 3,
      // Exactly this => (Dead => Alive) [Default 3]
      // life_exact: [2, 3, 4],
      life_exact: 3,
      life_range: [],
    };
    return rules;
  }

  toggleState(cell: Cell): void {
    cell.prevState = cell.state;
    if (cell.state == 0) {
      cell.state = 1;
    } else {
      cell.state = 0;
    }
  }

  getDefaultBoard(): Cell[][] {
    let newBoard: Cell[][] = [];
    for (let i = 0; i < this.boardSize; i++) {
      newBoard.push([]);
      for (let j = 0; j < this.boardSize; j++) {
        let deadCell: Cell = { state: 0, prevState: 0 };
        newBoard[i].push(deadCell);
      }
    }
    return newBoard;
  }

  initializeBoardState(): void {
    this.board.next(this.getDefaultBoard());
  }

  getCellState(i: number, j: number): CellState {
    // Out of bounds left/right
    if (i < 0 || i > this.boardSize - 1) {
      return 0;
    }
    // Out of bounds top/bottom
    if (j < 0 || j > this.boardSize - 1) {
      return 0;
    }

    return this.board.value[i][j].state;
  }

  getNeighbours(i: number, j: number): number {
    let currentBoard = this.board.value;
    let neighbourAliveCount = 0;

    // Loop through 8 outer neighbours
    for (let r = i - 1; r <= i + 1; r++) {
      for (let c = j - 1; c <= j + 1; c++) {
        if (r == i && c == j) {
          continue;
        } else {
          neighbourAliveCount += this.getCellState(r, c);
        }
      }
    }

    if (neighbourAliveCount > 0) {
    }
    return neighbourAliveCount;
  }

  getNextState(): Cell[][] {
    let nextBoard: Cell[][] = [];
    nextBoard = this.getDefaultBoard();
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        let neighbours: number = this.getNeighbours(i, j);
        let currentState = this.board.value[i][j].state;

        if (currentState == 1) {
          nextBoard[i][j].prevState = 1;

          // Underpopulation
          if (neighbours < this.rules.value.underpopulation_threshold) {
            nextBoard[i][j].state = 0;
            continue;
          }

          // Overpopulation
          if (neighbours > this.rules.value.overpopulation_threshold) {
            nextBoard[i][j].state = 0;
            continue;
          }

          // Else perservere
          nextBoard[i][j].state = 1;
        }

        if (currentState == 0) {
          // Comes to life
          if (neighbours == this.rules.value.life_exact) {
            nextBoard[i][j].state = 1;
          }
        }
      }
    }
    return nextBoard;
  }

  evolve() {
    let nextState = this.getNextState();
    this.board.next(nextState);
  }

  reset() {
    let emptyBoard = this.getDefaultBoard();
    this.board.next(emptyBoard);
    this.tick.next(0);
    this.stop();
  }

  start() {
    this.tick.next(0);
    this.run.next(true);
    this.interval = window.setInterval(() => {
      this.tick.next(this.tick.value + 1);
      this.evolve();
    }, this.tickRate);
  }

  stop() {
    clearInterval(this.interval);
    this.run.next(false);
  }

  constructor() {}

  ngOnInit() {
    this.initializeRules();
    this.initializeBoardState();
  }
}
