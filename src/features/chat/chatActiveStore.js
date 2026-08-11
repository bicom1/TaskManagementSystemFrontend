/** Tracks which conversation is open so global toasts can stay quiet in-thread */
let activeConversationId = null;

export function setActiveChatId(id) {
  activeConversationId = id ? String(id) : null;
}

export function getActiveChatId() {
  return activeConversationId;
}
