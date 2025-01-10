document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.cocktail-grid');
    const prevButton = document.querySelector('.slider-button.prev');
    const nextButton = document.querySelector('.slider-button.next');
    let currentSlide = 0;
    const totalSlides = Math.ceil(slider.children.length / 3) - 1;

    function updateSlider() {
        const slideWidth = slider.clientWidth;
        slider.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
    }

    prevButton.addEventListener('click', () => {
        if (currentSlide > 0) {
            currentSlide--;
            updateSlider();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentSlide < totalSlides) {
            currentSlide++;
            updateSlider();
        }
    });

    // Обновляем слайдер при изменении размера окна
    window.addEventListener('resize', updateSlider);
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