const activateButtons = () => {
    document.getElementById("addItemButton")
            .addEventListener('click', () => addUrlRow());
    document.getElementById("bulkEditButton")
            .addEventListener('click', () => bulkEditUrls());
    document.getElementById("saveBulkButton")
            .addEventListener('click', () => saveBulkEdit());
    document.getElementById("clearItemUrls")
            .addEventListener('click', () => {
                clearItemUrlTable();
                addUrlRow();
            });
    document.getElementById("submitButton")
            .addEventListener('click', () => submit(getTitle(), getItemUrls()));
    document.getElementById('manualGame')
            .addEventListener('click', () => window.location.href = window.location.origin + "/create");
}

const saveBulkEdit = () => {
    clearItemUrlTable();
    document.getElementById('bulkEditUrls').value.split("\n").forEach(url => addUrlRow(url));
}

const bulkEditUrls = () => {
    document.getElementById('bulkEditUrls').value = getItemUrls().join("\n");
}

const addUrlRow = (url) => {
    const table = document.getElementById("itemUrls");
    let row = table.insertRow();

    let urlCell = row.insertCell(0);
    let input = document.createElement('input');
    input.type = "url";
    input.classList.add("itemUrl", "form-control");
    if (url) {
        input.value = url;
    }
    urlCell.appendChild(input);

    let removeRow = row.insertCell(1);
    let removeButton = document.createElement('button');
    removeButton.type = "button";
    removeButton.classList.add("close", "text-danger");
    removeButton.setAttribute("aria-label", "Close");
    removeButton.innerHTML =
        `<span aria-hidden="true">&times;</span>`;
    removeButton.addEventListener('click', (el) => deleteRow(el.target.parentNode.parentNode.parentNode));
    removeRow.appendChild(removeButton);
}

const deleteRow = (row) => {
    const rowIndex = row.rowIndex;
    document.getElementById("itemUrls").deleteRow(rowIndex - 1);
}

const submit = (title, itemUrls) => {
    const json = {
        "title": title,
        "itemUrls": itemUrls
    };

    const options = {
        method: 'POST',
        body: JSON.stringify(json),
        headers: {
            'Content-Type': 'application/json'
        }
    };

    setSubmitButtonLoading(true);
    fetch('/api/games/auto', options)
        .then(res => res.json())
        .then(data => {
            setSubmitButtonLoading(false);
            if (data.success) {
                const objectToSend = {
                    title: json.title,
                    items: data.data.items
                };

                const params = {
                    data: JSON.stringify(objectToSend)
                }

                const url = new URL(window.location.origin + "/create");
                url.search = new URLSearchParams(params).toString();

                window.location.href = url.toString();
            }
        })
        .catch(err => {
            setSubmitButtonLoading(false);
            console.error(err);
        });
}

const setSubmitButtonLoading = (isLoading) => {
    const button = document.getElementById('submitButton');
    if (isLoading) {
        button.disabled = true;

        let span = document.createElement('span');
        span.classList.add("spinner-border", "spinner-border-sm");
        span.setAttribute("role", "status");
        span.setAttribute("aria-hidden", "true");

        button.innerHTML = "";
        button.appendChild(span);
        button.appendChild(document.createTextNode(" Loading..."));
    } else {
        button.disabled = false;
        button.innerHTML = "";
        button.appendChild(document.createTextNode("Submit"));
    }
}

const clearItemUrlTable = () => {
    const oldTbody = document.getElementById('itemUrls');
    const newTbody = document.createElement('tbody');
    oldTbody.parentNode.replaceChild(newTbody, oldTbody);
    newTbody.id = "itemUrls";
}

const getTitle = () => {
    return document.getElementById('gameTitle').value;
}

const getItemUrls = () => {
    return Array.prototype.map.call(
        document.getElementsByClassName('itemUrl'),
        el => el.value
    )
}

window.onload = () => {
    activateButtons();
    addUrlRow();
}
