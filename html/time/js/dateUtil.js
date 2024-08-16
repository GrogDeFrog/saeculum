export function formatDate(date) {
    console.log(date);
    const endTime = date.EndTime;

    if (endTime === '0001-01-01T00:00:00Z') {
        return 'current';
    } else {
        const endDate = new Date(endTime);
        const now = new Date();
        const diff = now - endDate;
        const diffInHours = Math.floor(diff / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
    
        if (diffInHours < 96) {
            return `${diffInHours} hours ago`;
        } else {
            return `${diffInDays} days ago`;
        }
    }
}


export function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;

    return `${hours}:${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
