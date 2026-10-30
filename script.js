// clock
setInterval(function () {
  document.querySelector("#timeElement").innerHTML = new Date().toLocaleString();
}, 1000);
// temperature
function getWeatherEmoji(weatherCode) {
  if (weatherCode === 0) {
    return "☀️";
  }
  if (weatherCode === 1) {
    return "🌤️";
  }
  if (weatherCode === 2) {
    return "🌥️";
  }
  if (weatherCode === 3) {
    return "☁️";
  }
  if ([45, 48].includes(weatherCode)) {
    return "🌫️";
  }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return "🌧️";
  }
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return "❄️";
  }
  if ([95, 96, 99].includes(weatherCode)) {
    return "⛈️";
  }
  return "🌡️";
}

navigator.geolocation.getCurrentPosition(async (position) => {
  const temperatureElement = document.getElementById("temperature");
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    if (!response.ok) {
      throw new Error(`Weather request failed with status ${response.status}`);
    }

    const data = await response.json(); 
    const celsius = data.current_weather.temperature;
    const fahrenheit = (celsius * 9) / 5 + 32;
    const weatherEmoji = getWeatherEmoji(data.current_weather.weathercode);

    temperatureElement.textContent = `${weatherEmoji} ${Math.round(fahrenheit)}°F`;
  } catch (error) {
    console.error("Unable to load weather:", error);
    temperatureElement.textContent = "🌡️ Weather unavailable";
  }
}, () => {
  const temperatureElement = document.getElementById("temperature");
  temperatureElement.textContent = "🌡️ Weather unavailable";
});
// page switching
let current = 0;
function changePage(direction) {
  const pages = document.querySelectorAll('#window .page');

  pages[current].classList.remove('active');
  current = Math.max(0, Math.min(pages.length - 1, current + direction));
  pages[current].classList.add('active');
  updateNavigation();
}
function updateNavigation() {
  const activePage = document.querySelector('#window .page.active');

  if (!activePage) {
    return;
  }

  const previousButton = activePage.querySelector('.prevBtn');
  if (previousButton) {
    previousButton.disabled = current === 0;
  }
  const nextButton = activePage.querySelector('.nextBtn');

  if (nextButton) {
    nextButton.disabled = current === document.querySelectorAll('#window .page').length - 1;
  }
}

function appendMarkdownInline(parent, text) {
  const tokenPattern = /(```[^`]+```|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    parent.append(document.createTextNode(text.slice(lastIndex, match.index)));
    const token = match[0];

    if (token.startsWith("```") && token.endsWith("```")) {
      const code = document.createElement("code");
      code.textContent = token.slice(3, -3);
      parent.append(code);
    } else if (token.startsWith("`")) {
      const code = document.createElement("code");
      code.textContent = token.slice(1, -1);
      parent.append(code);
    } else if (token.startsWith("**")) {
      const strong = document.createElement("strong");
      strong.textContent = token.slice(2, -2);
      parent.append(strong);
    } else if (token.startsWith("*")) {
      const emphasis = document.createElement("em");
      emphasis.textContent = token.slice(1, -1);
      parent.append(emphasis);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (!linkMatch) {
        parent.append(document.createTextNode(token));
      } else {
        const link = document.createElement("a");
        link.textContent = linkMatch[1];
        const href = linkMatch[2];
        const protocol = new URL(href, window.location.href).protocol;
        if (["http:", "https:", "mailto:"].includes(protocol)) {
          link.href = href;
          parent.append(link);
        } else {
          parent.append(document.createTextNode(linkMatch[1]));
        }
      }
    }

    lastIndex = match.index + token.length;
  }

  parent.append(document.createTextNode(text.slice(lastIndex)));
}

