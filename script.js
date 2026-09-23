// clock
setInterval(function () {
  document.querySelector("#timeElement").innerHTML = new Date().toLocaleString();
}, 1000);
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
// close & open onboarding window
let highestWindowLayer = 1;

function bringToFront(element) {
  if (!element) {
    return;
  }

  highestWindowLayer += 1;
  element.style.zIndex = highestWindowLayer;
}

document.querySelectorAll("#window, #noteswindow, #gdevwindow").forEach((windowElement) => {
  windowElement.addEventListener("pointerdown", () => bringToFront(windowElement));
});

function finishOnboarding() {
  document.getElementById("window").style.display = "none";
}
function startOnboarding() {
  const onboardingWindow = document.getElementById("window");
  const pages = document.querySelectorAll('#window .page');

  bringToFront(onboardingWindow);
  document.getElementById("window").style.display = "";
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
// onboarding window dragging
dragElement(document.getElementById("window"));
function dragElement(element) {
  var initialX = 0;
  var initialY = 0;
  var currentX = 0;
  var currentY = 0;
  if (document.getElementById(element.id + "header")) {
    document.getElementById(element.id + "header").onmousedown = startDragging;
  } else {
    element.onmousedown = startDragging;
  }
  function startDragging(e) {
    e = e || window.event;
    e.preventDefault();
    initialX = e.clientX;
    initialY = e.clientY;
    document.onmouseup = stopDragging;
    document.onmousemove = dragElement;
  }
  function dragElement(e) {
    e = e || window.event;
    e.preventDefault();
    currentX = initialX - e.clientX;
    currentY = initialY - e.clientY;
    initialX = e.clientX;
    initialY = e.clientY;
    element.style.top = (element.offsetTop - currentY) + "px";
    element.style.left = (element.offsetLeft - currentX) + "px";
  }
  function stopDragging() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
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
// notes window dragging
dragElement(document.getElementById("noteswindow"));
function dragElement(element) {
  var initialX = 0;
  var initialY = 0;
  var currentX = 0;
  var currentY = 0;
  if (document.getElementById(element.id + "header")) {
    document.getElementById(element.id + "header").onmousedown = startDragging;
  } else {
    element.onmousedown = startDragging;
  }
  function startDragging(e) {
    e = e || window.event;
    e.preventDefault();
    initialX = e.clientX;
    initialY = e.clientY;
    document.onmouseup = stopDragging;
    document.onmousemove = dragElement;
  }
  function dragElement(e) {
    e = e || window.event;
    e.preventDefault();
    currentX = initialX - e.clientX;
    currentY = initialY - e.clientY;
    initialX = e.clientX;
    initialY = e.clientY;
    element.style.top = (element.offsetTop - currentY) + "px";
    element.style.left = (element.offsetLeft - currentX) + "px";
  }
  function stopDragging() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
  dragElement(document.getElementById("gdevwindow"));
// close & open notes window
function closenotes() {
  document.getElementById("noteswindow").style.display = "none";
}
function openNotes() {
  const onboardingWindow = document.getElementById("noteswindow");

  bringToFront(onboardingWindow);
  onboardingWindow.style.display = "";
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
  gdevWindow.style.display = "";
  gdevWindow.style.top = "50%";
  gdevWindow.style.left = "50%";
  gdevWindow.style.transform = "translate(-50%, -50%)";
}

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

const notesContent = document.querySelector("#noteswindow .onboarding");
const notesWindow = document.getElementById("noteswindow");
const gdevContent = document.querySelector("#gdevwindow .gdev-content");
const gdevWindow = document.getElementById("gdevwindow");

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
