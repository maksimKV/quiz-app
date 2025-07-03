import { ref, computed } from 'vue'
import type { Question, QuestionType } from '../types/quiz'

export function useQuestionValidation(questions: Question[], initial?: Partial<Question>) {
  const newQ = ref<Partial<Question>>(initial || {
    type: 'multiple-choice',
    content: '',
    options: [],
    correctAnswers: [],
    explanation: '',
  })
  const optionsInput = ref('')
  const answersInput = ref('')
  const newErrors = ref({
    content: false,
    duplicate: false,
    options: false,
    correctAnswers: false,
    explanation: false,
  })

  const canAdd = computed(() => {
    if (!newQ.value.content) return false
    if (
      questions.some(
        q => q.content.trim().toLowerCase() === newQ.value.content?.trim().toLowerCase()
      )
    )
      return false
    if (newQ.value.type !== 'short-text') {
      const opts = optionsInput.value
        .split(',')
        .map(o => o.trim())
        .filter(Boolean)
      if (opts.length < 2 || new Set(opts).size !== opts.length) return false
    }
    const corrects = answersInput.value
      .split(',')
      .map(a => a.trim())
      .filter(Boolean)
    if (corrects.length < 1) return false
    // Explanation required if there are incorrect options
    if (newQ.value.type !== 'short-text') {
      const opts = optionsInput.value
        .split(',')
        .map(o => o.trim())
        .filter(Boolean)
      const incorrectOpts = opts.filter(opt => !corrects.includes(opt))
      if (incorrectOpts.length > 0 && !newQ.value.explanation) return false
    }
    return true
  })

  function validateNew() {
    newErrors.value.content = !newQ.value.content
    newErrors.value.duplicate = questions.some(
      q => q.content.trim().toLowerCase() === newQ.value.content?.trim().toLowerCase()
    )
    if (newQ.value.type !== 'short-text') {
      const opts = optionsInput.value
        .split(',')
        .map(o => o.trim())
        .filter(Boolean)
      newErrors.value.options = opts.length < 2 || new Set(opts).size !== opts.length
    } else {
      newErrors.value.options = false
    }
    const corrects = answersInput.value
      .split(',')
      .map(a => a.trim())
      .filter(Boolean)
    newErrors.value.correctAnswers = corrects.length < 1
    // Explanation required if there are incorrect options
    if (newQ.value.type !== 'short-text') {
      const opts = optionsInput.value
        .split(',')
        .map(o => o.trim())
        .filter(Boolean)
      const incorrectOpts = opts.filter(opt => !corrects.includes(opt))
      newErrors.value.explanation = incorrectOpts.length > 0 && !newQ.value.explanation
    } else {
      newErrors.value.explanation = false
    }
    return (
      !newErrors.value.content &&
      !newErrors.value.duplicate &&
      !newErrors.value.options &&
      !newErrors.value.correctAnswers &&
      !newErrors.value.explanation
    )
  }

  function resetNewQ() {
    newQ.value = {
      type: 'multiple-choice',
      content: '',
      options: [],
      correctAnswers: [],
      explanation: '',
    }
    optionsInput.value = ''
    answersInput.value = ''
  }

  function parseOptions() {
    return newQ.value.type !== 'short-text'
      ? optionsInput.value
          .split(',')
          .map(o => o.trim())
          .filter(Boolean)
      : []
  }

  function parseCorrectAnswers() {
    return answersInput.value
      .split(',')
      .map(a => a.trim())
      .filter(Boolean)
  }

  return {
    newQ,
    optionsInput,
    answersInput,
    newErrors,
    canAdd,
    validateNew,
    resetNewQ,
    parseOptions,
    parseCorrectAnswers,
  }
} 