function renderMarkdown(markdown, container) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let index = 0;

  function isBlockStart(line) {
    return /^```|^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|^\s*-{3,}\s*$/.test(line);
  }

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const inlineCodeFence = line.match(/^```([^`]+)```(.*)$/);
    if (inlineCodeFence) {
      const paragraph = document.createElement("p");
      const code = document.createElement("code");
      code.textContent = inlineCodeFence[1];
      paragraph.append(code);
      paragraph.append(document.createTextNode(inlineCodeFence[2]));
      container.append(paragraph);
      index += 1;
      continue;
    }

    if (/^```/.test(line)) {
      index += 1;
      const codeLines = [];
      while (index < lines.length && !/^```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }

      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = codeLines.join("\n");
      pre.append(code);
      container.append(pre);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const heading = document.createElement(`h${headingMatch[1].length}`);
      appendMarkdownInline(heading, headingMatch[2]);
      container.append(heading);
      index += 1;
      continue;
    }

    if (/^\s*-{3,}\s*$/.test(line)) {
      container.append(document.createElement("hr"));
      index += 1;
      continue;
    }

    const listMatch = line.match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const list = document.createElement(/^\d/.test(listMatch[1]) ? "ol" : "ul");
      while (index < lines.length) {
        const itemMatch = lines[index].match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
        if (!itemMatch || /^\d/.test(itemMatch[1]) !== (list.tagName === "OL")) {
          break;
        }
        const item = document.createElement("li");
        appendMarkdownInline(item, itemMatch[2]);
        list.append(item);
        index += 1;
      }
      container.append(list);
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    const paragraph = document.createElement("p");
    appendMarkdownInline(paragraph, paragraphLines.join(" "));
    container.append(paragraph);
  }
}

async function loadReadme() {
  const readmeContent = document.getElementById("readmeContent");
  if (!readmeContent) {
    return;
  }

  try {
    const response = await fetch("README.md");
    if (!response.ok) {
      throw new Error(`README request failed with status ${response.status}`);
    }

    readmeContent.replaceChildren();
    renderMarkdown(await response.text(), readmeContent);
    readmeContent.setAttribute("aria-busy", "false");
  } catch (error) {
    console.error("Unable to load README.md:", error);
    readmeContent.replaceChildren();
    const message = document.createElement("p");
    message.className = "readme-error";
    message.textContent = "The README could not be loaded. Open README.md to read it instead.";
    const link = document.createElement("a");
    link.href = "README.md";
    link.textContent = "Open README.md";
    readmeContent.append(message, link);
    readmeContent.setAttribute("aria-busy", "false");
  }
}

// close & open onboarding window
let highestWindowLayer = 1;

function bringToFront(element) {
  if (!element) {
    return;
  }

  highestWindowLayer += 1;
  element.style.zIndex = highestWindowLayer;
}

document.querySelectorAll("#window, #noteswindow, #gdevwindow, #gdevcopywindow, #googlewindow, #aiwindow").forEach((windowElement) => {
  windowElement.addEventListener("pointerdown", () => bringToFront(windowElement));
});

function finishOnboarding() {
  document.getElementById("window").style.display = "none";
}
function startOnboarding() {
  const onboardingWindow = document.getElementById("window");
  const pages = document.querySelectorAll('#window .page');

  bringToFront(onboardingWindow);
  document.getElementById("window").style.display = "block";
  document.getElementById("window").style.top = "50%";
  document.getElementById("window").style.left = "50%";
  document.getElementById("window").style.transform = "translate(-50%, -50%)";

  pages.forEach((page) => {
    page.classList.remove('active');
  });

  pages[0].classList.add('active');
  current = 0;
  updateNavigation();
}
// Window dragging
function dragElement(element) {
  if (!element) {
    return;
  }

  const header = document.getElementById(`${element.id}header`) || element;
  let startX = 0;
  let startY = 0;

  header.addEventListener("mousedown", startDragging);

  function startDragging(event) {
    if (event.target.closest("button, a, iframe, .resize-handle")) {
      return;
    }

    event.preventDefault();
    bringToFront(element);
    startX = event.clientX;
    startY = event.clientY;
    document.addEventListener("mousemove", moveWindow);
    document.addEventListener("mouseup", stopDragging, { once: true });
  }

  function moveWindow(event) {
    element.style.left = `${element.offsetLeft + event.clientX - startX}px`;
    element.style.top = `${element.offsetTop + event.clientY - startY}px`;
    startX = event.clientX;
    startY = event.clientY;
  }

  function stopDragging() {
    document.removeEventListener("mousemove", moveWindow);
  }
}

