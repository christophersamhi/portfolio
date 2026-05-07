import $ from "jquery/dist/jquery.min.js";

$(document).ready(function () {

    $.get("./components/contact-form.html", function (data) {
        $(".contact-form-placeholder").replaceWith(data);
        
        const $openBtn = $('.contact-form__open');
        const $closeBtn = $('.contact-form__close');
        const $container = $('.contact-form__hidden');

        let $focusable;
        let $first;
        let $last;

        function getFocusable() {
            return $container
                .find('a, button, input, textarea, select, [tabindex]')
                .filter(':visible')
                .filter(function () {
                    return !$(this).is('[disabled]');
                });
        }

        function disableFocusables() {
            const $items = getFocusable();

            $items.each(function () {
                const $el = $(this);

                if ($el.data('orig-tabindex') === undefined) {
                    $el.data('orig-tabindex', $el.attr('tabindex'));
                }

                $el.attr('tabindex', '-1');
            });
        }

        function enableFocusables() {
            const $items = $container.find(
                'a, button, input, textarea, select, [tabindex]'
            );

            $items.each(function () {
                const $el = $(this);
                const original = $el.data('orig-tabindex');

                if (original === undefined || original === null) {
                    $el.removeAttr('tabindex');
                } else {
                    $el.attr('tabindex', original);
                }
            });
        }

        function openForm() {
            $container.attr('aria-hidden', 'false');
            $openBtn.attr('aria-expanded', 'true');
            $openBtn.attr('tabindex', '-1');

            enableFocusables();

            $focusable = getFocusable();
            $first = $focusable.first();
            $last = $focusable.last();
            $first.focus();

            $(document).on('keydown.trap', function (e) {
                if (e.key === 'Escape') {
                    closeForm();
                    return;
                }

                if (e.key !== 'Tab') return;

                if (e.shiftKey) {
                    if (document.activeElement === $first[0]) {
                        e.preventDefault();
                        $last.focus();
                    }
                } else {
                    if (document.activeElement === $last[0]) {
                        e.preventDefault();
                        $first.focus();
                    }
                }
            });
        }

        function closeForm() {
            $container.attr('aria-hidden', 'true');
            $openBtn.attr('aria-expanded', 'false');
            $openBtn.removeAttr('tabindex');

            $(document).off('keydown.trap');
            disableFocusables();
            $openBtn.focus();
        }

        $(document).on('click', '.contact-form__open', openForm);
        $(document).on('click', '.open-contact-form', function (e) {
            e.preventDefault();
            openForm();
        });
        $(document).on('click', '.contact-form__close', closeForm);
        disableFocusables();
    });
});