document.addEventListener("DOMContentLoaded", evt => {

    const form = document.getElementById('book_slot_form');
    const instructor_select = document.getElementById('instructor_select');
    const btn = document.querySelector("form > button")
    const cancel_session_btns = document.querySelectorAll("td > form > button");


    let slot_is_available = true;

    const duration = document.querySelector('select');
    const availability_span = document.getElementById("availability");


    const datetime = document.querySelector('input[type="datetime-local"]');



    cancel_session_btns.forEach(btn => {
        btn.addEventListener('click', evt => {
            const answer = confirm("Are you sure you want to cancel this session?")
            if (!answer) evt.preventDefault();
        })
    })

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
                body: JSON.stringify({year: year, month: month, day: day, instructor_id: instructor_select.value})
            });

            const booked_halves_array = await response.json();

            for (let i = 0; i < halves_count; ++i) {
                if (booked_halves_array.includes(first_half_hr + i)) {
                    slot_is_available = false;
                    break;
                }
            }

            if (slot_is_available) {
                availability_span.textContent = "Slot available \u2713"
                availability_span.classList = "B-xlg txt-green"
            } else {
                availability_span.textContent = "Slot unavailable \u2718"
                availability_span.classList = "B-xlg txt-red"
            }
        } catch (error) {
            alert(error)
        }
    });

    btn.addEventListener('click', evt => {
        if (!slot_is_available) evt.preventDefault();
    });

});