dragElement(document.getElementById("window"));
// easter egg
let clickCount = 0;
const button = document.getElementById('beatle!');
const audio = document.getElementById('help');

if (button && audio) {
  audio.volume = 0.2;

  button.addEventListener('click', () => {
    clickCount += 1;

    if (clickCount >= 5) {
      clickCount = 0;
      audio.currentTime = 0;
      audio.play().catch((error) => {
        console.error('Unable to play help.mp3:', error);
      });
    }
  });
}
// icon click
let selectedIcon = null;

function selectIcon(element) {
  element.classList.add("selected");
  selectedIcon = element;
} 
function deselectIcon(element) {
  element.classList.remove("selected");
  if (selectedIcon === element) {
    selectedIcon = null;
  }
}
function handleIconTap(element) {
  if (selectedIcon === element) {
    deselectIcon(element);
    return;
  }

  if (selectedIcon) {
    deselectIcon(selectedIcon);
  }

  selectIcon(element);
}
function handleIconKeydown(event, element) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleIconTap(element);
  }
}

dragElement(document.getElementById("noteswindow"));
dragElement(document.getElementById("gdevwindow"));
dragElement(document.getElementById("gdevcopywindow"));
dragElement(document.getElementById("googlewindow"));
dragElement(document.getElementById("aiwindow"));
// close & open notes window
function closenotes() {
  document.getElementById("noteswindow").style.display = "none";
}
function openNotes() {
  const onboardingWindow = document.getElementById("noteswindow");

  bringToFront(onboardingWindow);
  onboardingWindow.style.display = "block";
  onboardingWindow.style.top = "50%";
  onboardingWindow.style.left = "50%";
  onboardingWindow.style.transform = "translate(-50%, -50%)";

  loadNotes();

  const infoNote = notes.find((note) => note.title === "Info");
  activeNoteId = infoNote ? infoNote.id : notes[0].id;

  loadActiveNote();
  renderNotesTabs();

}

function closeGdev() {
  document.getElementById("gdevwindow").style.display = "none";
}

function openGdev() {
  const gdevWindow = document.getElementById("gdevwindow");

  bringToFront(gdevWindow);
  gdevWindow.style.display = "block";
  gdevWindow.style.top = "50%";
  gdevWindow.style.left = "50%";
  gdevWindow.style.transform = "translate(-50%, -50%)";
}

function closeGdevCopy() {
  document.getElementById("gdevcopywindow").style.display = "none";
}

function openGdevCopy() {
  const gdevCopyWindow = document.getElementById("gdevcopywindow");

  bringToFront(gdevCopyWindow);
  gdevCopyWindow.style.display = "block";
  gdevCopyWindow.style.top = "calc(50% + 30px)";
  gdevCopyWindow.style.left = "calc(50% + 30px)";
  gdevCopyWindow.style.transform = "translate(-50%, -50%)";
}

function closeGoogle() {
  document.getElementById("googlewindow").style.display = "none";
}

function openGoogle() {
  const googleWindow = document.getElementById("googlewindow");

  if (!googleWindow) {
    return;
  }

  bringToFront(googleWindow);
  googleWindow.style.display = "block";
  googleWindow.style.top = "calc(50% + 30px)";
  googleWindow.style.left = "calc(50% + 30px)";
  googleWindow.style.transform = "translate(-50%, -50%)";
}

function closeAI() {
  document.getElementById("aiwindow").style.display = "none";
}

function openAI() {
  const assistantWindow = document.getElementById("aiwindow");
  bringToFront(assistantWindow);
  assistantWindow.style.display = "block";
  assistantWindow.style.top = "50%";
  assistantWindow.style.left = "50%";
  assistantWindow.style.transform = "translate(-50%, -50%)";
}

