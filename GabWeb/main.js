

var heading = document.getElementById('Curriculum');
var newText = heading.innerHTML.replace('C', '<span style="-webkit-text-fill-color: transparent; -webkit-text-stroke: 2px #ef5f5f;">C</span>');
heading.innerHTML = newText;

var heading = document.getElementById('Curriculum');
var newText = heading.innerHTML.replace('V', '<span style="-webkit-text-fill-color: transparent; -webkit-text-stroke: 2px #ef5f5f;">V</span>');
heading.innerHTML = newText;

function mainprofileGIT(){
  window.open("https://github.com/Gabrax", "_blank");
}

function mainprofileLI(){
  window.open("https://www.linkedin.com/in/gabriel-ozeg-136481200/", "_blank");
}


document.addEventListener("DOMContentLoaded", function() {
  var homeLink = document.querySelector('.link a[href="#"]');
  
    homeLink.addEventListener("click", function(event) {
        // Prevent the default behavior of the link
        event.preventDefault();
        
        // Remove and reapply the 'home' class to trigger the animation
        homeLink.classList.remove('home');
        setTimeout(function() {
            homeLink.classList.add('home');
        }, 10); // Small delay to allow class removal to take effect
    });
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
  threshold: 0.1 // Adjust threshold as needed
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));



/*Graduate in Business Process Automation at the Faculty of Management 2020-2023
Second-degree student in Computer Science at the UŁ Faculty of Informatics and Mathematics 2023-..*/


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

