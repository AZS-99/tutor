document.addEventListener("DOMContentLoaded", evt => {

    const tomorrow = new Date();
    const next_month = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    next_month.setDate(tomorrow.getDate() + 30);

    const tomorrow_str =  tomorrow.toISOString().slice(0, -1);
    const next_month_str = next_month.toISOString().slice(0, -1);
    const datetime = document.querySelector('input[type="datetime-local"]');

    datetime.value = tomorrow_str;
    datetime.min = tomorrow_str;
    datetime.max = next_month_str;

})