const browserShell = document.getElementById("browserShell");
const browserAddressInput = document.getElementById("browserAddress");
const browserAddressForm = document.getElementById("browserAddressForm");
const browserHomeForm = document.getElementById("browserHomeForm");
const browserHomeSearch = document.getElementById("browserHomeSearch");
const browserResults = document.getElementById("browserResults");
const browserProgress = document.getElementById("browserProgress");
const browserProgressFill = document.getElementById("browserProgressFill");
const browserBackButton = document.getElementById("browserBack");
const browserForwardButton = document.getElementById("browserForward");
const browserReloadButton = document.getElementById("browserReload");
const browserHistory = [{ home: true, address: "" }];
let browserHistoryIndex = 0;
let browserProgressValue = 0;
let browserProgressInterval = null;
let browserProgressTimeout = null;
let browserProgressFallback = null;

function updateBrowserNavigationButtons() {
  browserBackButton.disabled = browserHistoryIndex <= 0;
  browserForwardButton.disabled = browserHistoryIndex >= browserHistory.length - 1;
  browserReloadButton.disabled = browserHistory[browserHistoryIndex].home;
}

function startBrowserLoading() {
  clearInterval(browserProgressInterval);
  clearTimeout(browserProgressTimeout);
  clearTimeout(browserProgressFallback);
  browserProgressValue = 8;
  browserProgress.classList.add("is-loading");
  browserProgressFill.style.width = `${browserProgressValue}%`;
  browserProgressInterval = setInterval(() => {
    browserProgressValue = Math.min(90, browserProgressValue + Math.max(1, (90 - browserProgressValue) * 0.12));
    browserProgressFill.style.width = `${browserProgressValue}%`;
  }, 120);
  browserProgressFallback = setTimeout(finishBrowserLoading, 15000);
}

function finishBrowserLoading() {
  if (!browserProgress.classList.contains("is-loading")) {
    return;
  }

  clearInterval(browserProgressInterval);
  clearTimeout(browserProgressFallback);
  browserProgressFill.style.width = "100%";
  browserProgressTimeout = setTimeout(() => {
    browserProgress.classList.remove("is-loading");
    browserProgressFill.style.width = "0";
  }, 180);
}

function createBrowserDestination(value) {
  const address = value.trim();
  if (!address) {
    return null;
  }

  try {
    if (/^https?:\/\//i.test(address)) {
      const url = new URL(address);
      return { url: url.href, address: url.href, search: false };
    }

    if (!/\s/.test(address) && /^[\w.-]+\.[a-z]{2,}(?::\d+)?(?:\/.*)?$/i.test(address)) {
      const url = new URL(`https://${address}`);
      return { url: url.href, address: url.href, search: false };
    }
  } catch (error) {
    // Treat malformed addresses as search terms.
  }

  const url = new URL("https://mojeek.com");
  url.searchParams.set("q", address);
  url.searchParams.set("ved", "1t:244952");
  return { url: url.href, address, query: address, search: true };
}

function showBrowserHistoryEntry(index) {
  browserHistoryIndex = index;
  const entry = browserHistory[browserHistoryIndex];
  browserAddressInput.value = entry.query || entry.address;

  if (entry.home) {
    browserShell.classList.remove("is-results");
  } else {
    browserShell.classList.add("is-results");
    startBrowserLoading();
    if (entry.search) {
      browserAddressForm.submit();
    } else {
      browserResults.src = entry.url;
    }
  }

  updateBrowserNavigationButtons();
}

function navigateBrowser(value) {
  const destination = createBrowserDestination(value);
  if (!destination) {
    return;
  }

  browserHistory.splice(browserHistoryIndex + 1);
  browserHistory.push({ ...destination, home: false });
  showBrowserHistoryEntry(browserHistory.length - 1);
}

browserAddressForm.addEventListener("submit", (event) => {
  event.preventDefault();
  navigateBrowser(browserAddressInput.value);
});

browserHomeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  navigateBrowser(browserHomeSearch.value);
});

browserBackButton.addEventListener("click", () => {
  if (browserHistoryIndex > 0) {
    showBrowserHistoryEntry(browserHistoryIndex - 1);
  }
});

browserForwardButton.addEventListener("click", () => {
  if (browserHistoryIndex < browserHistory.length - 1) {
    showBrowserHistoryEntry(browserHistoryIndex + 1);
  }
});

