function warnUnhandledLayoutEditorCommand(command) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return
  if (typeof console?.warn === 'function') {
    console.warn(`[layout-editor] Unhandled command: ${command.type}`)
  }
}

export function runLayoutEditorCommands(commands, handlers, { onUnhandledCommand = warnUnhandledLayoutEditorCommand } = {}) {
  commands.forEach((command) => {
    const handler = handlers[command.type]
    if (typeof handler === 'function') {
      handler(command)
      return
    }

    onUnhandledCommand?.(command)
  })
}
