document.addEventListener('DOMContentLoaded', function() {
    const burgerMenu = document.querySelector('.burger-menu');
    const nav = document.querySelector('nav');

    burgerMenu.addEventListener('click', function() {
        nav.classList.toggle('active');
        burgerMenu.classList.toggle('active');
    });

    // Закрывать меню при клике на ссылку
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            burgerMenu.classList.remove('active');
        });
    });

    // Инициализация слайдшоу
    initSlideshow();
    
    // Загрузка коктейлей
    loadCocktails();
    
    // Обработка навигации
    const sections = document.querySelectorAll('section');
    
    // Показываем первую секцию при загрузке
    sections.forEach((section, index) => {
        section.style.display = index === 0 ? 'block' : 'none';
    });

    // Обработчик клика по пунктам меню
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Скрываем все секции
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Показываем нужную секцию
            const targetId = this.getAttribute('href').slice(1);
            const targetSection = document.getElementById(targetId);
            targetSection.style.display = 'block';
            
            // Добавляем плавное появление
            targetSection.style.opacity = 0;
            setTimeout(() => {
                targetSection.style.opacity = 1;
            }, 50);
        });
    });
});

document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Здесь будет логика отправки формы на сервер
    
    // Показываем сообщение об успехе
    const formMessage = document.getElementById('formMessage');
    formMessage.classList.add('show');
    
    // Очищаем форму
    this.reset();
    
    // Скрываем сообщение через 5 секунд
    setTimeout(() => {
        formMessage.classList.remove('show');
    }, 5000);
});

// Эффект параллакса и затухания
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const heroSection = document.querySelector('#about');
    const slideshow = document.querySelector('.hero-slideshow');
    const text = document.querySelector('.hero-text');
    
    if (heroSection && slideshow && text) {
        // Вычисляем прозрачность на основе прокрутки
        // Начинаем затухание после 100px прокрутки и заканчиваем к 800px
        const opacity = Math.max(0, 1 - (scrolled - 100) / 700);
        
        // Движение фона
        slideshow.style.transform = `translateY(${scrolled * 0.5}px)`;
        
        // Движение текста
        text.style.transform = `translate(-50%, ${-50 + (scrolled * 0.2)}%)`;
        
        // Применяем прозрачность к секции
        heroSection.style.opacity = opacity;
    }
});

// Функция для загрузки коктейлей
async function loadCocktails() {
    try {
        const response = await fetch('http://localhost:3000/api/cocktails');
        const cocktails = await response.json();
        
        const cocktailsContainer = document.querySelector('.cocktail-categories');
        if (!cocktailsContainer) {
            console.error('Не найден контейнер .cocktail-categories');
            return;
        }
        
        cocktailsContainer.innerHTML = '';
        
        Object.values(cocktails).forEach(category => {
            const categoryHTML = `
                <div class="category">
                    <h3>${category.name}</h3>
                    <p class="category-description">${category.description}</p>
                    <div class="cocktail-list">
                        ${category.items.map(cocktail => `
                            <div class="cocktail-item">
                                ${cocktail.image_url ? `
                                    <div class="cocktail-image">
                                        <img src="http://localhost:3000${cocktail.image_url}" 
                                             alt="${cocktail.name}"
                                             onerror="this.parentElement.style.display='none'"
                                        >
                                    </div>
                                ` : ''}
                                <div class="cocktail-content">
                                    <h4>${cocktail.name}</h4>
                                    <p>${cocktail.ingredients}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            cocktailsContainer.insertAdjacentHTML('beforeend', categoryHTML);
        });
    } catch (error) {
        console.error('Ошибка загрузки коктейлей:', error);
    }
}

// Функция для слайдшоу
function initSlideshow() {
    const images = document.querySelectorAll('.hero-slideshow img');
    if (images.length === 0) return;

    let currentIndex = 0;
    
    function nextImage() {
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');
    }
    
    setInterval(nextImage, 5000);
} 