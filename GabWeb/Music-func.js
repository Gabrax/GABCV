
var GH = document.getElementById("GH");

GH.addEventListener("click", function() {
    console.log("Button clicked");
    window.open("https://github.com/Gabrax", "_blank");
});

var LI = document.getElementById("LI");

LI.addEventListener("click", function() {
    console.log("Button clicked");
    window.open("https://www.linkedin.com/in/gabriel-ozeg-136481200/", "_blank");
});

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










