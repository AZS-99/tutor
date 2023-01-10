document.addEventListener("DOMContentLoaded", evt => {

    const form = document.getElementById('book_slot_form');
    const btn = document.querySelector("form > button")
    const tomorrow = new Date();
    const next_month = new Date();

    let slot_is_available = true;

    const duration = document.querySelector('input[type="number"]');
    const availability_span = document.getElementById("availability");

    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    next_month.setDate(tomorrow.getDate() + 30);

    const tomorrow_str =  tomorrow.toISOString().slice(0, -1);
    const next_month_str = next_month.toISOString().slice(0, -1);
    const datetime = document.querySelector('input[type="datetime-local"]');

    datetime.value = tomorrow_str;
    datetime.min = tomorrow_str;
    datetime.max = next_month_str;

    datetime.addEventListener('input', async evt => {
        slot_is_available = true;
        const year = Number(evt.target.value.slice(0, 4));
        const month = Number(evt.target.value.slice(5, 7));
        const day = Number(evt.target.value.slice(8, 10));
        const mins = Number(evt.target.value.slice(14, 16));
        const first_half_hr = Number(evt.target.value.slice(11, 13)) * 2 + (mins === '30'? 1 : 0)
        const halves_count = Number(duration.value) / 30;


        try {
            const response = await fetch('/users/unavailable_slots', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({year: year, month: month, day: day, instructor_id: 1})
            });



            const booked_halves_array = await response.json();
            console.log("user input:", evt.target.value);
            console.log("booked halves", booked_halves_array);


            for (let i = 0; i < halves_count; ++i) {
                if (booked_halves_array.includes(first_half_hr + i)) {
                    slot_is_available = false;
                    break;
                }
                console.log(first_half_hr + i, " not in ", booked_halves_array);
            }

            availability_span.textContent = (slot_is_available? "\u2713" : "\u2718")


        } catch (error) {
            alert(error)
        }
    });

    btn.addEventListener('click', evt => {
        if (!slot_is_available) evt.preventDefault();
    });


});