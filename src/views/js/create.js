const activateButtons = () => {
    document.getElementById("addItemButton")
            .addEventListener('click', () => addItemRow());
    document.getElementById("clearItems")
            .addEventListener('click', () => clearItemTable());
    document.getElementById("submitButton")
            .addEventListener('click', () => submit(getGameTitle(), getItems()));
}

const getGameTitle = () => {
    return document.getElementById('gameTitle').value;
}

const getItems = () => {
    return Array.prototype.map.call(
        document.getElementsByClassName('item'),
        el => ({
            title: el.getElementsByTagName('input')[0].value,
            url: el.getElementsByTagName('input')[1].value,
            imageUrl: el.getElementsByTagName('input')[2].value
        })
    )
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

const disableButtons = () => {
    document.getElementById("addItemButton").disabled = true;
    document.getElementById("clearItems").disabled = true;
    document.getElementById("submitButton").disabled = true;
}

const submit = (title, items) => {
    const json = {
        "title": title,
        "items": items
    };

    const options = {
        method: 'POST',
        body: JSON.stringify(json),
        headers: {
            'Content-Type': 'application/json'
        }
    }

    setSubmitButtonLoading(true);
    fetch('/api/games', options)
        .then(res => res.json())
        .then(data => {
            setSubmitButtonLoading(false);
            if (data.success) {
                disableButtons();
                createGameButtons(data.data._id);
            }
        })
        .catch(err => {
            setSubmitButtonLoading(false);
            console.error(err)
        });
}

const createVoteButton = (id) => {
    const voteButton = document.createElement('a');
    voteButton.setAttribute("role", "button");
    voteButton.classList.add("btn", "btn-primary");
    voteButton.innerHTML = "Vote";
    voteButton.target = "_blank";
    voteButton.href = "/vote/" + id;
    return voteButton;
}

const createRatingsButton = (id) => {
    const ratingsButton = document.createElement('a'); 
    ratingsButton.setAttribute("role", "button");
    ratingsButton.classList.add("btn", "btn-primary");
    ratingsButton.innerHTML = "Ratings";
    ratingsButton.target = "_blank";
    ratingsButton.href = "/ratings/" + id;
    return ratingsButton;
}

const createGameButtons = (id) => {
    const table = document.getElementById("buttons");

    const voteButtonRow = table.insertRow();
    const voteButtonCell = voteButtonRow.insertCell(0);
    voteButtonCell.appendChild(createVoteButton(id));

    const ratingsButtonRow = table.insertRow();
    const ratingsButtonCell = ratingsButtonRow.insertCell(0);
    ratingsButtonCell.appendChild(createRatingsButton(id));
}

const fillSentItems = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get('data');
    const sentItems = parseSentItems(data);
    if (sentItems && sentItems.items) {
        document.getElementById('gameTitle').value = sentItems.title;
        sentItems.items.forEach(item => addItemRow(item.title, item.url, item.imageUrl));
    } else {
        addItemRow();
    }
}

const parseSentItems = (data) => {
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error(e);
        return null;
    }
}

const createItemTitleInput = (title) => {
    const titleInput = document.createElement("input");
    // titleInput.id = "title";
    titleInput.type = "text";
    titleInput.classList.add("form-control");
    if (title) {
        titleInput.value = title;
    }
    return titleInput;
}

const createItemUrlInput = (url) => {
    const urlInput = document.createElement('input'); 
    urlInput.type = "url";
    urlInput.id = "url";
    urlInput.classList.add("form-control");
    if (url) {
        urlInput.value = url;
    }
    return urlInput;
}

const createItemImageUrlInput = (imageUrl) => {
    const imageUrlInput = document.createElement('input'); 
    imageUrlInput.type = "url";
    imageUrlInput.id = "imageUrl";
    imageUrlInput.classList.add("form-control");
    if (imageUrl) {
        imageUrlInput.value = imageUrl;
    }
    imageUrlInput.addEventListener("input", () => updateImagePreview(imageUrlInput));
    return imageUrlInput;
}

const createItemImagePreview = (imageUrl) => {
    const imagePreview = document.createElement('img');
    imagePreview.id = "imagePreview";
    imagePreview.classList.add("preview");
    if (imageUrl) {
        imagePreview.src = imageUrl;
    }
    return imagePreview;
}

const createItemRemoveButton = () => {
    const removeButton = document.createElement('button');
    removeButton.type = "button";
    removeButton.classList.add("close", "text-danger");
    removeButton.setAttribute("aria-label", "Close");
    removeButton.innerHTML = `<span aria-hidden="true">&times;</span>`;
    removeButton.addEventListener('click', (ev) => deleteRow(ev.target.parentNode.parentNode.parentNode));
    return removeButton;
}

const addItemRow = (title, url, imageUrl) => {
    const table = document.getElementById("items");
    const row = table.insertRow();
    row.classList.add("item");
    
    const titleCell = row.insertCell(0);
    const urlCell = row.insertCell(1);
    const imageUrlCell = row.insertCell(2);
    const imagePreviewCell = row.insertCell(3);
    const removeCell = row.insertCell(4);

    titleCell.appendChild(createItemTitleInput(title));
    urlCell.appendChild(createItemUrlInput(url));
    imageUrlCell.appendChild(createItemImageUrlInput(imageUrl));
    imagePreviewCell.appendChild(createItemImagePreview(imageUrl));
    removeCell.appendChild(createItemRemoveButton());
}

const deleteRow = (row) => {
    const rowIndex = row.rowIndex;
    document.getElementById("items").deleteRow(rowIndex - 1);
}

const updateImagePreview = (imageUrlInput) => {
    const tr = imageUrlInput
        .parentElement  // td
        .parentElement; // tr
    const imagePreview = tr.getElementsByTagName("img")[0];
    imagePreview.src = imageUrlInput.value;
}

const clearUrlParams = () => {
    const clearedUrl = window.location.origin + window.location.pathname;
    window.history.pushState({}, null, clearedUrl)
}

const clearItemTable = () => {
    const oldTbody = document.getElementById('items');
    const newTbody = document.createElement('tbody');
    oldTbody.parentNode.replaceChild(newTbody, oldTbody);
    newTbody.id = "items";
    clearUrlParams();
    addItemRow();
}

window.onload = () => {
    activateButtons();
    fillSentItems();
}
