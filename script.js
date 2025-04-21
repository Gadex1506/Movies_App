const API_KEY = 'b6a0887a6a27bb2d832cfc623bba7c9e';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/original';
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query !== '') {
            searchMovies(query);
        } else {
            fetchPopularMovies(); // Si está vacío, vuelve a cargar populares
        }
    }
});

async function searchMovies(query) {
    try {
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        const movies = data.results.slice(0, 8); // Solo 8 para el carrusel
        renderCarousel(movies);
    } catch (error) {
        console.error('Error al buscar películas:', error);
    }
}

async function fetchPopularMovies() {
    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=1`);
        const data = await response.json();
        const movies = data.results.slice(0, 8); // Toma las primeras 8 películas

        renderCarousel(movies);
    } catch (error) {
        console.error('Error al obtener películas:', error);
    }
}

async function getTrailer(movieId) {
    const res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`);
    const data = await res.json();

    const trailer = data.results.find(
        video => (video.type === 'Trailer' || video.type === 'Teaser') && video.site === 'YouTube'
    );

    if (trailer) {
        return `https://www.youtube.com/watch?v=${trailer.key}`;
    }

    return null; // Si no hay trailer, devuelve null
}

function renderCarousel(movies) {
    const container = document.getElementById('carouselContainer');
    container.innerHTML = ''; // Limpia cualquier contenido previo

    const count = movies.length;
    const angle = 360 / count;

    movies.forEach((movie, index) => {
        const span = document.createElement('span');
        span.style.setProperty('--i', index + 1);
        span.style.transform = `rotateY(${index * angle}deg) translateZ(400px)`;

        const img = document.createElement('img');
        img.src = movie.poster_path
            ? `${IMAGE_BASE}${movie.poster_path}`
            : 'https://via.placeholder.com/250x350?text=No+Image';
        img.alt = movie.title;

        span.appendChild(img);
        container.appendChild(span);

        // Evento click para mostrar u ocultar tráiler
        span.addEventListener('click', async () => {
            const trailerUrl = await getTrailer(movie.id);
        
            if (trailerUrl) {
                const videoId = trailerUrl.split('v=')[1];
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&loop=1&playlist=${videoId}&vq=hd1080`;
                iframe.allow = 'autoplay; encrypted-media';
                iframe.allowFullscreen = true;
                
                const overlay = document.getElementById('videoOverlay');
                const videoContainer = document.getElementById('videoContainer');

                // Limpia el contenido anterior y muestra el modal
                videoContainer.innerHTML = '';
                videoContainer.appendChild(iframe);
                overlay.classList.remove('hidden');

                document.getElementById('carouselContainer').classList.add('carousel-paused'); // Pausa la animación del carrusel
            }
        });
    });

    // Cierre del modal con la X
    document.getElementById('closeModal').addEventListener('click', () => {
        const overlay = document.getElementById('videoOverlay');
        const videoContainer = document.getElementById('videoContainer');
        overlay.classList.add('hidden');
        videoContainer.innerHTML = ''; // Detiene el tráiler
        document.getElementById('carouselContainer').classList.remove('carousel-paused'); // Reanuda la animación del carrusel
    });
}

fetchPopularMovies();