browserReloadButton.addEventListener("click", () => {
  const entry = browserHistory[browserHistoryIndex];
  if (!entry.home) {
    startBrowserLoading();
    if (entry.search) {
      browserAddressForm.submit();
    } else {
      browserResults.src = entry.url;
    }
  }
});

browserResults.addEventListener("load", finishBrowserLoading);
updateBrowserNavigationButtons();

function createNoteId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

let notes = [
  {
    id: createNoteId(),
    title: "Info",
    text: "Pronotes v1.0.2 To start click the plus at the top of your screen to create a new note then just type your notes autosave!"
  }
];
let activeNoteId = notes[0].id;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderNotesTabs() {
  const tabs = document.getElementById("notesTabs");

  if (!tabs) {
    return;
  }

  tabs.innerHTML = notes.map((note) => `
    <div
      class="note-tab ${note.id === activeNoteId ? "active" : ""}"
      onclick="selectNote('${note.id}')"
    >
      <span>${escapeHtml(note.title || "Untitled")}</span>
      <button
        type="button"
        onclick="closeNote(event, '${note.id}')"
        aria-label="Close note"
      >x</button>
    </div>
  `).join("") + `
    <button type="button" class="new-note-tab" onclick="createNote()" aria-label="New note">+</button>
  `;
}

function loadActiveNote() {
  const note = notes.find((item) => item.id === activeNoteId);
  const textInput = document.getElementById("noteText");
  const noteEditor = document.getElementById("noteEditor");
  const noteGuide = document.getElementById("noteGuide");

  if (!note || !textInput || !noteEditor || !noteGuide) {
    return;
  }

  const isInfoNote = note.title === "Info";

  noteEditor.style.display = isInfoNote ? "none" : "block";
  noteGuide.style.display = isInfoNote ? "block" : "none";

  if (isInfoNote) {
    noteGuide.textContent = note.text;
    return;
  }

  textInput.value = note.text;
}

function selectNote(noteId) {
  saveCurrentNote();
  activeNoteId = noteId;
  loadActiveNote();
  renderNotesTabs();
}

function createNote() {
  saveCurrentNote();

  const newNote = {
    id: createNoteId(),
    title: "Untitled note",
    text: ""
  };

  notes.push(newNote);
  activeNoteId = newNote.id;
  loadActiveNote();
  renderNotesTabs();
  saveNotes();
}

function closeNote(event, noteId) {
  event.stopPropagation();

  if (notes.length === 1) {
    return;
  }

  notes = notes.filter((note) => note.id !== noteId);

  if (activeNoteId === noteId) {
    activeNoteId = notes[notes.length - 1].id;
  }

  loadActiveNote();
  renderNotesTabs();
  saveNotes();
}

function saveCurrentNote() {
  const note = notes.find((item) => item.id === activeNoteId);
  const textInput = document.getElementById("noteText");

  if (!note || note.title === "Info" || !textInput) {
    return;
  }

  note.text = textInput.value;
  saveNotes();
  renderNotesTabs();
}

function saveNotes() {
  try {
    localStorage.setItem("proNotes", JSON.stringify(notes));
  } catch (error) {
    console.error("Could not save ProNotes:", error);
  }
}

function loadNotes() {
  let savedNotes;

  try {
    savedNotes = localStorage.getItem("proNotes");
  } catch (error) {
    console.error("Could not access ProNotes localStorage:", error);
    return;
  }

  if (!savedNotes) {
    return;
  }

  try {
    const parsedNotes = JSON.parse(savedNotes);

    const validNotes = Array.isArray(parsedNotes)
      ? parsedNotes.filter((note) => note && note.id && typeof note.text === "string")
      : [];

    if (validNotes.length > 0) {
      notes = validNotes.map((note) => ({
        id: String(note.id),
        title: note.title === "Info" ? "Info" : String(note.title || "Untitled note"),
        text: note.text
      }));
      activeNoteId = notes[0].id;
    }
  } catch (error) {
    console.error("Could not load ProNotes from localStorage:", error);
  }
}

const noteTextInput = document.getElementById("noteText");

if (noteTextInput) {
  noteTextInput.addEventListener("input", saveCurrentNote);
  loadNotes();
  loadActiveNote();
  renderNotesTabs();
}

