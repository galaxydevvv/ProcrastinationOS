const systemPrompt = "You are a general knowledge AI assistant. Give concise answers.";
const settingsToggle = document.getElementById("settingsToggle");
const chatSettings = document.getElementById("chatSettings");
const proxyUrlInput = document.getElementById("proxyUrl");
const saveProxyUrlButton = document.getElementById("saveProxyUrl");
const apiKeyInput = document.getElementById("apiKey");
const saveApiKeyButton = document.getElementById("saveApiKey");
const chatMessages = document.getElementById("chatMessages");
const chatStatus = document.getElementById("chatStatus");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");
const clearChatButton = document.getElementById("clearChat");

let apiKey = "";
let proxyUrl = "";
let conversation = [];
let isSending = false;

function addMessage(role, text, isError = false) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}${isError ? " error" : ""}`;
  message.textContent = text;
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function resetConversation() {
  conversation = [];
  chatMessages.replaceChildren();
  addMessage("assistant", "Hello! I am a front-end powered AI. How can I help?");
  chatStatus.textContent = proxyUrl && apiKey
    ? "Ready to chat with Hack Club AI."
    : "Set your Cloudflare Worker URL and Hack Club AI API key to start chatting.";
}

function loadProxyUrl() {
  try {
    proxyUrl = localStorage.getItem("hackClubAiProxyUrl") || "";
    proxyUrlInput.value = proxyUrl;
    chatStatus.textContent = proxyUrl && apiKey
      ? "Ready to chat with Hack Club AI."
      : "Set your Cloudflare Worker URL and Hack Club AI API key to start chatting.";
  } catch (error) {
    console.error("Could not load the saved Worker URL:", error);
    chatStatus.textContent = "Could not load the saved Worker URL. Enter it again to continue.";
  }
}

function saveProxyUrl() {
  let parsedUrl;
  try {
    parsedUrl = new URL(proxyUrlInput.value.trim());
  } catch (error) {
    chatStatus.textContent = "Enter a valid Cloudflare Worker URL ending in /chat.";
    proxyUrlInput.focus();
    return;
  }

  const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(parsedUrl.hostname);
  if (
    (parsedUrl.protocol !== "https:" && !(isLocalDevelopment && parsedUrl.protocol === "http:"))
    || parsedUrl.pathname !== "/chat"
    || parsedUrl.search
    || parsedUrl.hash
    || parsedUrl.username
    || parsedUrl.password
  ) {
    chatStatus.textContent = "Use an HTTPS Worker URL ending in /chat (HTTP is allowed only for localhost).";
    proxyUrlInput.focus();
    return;
  }

  proxyUrl = parsedUrl.href.replace(/\/+$/, "");
  proxyUrlInput.value = proxyUrl;
  try {
    localStorage.setItem("hackClubAiProxyUrl", proxyUrl);
    chatStatus.textContent = apiKey
      ? "Worker URL saved. Your API key is not saved."
      : "Worker URL saved. Add your Hack Club AI API key to start chatting.";
  } catch (error) {
    console.error("Could not save the Worker URL:", error);
    chatStatus.textContent = "Worker URL is set for this session but could not be saved in this browser.";
  }
}

function setApiKey() {
  apiKey = apiKeyInput.value.trim();
  apiKeyInput.value = "";
  chatStatus.textContent = apiKey
    ? (proxyUrl ? "Ready to chat with Hack Club AI." : "API key set for this page session only.")
    : "Enter your Hack Club AI API key to start chatting.";
  if (proxyUrl && apiKey) {
    chatSettings.hidden = true;
    settingsToggle.setAttribute("aria-expanded", "false");
  }
}

async function sendMessage(messageText) {
  const userMessage = { role: "user", content: messageText };
  const requestMessages = [
    { role: "system", content: systemPrompt },
    ...conversation,
    userMessage
  ];

  isSending = true;
  sendButton.disabled = true;
  chatInput.disabled = true;
  addMessage("user", messageText);
  chatStatus.textContent = "Assistant is thinking...";

  try {
    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ messages: requestMessages })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const detail = errorBody?.error?.message;
      throw new Error(detail || `Chat request failed (${response.status}). Check your Worker URL and Hack Club AI API key.`);
    }

    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("The chat service returned an empty response.");
    }

    conversation.push(userMessage, { role: "assistant", content: answer });
    addMessage("assistant", answer);
    chatStatus.textContent = " ";
  } catch (error) {
    console.error("Unable to send chat message:", error);
    const message = error instanceof TypeError
      ? "Could not reach your Cloudflare Worker. Check the Worker URL, its allowed origins, and your network."
      : error.message;
    addMessage("assistant", message, true);
    chatStatus.textContent = "Message was not sent.";
  } finally {
    isSending = false;
    sendButton.disabled = false;
    chatInput.disabled = false;
    chatInput.focus();
  }
}

settingsToggle.addEventListener("click", () => {
  chatSettings.hidden = !chatSettings.hidden;
  settingsToggle.setAttribute("aria-expanded", String(!chatSettings.hidden));
  if (!chatSettings.hidden) {
    apiKeyInput.focus();
  }
});

saveProxyUrlButton.addEventListener("click", saveProxyUrl);

proxyUrlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveProxyUrl();
  }
});

saveApiKeyButton.addEventListener("click", setApiKey);

apiKeyInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    setApiKey();
  }
});

clearChatButton.addEventListener("click", resetConversation);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isSending) {
    return;
  }
  if (!apiKey) {
    chatSettings.hidden = false;
    settingsToggle.setAttribute("aria-expanded", "true");
    apiKeyInput.focus();
    chatStatus.textContent = "Enter your Hack Club AI API key to send a message.";
    return;
  }
  if (!proxyUrl) {
    chatSettings.hidden = false;
    settingsToggle.setAttribute("aria-expanded", "true");
    proxyUrlInput.focus();
    chatStatus.textContent = "Set your Cloudflare Worker URL before sending a message.";
    return;
  }

  const message = chatInput.value.trim();
  if (!message) {
    return;
  }
  chatInput.value = "";
  sendMessage(message);
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

resetConversation();
loadProxyUrl();
