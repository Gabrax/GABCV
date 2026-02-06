
var GH = document.getElementById("GH");

GH.addEventListener("click", function()
{
  console.log("Button clicked");
  window.open("https://github.com/Gabrax", "_blank");
});

var LI = document.getElementById("LI");

LI.addEventListener("click", function()
{
  console.log("Button clicked");
  window.open("https://www.linkedin.com/in/gabriel-ozeg-136481200/", "_blank");
});

document.addEventListener("DOMContentLoaded", function()
{
  var homeLink = document.querySelector('.link a[href="#"]');
  
    homeLink.addEventListener("click", function(event)
    {    
      event.preventDefault();
      
      homeLink.classList.remove('home');
      setTimeout(function() { homeLink.classList.add('home'); }, 10); 
    });
});

fetch("/partials/header.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("header").innerHTML = html;
  });
