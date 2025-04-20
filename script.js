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

    let activeTrailer = null;

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
            if (activeTrailer && activeTrailer !== span) {
                restorePoster(activeTrailer.span, activeTrailer.movie);
            }
        
            if (span.classList.contains('trailer-active')) {
                restorePoster(span, movie);
                activeTrailer = null;
                return;
            }
        
            const trailerUrl = await getTrailer(movie.id);
        
            if (trailerUrl) {
                const videoId = trailerUrl.split('v=')[1];
                const iframe = document.createElement('iframe');
                iframe.width = '250';
                iframe.height = '350';
                iframe.allow = 'autoplay; encrypted-media';
                iframe.frameBorder = '0';
                iframe.allowFullscreen = true;
        
                span.innerHTML = '';
                span.appendChild(iframe);
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&loop=1&playlist=${videoId}&vq=hd1080`;
                span.classList.add('trailer-active');
        
                activeTrailer = { span, movie };
        
                // 👇 Agrega este listener para cerrar el tráiler al salir el mouse
                span.addEventListener('mouseleave', function onLeave() {
                    restorePoster(span, movie);
                    span.removeEventListener('mouseleave', onLeave); // Evita duplicados
                    activeTrailer = null;
                });
            }
        });
    });

    function restorePoster(targetSpan, movieData) {
        const iframe = targetSpan.querySelector('iframe');
        if (iframe) {
            iframe.classList.add('fade-out'); // Aplica animación
    
            // Esperamos a que termine la animación antes de reemplazar
            setTimeout(() => {
                targetSpan.innerHTML = ''; // Limpiar
    
                const newImg = document.createElement('img');
                newImg.src = movieData.poster_path
                    ? `${IMAGE_BASE}${movieData.poster_path}`
                    : 'https://via.placeholder.com/250x350?text=No+Image';
                newImg.alt = movieData.title;
                newImg.classList.add('fade-in'); // Animación de entrada
    
                targetSpan.appendChild(newImg);
                targetSpan.classList.remove('trailer-active');
            }, 500); // Tiempo igual a la duración del fade
        }
    }
}

fetchPopularMovies();
