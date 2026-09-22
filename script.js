// clock
setInterval(function () {
  document.querySelector("#timeElement").innerHTML = new Date().toLocaleString();
}, 1000);
// page switching
let current = 0;
function changePage(direction) {
  const pages = document.querySelectorAll('.page');

  pages[current].classList.remove('active');
  current = Math.max(0, Math.min(pages.length - 1, current + direction));
  pages[current].classList.add('active');
  updateNavigation();
}
function updateNavigation() {
  const activePage = document.querySelector('.page.active');

  activePage.querySelector('.prevBtn').disabled = current === 0;
  const nextButton = activePage.querySelector('.nextBtn');

  if (nextButton) {
    nextButton.disabled = current === document.querySelectorAll('.page').length - 1;
  }
}
// close & open
function finishOnboarding() {
  document.getElementById("window").style.display = "none";
}
function startOnboarding() {
  const onboardingWindow = document.getElementById("window");
  const pages = document.querySelectorAll('.page');

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
// window dragging
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