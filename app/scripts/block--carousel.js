import $ from "jquery/dist/jquery.min.js";
import Swiper from "swiper";
import "swiper/swiper-bundle.css";

export function initBlockCarousel() {
    // Swiper
    $(".block--carousel").each(function () {
        const $block = $(this);
        const $swiper = $block.find(".swiper");

        const rootFontSize = parseFloat($("html").css("font-size"));
        const rawValue = $(":root").css("--space-between-2xl").trim();
        const remValue = parseFloat(rawValue);
        const spaceBetween = remValue * rootFontSize;

        // Ajout flèches
        $block.find(".block__container").append(`
            <div class="arrows-container">
                <button class="swiper-arrow swiper-arrow--prev" aria-label="Prev slide"></button>
                <button class="swiper-arrow swiper-arrow--next" aria-label="Next slide"></button>
            </div> 
        `);

        // Swiper
        const mainSwiper = new Swiper($swiper[0], {
            slidesPerView: 2,
            spaceBetween: spaceBetween,
            loop: true,
        });

        // Navigation
        $block.on("click", ".swiper-arrow--next", function () {
            mainSwiper.slideNext();
        });

        $block.on("click", ".swiper-arrow--prev", function () {
            mainSwiper.slidePrev();
        });
    });
}
