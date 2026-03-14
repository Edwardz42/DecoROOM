const { DIFFICULTY } = require('../constants/gameConstants');

const questionBank = [
  {
    id: 'q1',
    rarity: 'common',
    topic: 'dsa',
    difficulty: DIFFICULTY.EASY,
    question: 'What is the time complexity of linear search in the worst case?',
    answer: 'O(n)'
  },
  {
    id: 'q2',
    rarity: 'common',
    topic: 'algorithms',
    difficulty: DIFFICULTY.EASY,
    question: 'What data structure uses FIFO ordering?',
    answer: 'queue'
  },
  {
    id: 'q3',
    rarity: 'rare',
    topic: 'javascript',
    difficulty: DIFFICULTY.MEDIUM,
    question: 'What does JSON stand for?',
    answer: 'JavaScript Object Notation'
  },
  {
    id: 'q4',
    rarity: 'rare',
    topic: 'dsa',
    difficulty: DIFFICULTY.MEDIUM,
    question: 'Which traversal of a BST returns values in sorted order?',
    answer: 'inorder'
  },
  {
    id: 'q5',
    rarity: 'epic',
    topic: 'algorithms',
    difficulty: DIFFICULTY.HARD,
    question: 'What is the average time complexity of quicksort?',
    answer: 'O(n log n)'
  },
  {
    id: 'q6',
    rarity: 'epic',
    topic: 'systems',
    difficulty: DIFFICULTY.HARD,
    question: 'What does TCP guarantee that UDP does not?',
    answer: 'reliable ordered delivery'
  },
  {
    id: 'q7',
    rarity: 'common',
    topic: 'algorithms',
    difficulty: DIFFICULTY.EASY,
    question: 'What is the best-case time complexity of binary search?',
    answer: 'O(1)'
  },
  {
    id: 'q8',
    rarity: 'rare',
    topic: 'javascript',
    difficulty: DIFFICULTY.MEDIUM,
    question: 'Which keyword declares a block-scoped variable in JavaScript?',
    answer: 'let'
  },
  {
    id: 'q9',
    rarity: 'legendary',
    topic: 'dsa',
    difficulty: DIFFICULTY.HARD,
    question: 'Which data structure is typically used to implement Dijkstra efficiently?',
    answer: 'priority queue'
  },
  {
    id: 'q10',
    rarity: 'common',
    topic: 'networks',
    difficulty: DIFFICULTY.EASY,
    question: 'What does HTTP stand for?',
    answer: 'HyperText Transfer Protocol'
  },
  {
    id: 'q11',
    rarity: 'rare',
    topic: 'os',
    difficulty: DIFFICULTY.MEDIUM,
    question: 'What scheduling algorithm gives each process a fixed time slice?',
    answer: 'round robin'
  },
  {
    id: 'q12',
    rarity: 'legendary',
    topic: 'algorithms',
    difficulty: DIFFICULTY.HARD,
    question: 'What paradigm does merge sort use?',
    answer: 'divide and conquer'
  }
];

module.exports = questionBank;