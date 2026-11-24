(function () {
    'use strict';

    const feedback = document.getElementById('favorite-feedback');
    let feedbackTimeout;

    function showFeedback(message, isError) {
        if (!feedback) return;

        feedback.textContent = message;
        feedback.classList.toggle('is-error', Boolean(isError));
        feedback.classList.add('is-visible');
        window.clearTimeout(feedbackTimeout);
        feedbackTimeout = window.setTimeout(() => {
            feedback.classList.remove('is-visible');
        }, 3500);
    }

    function updateButtons(buttons, isFavorite) {
        buttons.forEach((button) => {
            const movieTitle = button.dataset.movieTitle;
            const label = isFavorite
                ? `Remove ${movieTitle} from favourites`
                : `Add ${movieTitle} to favourites`;

            button.classList.toggle('is-favourite', isFavorite);
            button.setAttribute('aria-pressed', String(isFavorite));
            button.setAttribute('aria-label', label);
            button.title = label;
        });
    }

    function removeFromFavouritesPage(button) {
        const favouritesPage = document.querySelector('[data-favourites-page="true"]');
        if (!favouritesPage) return;

        const card = button.closest('.movie-card');
        if (card) card.remove();

        if (favouritesPage.querySelector('.movie-card')) return;

        const currentPage = Number(favouritesPage.dataset.currentPage) || 1;
        if (currentPage > 1) {
            const previousPageUrl = new URL(window.location.href);
            previousPageUrl.searchParams.set('page', String(currentPage - 1));
            window.location.assign(previousPageUrl.toString());
            return;
        }

        const grid = favouritesPage.querySelector('.movies-grid-3col');
        if (grid) {
            const emptyState = document.createElement('div');
            const message = document.createElement('p');
            emptyState.className = 'empty-card';
            message.textContent = 'You have not added any movies to your favourites yet.';
            emptyState.append(message);
            grid.replaceWith(emptyState);
        }

        favouritesPage.querySelectorAll('[data-favourites-pagination]').forEach((element) => {
            element.remove();
        });
    }

    document.addEventListener('click', async (event) => {
        if (!(event.target instanceof Element)) return;

        const button = event.target.closest('[data-favorite-toggle]');
        if (!button || button.disabled) return;

        const movieId = button.dataset.movieId;
        const isFavorite = button.getAttribute('aria-pressed') !== 'true';
        const matchingButtons = Array.from(document.querySelectorAll('[data-favorite-toggle]'))
            .filter((candidate) => candidate.dataset.movieId === movieId);

        matchingButtons.forEach((candidate) => {
            candidate.disabled = true;
            candidate.classList.add('is-pending');
        });

        try {
            const response = await fetch(`/movies/${encodeURIComponent(movieId)}/favourite`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isFavorite })
            });

            if (response.status === 401) {
                const loginUrl = new URL('/auth/login', window.location.origin);
                loginUrl.searchParams.set('redirect', `${window.location.pathname}${window.location.search}${window.location.hash}`);
                window.location.assign(loginUrl.toString());
                return;
            }

            let result;
            try {
                result = await response.json();
            } catch {
                throw new Error(response.ok
                    ? 'The server returned an invalid response.'
                    : 'Could not update favourites. Please try again.');
            }

            if (!response.ok) {
                throw new Error(result.error || 'Could not update favourites. Please try again.');
            }

            if (typeof result.isFavorite !== 'boolean') {
                throw new Error('The server returned an invalid favourite status.');
            }

            updateButtons(matchingButtons, result.isFavorite);
            showFeedback(
                result.isFavorite
                    ? `${button.dataset.movieTitle} added to Favourites.`
                    : `${button.dataset.movieTitle} removed from Favourites.`,
                false
            );

            if (!result.isFavorite) {
                removeFromFavouritesPage(button);
            }
        } catch (err) {
            showFeedback(err.message || 'Could not update favourites. Please try again.', true);
        } finally {
            matchingButtons.forEach((candidate) => {
                candidate.disabled = false;
                candidate.classList.remove('is-pending');
            });
        }
    });
})();
