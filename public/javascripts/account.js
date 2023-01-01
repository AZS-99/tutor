document.addEventListener("DOMContentLoaded", evt => {

    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(tomorrow.getHours(), 0, 0, 0);
    const tomorrow_str =  tomorrow.toISOString().slice(0, -1);

    const datetime = document.querySelector('input[type="datetime-local"]');

    datetime.value = tomorrow_str;
    datetime.min = tomorrow_str;
})