const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    uniform vec3 colorStart;
    uniform vec3 colorEnd;
    void main() {
        gl_FragColor = vec4(mix(colorStart, colorEnd, vUv.y), 1.0);
    }
`;

const audioInput = document.getElementById("audio");
let noise = new SimplexNoise();
const area = document.getElementById("visualiser");
const label = document.getElementById("label");
audioInput.addEventListener("change", setAudio, false);
let audio = new Audio();
audio.volume = 0.5;
function setAudio() {
  audio.pause()
  const audioFile = this.files[0];
  if(audioFile.name.includes(".mp3")) {
    const audioURL = URL.createObjectURL(audioFile);
    audio = new Audio(audioURL);
    clearScene();
    startVis()
    
  }else{
    alert("Invalid File Type!")
  }
  
}

area.addEventListener('click', () => {
  console.log(audio)
  if(audio.paused) {
    audio.play()
    label.style.display = "none"
  } else {
    audio.pause()
    label.style.display = "flex"
  }
  
})

startVis()

function clearScene(){
  const canvas = area.firstElementChild;
  area.removeChild(canvas);
}

function startVis() {
  const context = new AudioContext();
  const src = context.createMediaElementSource(audio);
  const analyser = context.createAnalyser();
  src.connect(analyser);
  analyser.connect(context.destination);
  analyser.fftSize = 512;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#000000");
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 100;
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor("#ffffff");

  area.appendChild(renderer.domElement);
  //////////////////
  const geometry = new THREE.IcosahedronGeometry(20,3);
  const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        colorStart: { value: new THREE.Color("#ff0000") }, // Start color
        colorEnd: { value: new THREE.Color("#00ff00") }   // End color
    }
});
  const sphere = new THREE.Mesh(geometry, material);

  const light = new THREE.DirectionalLight("#ffffff", 0.8);
  light.position.set(0,50,100);
  scene.add(light)
  scene.add(sphere)

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  function render() {

    analyser.getByteFrequencyData(dataArray);

    const lowerHalf = dataArray.slice(0, (dataArray.length / 2) - 1);
    const upperHalf = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);

    const lowerMax = max(lowerHalf);
    const upperAvg = avg(upperHalf);

    const lowerMaxFr = lowerMax / lowerHalf.length;
    const upperAvgFr = upperAvg / upperHalf.length;



    sphere.rotation.x += 0.001;
    sphere.rotation.y += 0.003;
    sphere.rotation.z += 0.005;

    WarpSphere(sphere, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));
    requestAnimationFrame(render);
    renderer.render(scene,camera)
  }

  function WarpSphere(mesh, bassFr, treFr) {
    mesh.geometry.vertices.forEach(function (vertex, i) {
      var offset = mesh.geometry.parameters.radius;
      var amp = 5;
      var time = window.performance.now();
      vertex.normalize();
      var rf = 0.00001;
      var distance = (offset + bassFr) + noise.noise3D(vertex.x + time * rf * 4, vertex.y + time * rf * 6, vertex.z + time * rf * 7) * amp * treFr *2;
      vertex.multiplyScalar(distance);
    });
    mesh.geometry.verticesNeedUpdate = true;
    mesh.geometry.normalsNeedUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeFaceNormals();
  }
  render()
}

//helper functions
function fractionate(val, minVal, maxVal) {
  return (val - minVal) / (maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
  var fr = fractionate(val, minVal, maxVal);
  var delta = outMax - outMin;
  return outMin + (fr * delta);
}

function avg(arr) {
  var total = arr.reduce(function (sum, b) { return sum + b; });
  return (total / arr.length);
}

function max(arr) {
  return arr.reduce(function (a, b) { return Math.max(a, b); })
}



const image = document.getElementById('cover'),
      title = document.getElementById('title'),
      artist = document.getElementById('artist'),
      currentTimeEL = document.getElementById('curr-time'),
      durationEL = document.getElementById('duration'),
      progress = document.getElementById('progress'),
      playerProgress = document.getElementById('player-progress'),
      prevbtn = document.getElementById('prev'),
      nextbtn = document.getElementById('next'),
      playbtn = document.getElementById('play');
      
//const music = new Audio();
document.getElementById("volumeControl").addEventListener("input", setVolume);
const songs = [
  {
    path: 'Res/Music/Nujabes - No way back.mp3',
    displayName: 'No way back',
    cover: 'Res/Music/nujabes-departure.jpg',
    artist: 'Nujabes',
  },
  {
    path: 'Res/Music/[dko] - fnk.mp3',
    displayName: '[dko] - fnk',
    cover: 'Res/Music/dko - fnk.png',
    artist: 'Lush Loops',
  },
  {
    path: 'Res/Music/ODESZA - We Were Young.mp3',
    displayName: 'We Were Young',
    cover: 'Res/Music/odesza-wewereyoung.png',
    artist: 'ODESZA',
  },
]

let musicIndex = 0;
let isPlaying = false;

function togglePlay(){
  if(isPlaying){
    pauseMusic();
  }else{
    playMusic();
  }
}

function setVolume() {
  let volume = document.getElementById("volumeControl").value;
  audio.volume = volume / 100;
}

function playMusic(){
  isPlaying = true;

  playbtn.classList.replace('fa-play','fa-pause');
  playbtn.setAttribute('title','Pause');
  setVolume();
  audio.play();
}

function pauseMusic(){
  isPlaying = false;

  playbtn.classList.replace('fa-pause','fa-play');
  playbtn.setAttribute('title','Play');
  audio.pause();
}

function loadMusic(songs){
  audio.src = songs.path;
  title.textContent = songs.displayName;
  artist.textContent = songs.artist;
  image.src = songs.cover;
}

function changeMusic(direction){
  musicIndex = (musicIndex + direction + songs.length) % songs.length;
  loadMusic(songs[musicIndex]);
  playMusic();
}

function updateProgressBar(){
  const {duration, currentTime} = audio;
  const progressPercent = (currentTime /duration) * 100;
  progress.style.width = `${progressPercent}%`;

  const formatTime = (time) => String(Math.floor(time)).padStart(2, '0');
  durationEL.textContent = `${formatTime(duration / 60)}:${formatTime(duration % 60)}`;
  currentTimeEL.textContent = `${formatTime(currentTime / 60)}:${formatTime(currentTime % 60)}`;
}

function setProgressBar(e){
  const width = playerProgress.clientWidth;
  const clickX = e.offsetX;
  audio.currentTime = (clickX/width) * audio.duration;
}

playbtn.addEventListener('click',togglePlay);
prevbtn.addEventListener('click', ()=> changeMusic(-1));
nextbtn.addEventListener('click', ()=> changeMusic(1));
audio.addEventListener('ended', ()=> changeMusic(1));
audio.addEventListener('timeupdate', updateProgressBar);
playerProgress.addEventListener('click', setProgressBar);
loadMusic(songs[musicIndex]);
