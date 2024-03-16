

  var heading = document.getElementById('Curriculum');
  var newText = heading.innerHTML.replace('C', '<span style="-webkit-text-fill-color: transparent; -webkit-text-stroke: 2px #ef5f5f;">C</span>');
  heading.innerHTML = newText;

  var heading = document.getElementById('Curriculum');
  var newText = heading.innerHTML.replace('V', '<span style="-webkit-text-fill-color: transparent; -webkit-text-stroke: 2px #ef5f5f;">V</span>');
  heading.innerHTML = newText;

  function mainprofileGIT(){
    window.open("https://github.com/Gabrax", "_blank");
  }

  /*function scrolltoTop(){
    window.scrollTo({top: 0, behavior: 'smooth'});
  }*/


  var audio = document.getElementById("_Audio");
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
    
    if (volumeImage.src.endsWith("Res/volON.png")) {
        
        volumeImage.src = "Res/volOFF.png";
    } else {
        
        volumeImage.src = "Res/volON.png";
    }
  });

