import { ubc, range_clima, depa,sunR,sunS,tem_min,tem_max,sen,hum,enl} from "./app.js";
import suncalc from 'https://cdn.jsdelivr.net/npm/suncalc@1.9.0/+esm';
const fondo=document.body;
window.onload = function () {
  const apiKey = '3ba5d66a72148294071dfa560f89752c';
  const googleApiKey = 'AIzaSyApV4iNXBzlRGPc3bQkRprnxlSTYLo4fOM';
  const date= document.getElementById('fecha');
  const time=document.getElementById('hora');
  var{fecha,soloHora,soloMin}=actualizarFechaHora();
  let min =soloMin;
  date.innerHTML=`${fecha}`;
  if(min<10){
    time.innerHTML=`${soloHora}:0${soloMin}`;
  }
  else{
    time.innerHTML=`${soloHora}:${soloMin}`;
  }
  
  fondoClima(soloHora);
 
  obtenerUbicacion()
    .then(coords => {
      const [lat, long] = coords;
      callClima(Math.round(lat*10000)/10000, Math.round(long*10000)/10000);
      
    })
    .catch(error => {
      console.error(error);
    });


  function obtenerUbicacion() {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function (position) {
          var lat = position.coords.latitude;
          var long = position.coords.longitude;
          resolve([lat, long]);
        }, function (error) {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject("El usuario denegó la solicitud de geolocalización.");
              break;
            case error.POSITION_UNAVAILABLE:
              reject("La información de la ubicación no está disponible.");
              break;
            case error.TIMEOUT:
              reject("Se agotó el tiempo de espera para obtener la ubicación.");
              break;
            case error.UNKNOWN_ERROR:
              reject("Se produjo un error desconocido al obtener la ubicación.");
              break;
          }
        });
      } else {
        reject("La geolocalización no está disponible en tu navegador.");
      }
    });
  }

  function actualizarFechaHora(){
    let fec_h= new Date();
    let opcForm={ year: 'numeric', month: 'long', day: 'numeric' };
    let formato= new Intl.DateTimeFormat('es-ES', opcForm);
    let fecha=formato.format(fec_h);
    let soloHora=fec_h.getHours();
    let soloMin=fec_h.getMinutes();
    return {fecha,soloHora,soloMin};
  }
  function fondoClima(hora){
    if(6<=hora&&hora<17){
      fondo.style.backgroundImage="url('images/fondo.jpg')";
    }
    else {
      if(17<=hora&&hora<19){
      fondo.style.backgroundImage="url('images/tarde.jpg')";}
      else {
        if(19<=hora&&hora<=23){
        fondo.style.backgroundImage="url('images/noche.jpg')";}
        else{
      fondo.style.backgroundImage="url('images/noche.jpg')";}}}
  }

  function callClima(lat, long) {
    const urlClima = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${apiKey}&lang=es`;
    const urlUbi_exacta = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${long}&appid=${apiKey}&lang=es`;

    const resul1 = fetch(urlClima);
    const resul2 = fetch(urlUbi_exacta);
    Promise.all([resul1, resul2])
      .then(responses => {
        const respuesta1 = responses[0];
        const respuesta2 = responses[1];

        if (respuesta1.ok && respuesta2.ok) {
          return Promise.all([respuesta1.json(), respuesta2.json()]);
        } else {
          throw new Error('Una o ambas solicitudes fallacon');
        }
      })
      .then(dataArray => {
        const data1 = dataArray[0];
        const data2 = dataArray[1];

        console.log('Datos de la primera solicitud:', data1);
        const {id,main:{feels_like,humidity,temp,temp_max,temp_min},weather,sys:{sunrise,sunset}}=data1;
        const tem = Math.floor(temp - 273.15);
        const tem_mx = Math.floor(temp_max - 273.15);
        const tem_mn = Math.floor(temp_min - 273.15);
        const sensn=Math.floor(feels_like - 273.15);
        tem_min.innerHTML=`${tem_mn}°`;
        tem_max.innerHTML=`${tem_mx}°`;
        sen.innerHTML=`${sensn}°`;
        hum.innerHTML=`${humidity}%`;
        let urlIcon=`https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
        let Icono = document.createElement('img');
        let p_des = document.createElement('p');
        Icono.src=urlIcon;
        p_des.innerHTML=weather[0].description;
        Icono.style.maxWidth="6em";
        range_clima.appendChild(Icono)
        range_clima.appendChild(p_des);
        const distrito = data2[0].name;
        console.log('Datos de la segunda solicitud:', data2[0]);
        ubc.innerHTML=distrito+` ${tem}°C`;
        const { lat, lon } = data2[0];
        var{hAma,hAta,mAma,mAta}=mostrarS(sunrise,sunset,lat,lon);
        sunR.innerHTML=`${hAma}:${mAma}`;
        sunS.innerHTML=`${hAta}:${mAta}`;
        infoGoogle(lat, lon);
        enl.setAttribute("href",`https://openweathermap.org/city/${id}`);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  //API GOOGLE
  function infoGoogle(lat, lon) {
    const urlInfo = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}`;

    fetch(urlInfo)
      .then(response => response.json())
      .then(data => {
        if (data.status === "OK") {
          // Obtiene la información del lugar
          const resultados = data.results;
          console.log(resultados);
          const dato1 = resultados[resultados.length-2].address_components[0].long_name;
          const dato2 = resultados[resultados.length-2].formatted_address;
          depa.innerHTML=`${dato2}`.toUpperCase();

        } else {
          console.log("La solicitud no tuvo éxito.");
        }
      })
      .catch(error => {
        console.error("Hubo un error al realizar la solicitud:", error);
      });
  }

  function mostrarS(sR,sS,lat,lon){
    const fechaR = new Date(sR*1000);
    const fechaS = new Date(sS*1000);
    const saleSol=suncalc.getTimes(fechaR,lat,lon);
    const puestaSol=suncalc.getTimes(fechaS,lat,lon);

    const amanecer = saleSol.sunrise;
    const atardecer = puestaSol.sunset;

    const hAma = amanecer.getHours();
    const mAma = amanecer.getMinutes();
    const hAta = atardecer.getHours();
    const mAta = atardecer.getMinutes();
    return {hAma,hAta,mAma,mAta};
  }
};
