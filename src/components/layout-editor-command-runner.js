export function runLayoutEditorCommands(commands, handlers) {
  commands.forEach((command) => {
    const handler = handlers[command.type]
    if (typeof handler === 'function') {
      handler(command)
    }
  })
}
