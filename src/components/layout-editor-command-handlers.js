export function createLayoutEditorToolbarHandlers(editor) {
  return {
    undo: () => editor.undo(),
    'cycle-color': () => editor.cycleColor(),
    'rotate-selected': () => editor.rotateSelected(),
    'set-active-tool': (command) => editor.setActiveTool(command.value),
  }
}

export function createLayoutEditorActionHandlers({ navigate, openOverlay, addToCart, editor, selectedMeta }) {
  return {
    navigate: (command) => navigate(command.value),
    'open-overlay': (command) => openOverlay(command.value),
    'add-selected-to-cart': () => {
      if (selectedMeta) addToCart(selectedMeta)
    },
    'reset-layout': () => editor.reset(),
  }
}
