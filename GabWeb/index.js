

var heading = document.getElementById('Curriculum');
var newText = heading.innerHTML.replace('C', '<span style="-webkit-text-fill-color: transparent; -webkit-text-stroke: 2px #ef5f5f;">C</span>');
heading.innerHTML = newText;

var heading = document.getElementById('Curriculum');
var newText = heading.innerHTML.replace('V', '<span style="-webkit-text-fill-color: transparent; -webkit-text-stroke: 2px #ef5f5f;">V</span>');
heading.innerHTML = newText;


var WLS = document.getElementById("WLS");

WLS.addEventListener("click", function() {
    console.log("Button clicked");
    window.open("https://github.com/Gabrax", "_blank");
});

var AV = document.getElementById("AV");

AV.addEventListener("click", function() {
    console.log("Button clicked");
    window.open("https://github.com/Gabrax/OpenGL_project", "_blank");
});

function scrolltoTop(){
  window.scrollTo({top: 0, behavior: 'smooth'});
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
      if (entry.isIntersecting) {
          entry.target.classList.add('show');
      } else {
          entry.target.classList.remove('show');
      }
  });
}, {
  threshold: 0.1 
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));


/*var audio = document.getElementById("_Audio");
audio.volume = 0.01;

window.onload = function() {
  document.getElementById("_Audio").play();
}

document.querySelector('.Volumebtn').addEventListener('click', function() {
  var audio = document.getElementById("_Audio");
  
  if (audio.paused) {
    
    audio.play();
    playButton.textContent = "Pause";
} else {
    
    audio.pause();
    playButton.textContent = "Play";
}


  console.log('Button clicked!');
});

var volumeImage = document.getElementById("volImg");
volumeImage.addEventListener("click", function() {
  
  if (volumeImage.src.endsWith("Res/volOFF.png")) {
      
      volumeImage.src = "Res/volON.png";
  } else {
      
      volumeImage.src = "Res/volOFF.png";
  }
});*/

