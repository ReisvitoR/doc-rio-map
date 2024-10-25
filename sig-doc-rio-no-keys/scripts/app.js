import { db } from '../firebase/firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

let map;

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const userPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        map = new Map(document.getElementById("map"), {
          zoom: 12,
          center: userPosition,
          mapId: "DEMO_MAP_ID", 
        });

        new google.maps.marker.AdvancedMarkerElement({
          map: map,
          position: userPosition,
          title: "Você está aqui",
        });

        fetchFirestoreData();
      },
      error => {
        console.error("Erro ao obter localização", error);
        alert("Erro ao obter localização. Usando localização padrão.");
        setDefaultMap();
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  } else {
    alert("Geolocalização não suportada no navegador.");
    setDefaultMap();
  }
}

function setDefaultMap() {
  const defaultPosition = { lat: -25.344, lng: 131.031 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: defaultPosition,
    mapId: "DEMO_MAP_ID",
  });
}

async function fetchFirestoreData() {
  const storage = getStorage();  

  try {
    const querySnapshot = await getDocs(collection(db, "apps/dr-rio/analysis-record")); // Novo caminho da coleção
    querySnapshot.forEach(async doc => {
      const data = doc.data();
      const markerPosition = {
        lat: data.latitude,
        lng: data.longitude
      };

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: markerPosition,
        title: "Clique para mais informações",
      });

      // Obtenção da URL da imagem do Firebase Storage
      const imageRef = ref(storage, data.form[0].images[0]);
      const imageUrl = await getDownloadURL(imageRef);

      let contentString = `
        <div style="text-align: center;">
          <div style="margin-bottom: 10px;">
            <img src="${imageUrl}" alt="Imagem da Nascente" style="width: 100px; height: 100px; object-fit: cover;">
          </div>
          <div>
            <p><strong>Informações</strong></p>
            <p>Nota (Score): ${data.score}</p>
            <p>Latitude: ${data.latitude}</p>
            <p>Longitude: ${data.longitude}</p>
            <p>Comentário: ${data.form[0].comments}</p>
          </div>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: contentString
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });
  } catch (error) {
    console.error("Error fetching Firestore data:", error);
  }
}

initMap();
