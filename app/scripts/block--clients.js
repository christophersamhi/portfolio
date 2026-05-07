import $ from "jquery/dist/jquery.min.js";
import Swiper from "swiper";
import "swiper/css";

$(document).ready(function () {

    $.get("./components/block--clients.html", function (data) {
        $(".block--clients-placeholder").replaceWith(data);
        
        // Swiper
        $('.block--clients').each(function () {

            const $block = $(this);
            const $main = $block.find('.swiper--main');
            const $thumbs = $block.find('.swiper--thumbs');
            const $mainWrapper = $main.find('.swiper-wrapper');

            const rootFontSize = parseFloat($('html').css('font-size'));
            const rawValue = $(':root').css('--space-between-sm').trim();
            const remValue = parseFloat(rawValue);
            const spaceBetween = remValue * rootFontSize;

            // Recup data client
            $thumbs.find('.swiper-slide').each(function () {
                const client = $(this).data('client');

                $mainWrapper.append(`
                    <div class="swiper-slide">
                        <button>${client}</button>
                    </div>
                `);
            });

            // Ajout flèches
            $block.find('.block--clients__swiper-container').prepend(`
                <div class="arrows-container">
                    <button class="swiper-arrow swiper-arrow--prev" aria-label="Prev slide"></button>
                    <button class="swiper-arrow swiper-arrow--next" aria-label="Next slide"></button>
                </div> 
            `);

            const totalSlides = $mainWrapper.find('.swiper-slide').length;
            const middleIndex = Math.floor(totalSlides / 2);
            
            // Main swiper
            const mainSwiper = new Swiper($main[0], {
                slidesPerView: 'auto',
                spaceBetween: spaceBetween,
                initialSlide: middleIndex,
                rewind: true,
                breakpoints: {
                    0: {
                        direction: 'horizontal',
                    },
                    600: {
                        direction: 'vertical',
                    },
                },
            });

            // Thumbs swiper
            const thumbsSwiper = new Swiper($thumbs[0], {
                slidesPerView: 1,
                initialSlide: middleIndex,
                rewind: true,
                breakpoints: {
                    0: {
                        direction: 'horizontal',
                    },
                    600: {
                        direction: 'vertical',
                    },
                },
            });

            // Navigation
            $block.on('click', '.swiper-arrow--next', function () {
                thumbsSwiper.slideNext();
            });

            $block.on('click', '.swiper-arrow--prev', function () {
                thumbsSwiper.slidePrev();
            });

            mainSwiper.on('slideChange', function () {
                thumbsSwiper.slideTo(mainSwiper.realIndex);
            });

            $main.on('click', 'button', function (e) {
                e.preventDefault();

                const index = $(this).closest('.swiper-slide').index();

                thumbsSwiper.slideTo(index);
            });

            // Sync
            function updateActiveMain() {
                const activeIndex = thumbsSwiper.realIndex;
                const $slides = $main.find('.swiper-slide');

                $slides.removeClass('swiper-slide-thumb-active');

                const $target = $slides.eq(activeIndex);

                if ($target.length) {
                    $target.addClass('swiper-slide-thumb-active');
                }
            }

            thumbsSwiper.on('slideChange', function () {
                updateActiveMain();
            });

            mainSwiper.update();
            thumbsSwiper.update();
            mainSwiper.slideTo(middleIndex, 0);
            thumbsSwiper.slideTo(middleIndex, 0);
        });
    });
});