const activateButtons = () => {
    document.getElementById("addItemButton")
            .addEventListener('click', () => addUrlRow());
    document.getElementById("bulkEditButton")
            .addEventListener('click', () => bulkEditUrls());
    document.getElementById("saveBulkButton")
            .addEventListener('click', () => saveBulkEdit());
    document.getElementById("deleteAllItemsButton")
            .addEventListener('click', () => deleteAllItems());
    document.getElementById("submitButton")
            .addEventListener('click', () => submit(getTitle(), getItemUrls()));
}

const deleteAllItems = () => {
    clearItemUrlTable();
    addUrlRow();
}

const saveBulkEdit = () => {
    clearItemUrlTable();
    document.getElementById('bulkEditUrls').value.split("\n").forEach(url => addUrlRow(url));
}

const bulkEditUrls = () => {
    document.getElementById('bulkEditUrls').value = getItemUrls().join("\n");
}

const createRemoveButton = () => {
    const removeButton = document.createElement('button');
    removeButton.type = "button";
    removeButton.classList.add("close", "text-danger");
    removeButton.setAttribute("aria-label", "Close");
    removeButton.innerHTML =
        `<span aria-hidden="true">&times;</span>`;
    removeButton.addEventListener('click', (el) => deleteRow(el.target.parentNode.parentNode.parentNode));
    return removeButton;
}

const createUrlInput = (url) => {
    const urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.classList.add("itemUrl", "form-control");
    if (url) {
        urlInput.value = url;
    }
    return urlInput;
}

const addUrlRow = (url) => {
    const table = document.getElementById("itemUrls");
    const row = table.insertRow(table.rows.length - 1);

    const urlCell = row.insertCell(0);
    urlCell.appendChild(createUrlInput(url));

    const removeCell = row.insertCell(1);
    removeCell.appendChild(createRemoveButton());
}

const deleteRow = (row) => {
    const rowIndex = row.rowIndex;
    if (row.parentNode.rows.length > 2) {
        document.getElementById("itemUrls").deleteRow(rowIndex - 1);
    } else if (row.parentNode.rows.length == 2) {
        deleteAllItems();
    }
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
                sendDataToCreate({
                    title,
                    items: data.data.items,
                });
            }
        })
        .catch(err => {
            setSubmitButtonLoading(false);
            console.error(err);
        });
}

const sendDataToCreate = (data) => {
    const params = {
        data: JSON.stringify(data)
    };

    const url = new URL("create", window.location.origin);
    url.search = new URLSearchParams(params).toString();

    window.location.href = url.toString();
}

const createSpinner = () => {
    const span = document.createElement("span");
    span.classList.add("spinner-border", "spinner-border-sm");
    span.setAttribute("role", "status");
    span.setAttribute("aria-hidden", "true");
    return span;
}

const setSubmitButtonLoading = (isLoading) => {
    const button = document.getElementById('submitButton');
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = "";
        const spinnerSpan = createSpinner();
        button.appendChild(spinnerSpan);
        button.appendChild(document.createTextNode(" Loading..."));
    } else {
        button.disabled = false;
        button.innerHTML = "";
        button.appendChild(document.createTextNode("Submit"));
    }
}

const clearItemUrlTable = () => {
    const oldTbody = document.getElementById('itemUrls');
    const newTbody = createItemTbody();
    oldTbody.parentNode.replaceChild(newTbody, oldTbody);
}

const createItemTbody = () => {
    const tbody = document.createElement('tbody');
    tbody.id = "itemUrls";

    const addItemButton = document.getElementById('addItemButton');
    tbody.insertRow().insertCell().appendChild(addItemButton);

    return tbody;
};

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
