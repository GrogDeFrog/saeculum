document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const monthIndex = (m) => new Date(`${m} 1, 2000`).getMonth();

    document.querySelectorAll('.calendar').forEach((table) => {
        const [monthName, yearStr] = table
            .querySelector('caption')
            .textContent.trim()
            .split(/\s+/);

        const month = monthIndex(monthName);
        const year = Number(yearStr);

        table.querySelectorAll('tbody td').forEach((td) => {
            const dayText = td.textContent.trim();
            if (!dayText) return;

            const day = Number(dayText);
            const cellDate = new Date(year, month, day);
            cellDate.setHours(0, 0, 0, 0);
            const cellTime = cellDate.getTime();

            if (cellTime === todayTime) td.classList.add('today-cell');

            const dayMarkup =
                cellTime === todayTime
                ? `<div class="today-label">${day}</div>`
                : day;

            td.innerHTML = dayMarkup;

            const eventText = td.dataset.event;
            if (eventText) {
                const ev = document.createElement('span');
                ev.className = 'event';
                ev.textContent = eventText;
                td.appendChild(ev);
            }

            if (cellDate < today) {
                td.style.color = '#bdbdbd';
            }
        });
    });
});
