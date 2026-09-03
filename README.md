# Field Agent Incentive Dashboard — Frontend

Django frontend source for the Spectrum Field Agent Incentive Dashboard: Django templates (`templates/`) and static assets (`static/` — CSS, JS, logos).

This repo holds frontend files only — no views, models, URLs, or settings — so it isn't runnable standalone. It's meant for design/code review; the templates use Django template tags (`{% %}`, `{{ }}`) and are rendered by the full Django project.

- `dashboard/templates/dashboard/home.html` — main dashboard page
- `accounts/templates/registration/login.html` — sign-in page
- `dashboard/static/dashboard/css/dashboard.css` — styles
- `dashboard/static/dashboard/js/dashboard.js` — interactivity (log a sale, theme toggle, modals, charts)
