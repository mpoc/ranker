const activateButtons = () => {
    document.getElementById("addItemButton")
            .addEventListener('click', () => addItemRow());
    document.getElementById("clearItems")
            .addEventListener('click', () => clearItemTable());
    document.getElementById("submitButton")
            .addEventListener('click', () => submit(getGameTitle(), getItems()));
    document.getElementById("updateAllImages")
            .addEventListener('click', () => updateAllImages());
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
    document.getElementById("updateAllImages").disabled = true;
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
    const voteButton = document.createElement('button'); 
    voteButton.type = "button";
    voteButton.classList.add("btn", "btn-primary");
    voteButton.innerHTML = "Vote";
    voteButton.addEventListener('click', () => openVoteTab(id));
    return voteButton;
}

const openVoteTab = (id) => {
    window.open(window.location.origin + "/vote/" + id, '_blank')
}

const createRatingsButton = (id) => {
    const ratingsButton = document.createElement('button'); 
    ratingsButton.type = "button";
    ratingsButton.classList.add("btn", "btn-primary");
    ratingsButton.innerHTML = "Ratings";
    ratingsButton.addEventListener("click", () => openRatingsTab(id));
    return ratingsButton;
}

const openRatingsTab = (id) => {
    window.open(window.location.origin + "/ratings/" + id, "_blank");
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

const createItemUpdateImageButton = () => {
    const updateImageButton = document.createElement('button', ); 
    updateImageButton.type = "button";
    // updateImageButton.id = "imageUrl";
    updateImageButton.classList.add("btn", "btn-primary");
    updateImageButton.innerHTML = "Update image";
    updateImageButton.addEventListener('click', (el) => updateImageWithButton(el.target));
    return updateImageButton;
}

const createItemRemoveButton = () => {
    const removeButton = document.createElement('button');
    removeButton.type = "button";
    removeButton.classList.add("close", "text-danger");
    removeButton.setAttribute("aria-label", "Close");
    removeButton.innerHTML = `<span aria-hidden="true">&times;</span>`;
    removeButton.addEventListener('click', (el) => deleteRow(el.target.parentNode.parentNode.parentNode));
    return removeButton;
}

const addItemRow = (title, url, imageUrl) => {
    const table = document.getElementById("items");
    const row = table.insertRow();
    row.classList.add("item");
    
    const titleRow = row.insertCell(0);
    const urlRow = row.insertCell(1);
    const imageUrlRow = row.insertCell(2);
    const imagePreviewRow = row.insertCell(3);
    const updateImageRow = row.insertCell(4);
    const removeRow = row.insertCell(5);

    titleRow.appendChild(createItemTitleInput(title));
    urlRow.appendChild(createItemUrlInput(url));
    imageUrlRow.appendChild(createItemImageUrlInput(imageUrl));
    imagePreviewRow.appendChild(createItemImagePreview(imageUrl));
    updateImageRow.appendChild(createItemUpdateImageButton());
    removeRow.appendChild(createItemRemoveButton());
}

const deleteRow = (row) => {
    const rowIndex = row.rowIndex;
    document.getElementById("items").deleteRow(rowIndex - 1);
}

const updateImageWithButton = (button) => {
    const row = button
        .parentElement  // td
        .parentElement; // tr

    //- row.getElementById('imagePreview').src = row.getElementById('imageUrl').value;
    // Ugly and temporary solution because Elements have no getElementById method
    row.getElementsByTagName('img')[0].src = row.getElementsByTagName('input')[2].value;
}

const updateAllImages = () => {
    Array.prototype.forEach.call(
        document.getElementById('items').getElementsByTagName('tr'),
        row => row.getElementsByTagName('img')[0].src = row.getElementsByTagName('input')[2].value
    );
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
