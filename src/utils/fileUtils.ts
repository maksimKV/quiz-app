export function downloadJson(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function readJsonFile<T = Record<string, any>>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target?.result as string)
        resolve(data as T)
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