updateNavigation();
loadReadme();

const notesContent = document.querySelector("#noteswindow .onboarding");
const notesWindow = document.getElementById("noteswindow");
const gdevContent = document.querySelector("#gdevwindow .gdev-content");
const gdevWindow = document.getElementById("gdevwindow");
const gdevCopyContent = document.querySelector("#gdevcopywindow .gdev-content");
const gdevCopyWindow = document.getElementById("gdevcopywindow");
const googleContent = document.querySelector("#googlewindow .gdev-content");
const googleWindow = document.getElementById("googlewindow");
const aiContent = document.querySelector("#aiwindow .gdev-content");
const aiWindow = document.getElementById("aiwindow");

if (notesContent && notesWindow && "ResizeObserver" in window) {
  const notesResizeObserver = new ResizeObserver(() => {
    notesWindow.style.width = `${notesContent.offsetWidth}px`;
  });

  notesResizeObserver.observe(notesContent);
}

if (gdevContent && gdevWindow && "ResizeObserver" in window) {
  const gdevResizeObserver = new ResizeObserver(() => {
    gdevWindow.style.width = `${gdevContent.offsetWidth}px`;
  });

  gdevResizeObserver.observe(gdevContent);
}

if (gdevCopyContent && gdevCopyWindow && "ResizeObserver" in window) {
  const gdevCopyResizeObserver = new ResizeObserver(() => {
    gdevCopyWindow.style.width = `${gdevCopyContent.offsetWidth}px`;
  });

  gdevCopyResizeObserver.observe(gdevCopyContent);
}

if (googleContent && googleWindow && "ResizeObserver" in window) {
  const googleResizeObserver = new ResizeObserver(() => {
    googleWindow.style.width = `${googleContent.offsetWidth}px`;
  });

  googleResizeObserver.observe(googleContent);
}

if (aiContent && aiWindow && "ResizeObserver" in window) {
  const aiResizeObserver = new ResizeObserver(() => {
    aiWindow.style.width = `${aiContent.offsetWidth}px`;
  });

  aiResizeObserver.observe(aiContent);
}

function startNotesResize(event, axis) {
  startWindowResize(event, axis, "noteswindow");
}

function startWindowResize(event, axis, windowId) {
  event.preventDefault();
  event.stopPropagation();

  const windowElement = document.getElementById(windowId);
  if (!windowElement) {
    return;
  }

  const content = windowElement.querySelector(".onboarding, .gdev-content") || windowElement;
  const windowBounds = windowElement.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = content.offsetWidth;
  const startHeight = content.offsetHeight;
  const startLeft = windowBounds.left;

  windowElement.style.transform = "none";
  windowElement.style.left = `${startLeft}px`;
  windowElement.style.top = `${windowBounds.top}px`;

  const pointerId = event.pointerId;
  content.setPointerCapture(pointerId);

  function resize(resizeEvent) {
    if (axis === "width" || axis === "both") {
      const width = Math.max(300, Math.min(window.innerWidth * 0.9, startWidth + resizeEvent.clientX - startX));
      content.style.width = `${width}px`;
    }
    if (axis === "left") {
      const rightEdge = startLeft + startWidth;
      const leftEdge = Math.max(0, Math.min(rightEdge - 300, startLeft + resizeEvent.clientX - startX));
      content.style.width = `${rightEdge - leftEdge}px`;
      windowElement.style.left = `${leftEdge}px`;
    }
    if (axis === "height" || axis === "both") {
      const height = Math.max(180, Math.min(window.innerHeight - 80, startHeight + resizeEvent.clientY - startY));
      content.style.height = `${height}px`;
    }
  }

  function stopResize() {
    if (content.hasPointerCapture(pointerId)) {
      content.releasePointerCapture(pointerId);
    }
    content.removeEventListener("pointermove", resize);
    content.removeEventListener("pointerup", stopResize);
    content.removeEventListener("pointercancel", stopResize);
  }

  content.addEventListener("pointermove", resize);
  content.addEventListener("pointerup", stopResize);
  content.addEventListener("pointercancel", stopResize);
}