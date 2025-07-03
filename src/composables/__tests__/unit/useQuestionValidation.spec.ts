import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useQuestionValidation } from '../../useQuestionValidation'
import type { Question } from '../../../types/quiz'

// No external dependencies to mock, but show vi.mock usage as requested
vi.mock('vue', async () => await vi.importActual('vue'))

describe('useQuestionValidation', () => {
  let questions: Question[]

  beforeEach(() => {
    questions = [
      {
        id: '1',
        type: 'multiple-choice',
        content: 'What is 2+2?',
        options: ['3', '4'],
        correctAnswers: ['4'],
        explanation: 'Simple math',
      },
    ]
  })

  it('Should validate new question content, options, and correct answers', () => {
    const { newQ, optionsInput, answersInput, validateNew, newErrors } =
      useQuestionValidation(questions)
    newQ.value.content = 'What is the capital of France?'
    optionsInput.value = 'Paris,London,Berlin'
    answersInput.value = 'Paris'
    newQ.value.type = 'multiple-choice'
    const valid = validateNew()
    expect(valid).toBe(true)
    expect(newErrors.value.content).toBe(false)
    expect(newErrors.value.options).toBe(false)
    expect(newErrors.value.correctAnswers).toBe(false)
    expect(newErrors.value.duplicate).toBe(false)
  })

  it('Should prevent duplicate questions', () => {
    const { newQ, optionsInput, answersInput, validateNew, newErrors } =
      useQuestionValidation(questions)
    newQ.value.content = 'What is 2+2?'
    optionsInput.value = '3,4'
    answersInput.value = '4'
    newQ.value.type = 'multiple-choice'
    const valid = validateNew()
    expect(valid).toBe(false)
    expect(newErrors.value.duplicate).toBe(true)
  })

  it('Should require at least one correct answer', () => {
    const { newQ, optionsInput, answersInput, validateNew, newErrors } =
      useQuestionValidation(questions)
    newQ.value.content = 'What is the capital of Germany?'
    optionsInput.value = 'Berlin,Hamburg'
    answersInput.value = ''
    newQ.value.type = 'multiple-choice'
    const valid = validateNew()
    expect(valid).toBe(false)
    expect(newErrors.value.correctAnswers).toBe(true)
    expect(newErrors.value.correctAnswersMsg).toMatch(/at least one correct answer/i)
  })

  it('Should require at least two options for multiple-choice', () => {
    const { newQ, optionsInput, answersInput, validateNew, newErrors } =
      useQuestionValidation(questions)
    newQ.value.content = 'Pick the only option.'
    optionsInput.value = 'OnlyOne'
    answersInput.value = 'OnlyOne'
    newQ.value.type = 'multiple-choice'
    const valid = validateNew()
    expect(valid).toBe(false)
    expect(newErrors.value.options).toBe(true)
  })

  it('Should allow short-text questions without options', () => {
    const { newQ, optionsInput, answersInput, validateNew, newErrors } =
      useQuestionValidation(questions)
    newQ.value.content = 'Explain relativity.'
    newQ.value.type = 'short-text'
    optionsInput.value = ''
    answersInput.value = 'Some answer'
    const valid = validateNew()
    expect(valid).toBe(true)
    expect(newErrors.value.options).toBe(false)
  })

  it('Should not allow correct answers not present in options for multiple-choice', () => {
    const { newQ, optionsInput, answersInput, validateNew, newErrors } =
      useQuestionValidation(questions)
    newQ.value.content = 'Pick the correct color.'
    newQ.value.type = 'multiple-choice'
    optionsInput.value = 'Red,Blue'
    answersInput.value = 'Green'
    const valid = validateNew()
    expect(valid).toBe(false)
    expect(newErrors.value.correctAnswers).toBe(true)
    expect(newErrors.value.correctAnswersMsg).toMatch(/must be present in the options/i)
  })
})
