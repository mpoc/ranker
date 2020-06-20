const activateButtons = () => {
    document.getElementById("addItemButton")
            .addEventListener('click', () => addItemRow());
    document.getElementById("clearItems")
            .addEventListener('click', () => clearItemTable());
    document.getElementById("submitButton")
            .addEventListener('click', () => submit(getTitle(), getItems()));
    document.getElementById("updateAllImages")
            .addEventListener('click', () => updateAllImages());
}

const getTitle = () => {
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
                document.getElementById('updateAllImages').disabled = true;
                document.getElementById('addItemButton').disabled = true;
                document.getElementById('clearItems').disabled = true;
                document.getElementById('submitButton').disabled = true;

                let table = document.getElementById('buttons');

                let row1 = table.insertRow();
                let voteButtonCell = row1.insertCell(0);
                let voteButton = document.createElement('button'); 
                voteButton.type = "button";
                voteButton.classList.add("btn", "btn-primary");
                voteButton.innerHTML = "Vote";
                voteButton.addEventListener('click',
                    el => window.open(window.location.origin + "/vote/" + data.data._id, '_blank'));
                voteButtonCell.appendChild(voteButton);

                let row2 = table.insertRow();
                let ratingsCell = row2.insertCell(0);
                let ratingsButton = document.createElement('button'); 
                ratingsButton.type = "button";
                ratingsButton.classList.add("btn", "btn-primary");
                ratingsButton.innerHTML = "Ratings";
                ratingsButton.addEventListener('click',
                    el => window.open(window.location.origin + "/ratings/" + data.data._id, '_blank'));
                ratingsCell.appendChild(ratingsButton);
            }
        })
        .catch(err => {
            setSubmitButtonLoading(false);
            console.error(err)
        });
}

const fillSentItems = () => {
    const urlParams = new URLSearchParams(window.location.search);
    try {
        const sentItems = JSON.parse(urlParams.get('data'));
        if (sentItems && sentItems.items && sentItems.items.length) {
            document.getElementById('gameTitle').value = sentItems.title;
            Array.prototype.forEach.call(sentItems.items, item => addItemRow(item.title, item.url, item.imageUrl));
        } else {
            addItemRow();
        }
    } catch (e) {
        addItemRow();
    }
}

const addItemRow = (title, url, imageUrl) => {
    const table = document.getElementById("items");
    let row = table.insertRow();
    row.classList.add("item");

    let titleRow = row.insertCell(0);
    let urlRow = row.insertCell(1);
    let imageUrlRow = row.insertCell(2);
    let imagePreviewRow = row.insertCell(3);
    let updateImageRow = row.insertCell(4);
    let removeRow = row.insertCell(5);

    let titleInput = document.createElement('input'); 
    titleInput.type = "text";
    //- titleInput.id = "title";
    titleInput.classList.add("form-control");
    if (title) {
        titleInput.value = title;
    }

    let urlInput = document.createElement('input'); 
    urlInput.type = "url";
    urlInput.id = "url";
    urlInput.classList.add("form-control");
    if (url) {
        urlInput.value = url;
    }

    let imageUrlInput = document.createElement('input'); 
    imageUrlInput.type = "url";
    imageUrlInput.id = "imageUrl";
    imageUrlInput.classList.add("form-control");
    if (imageUrl) {
        imageUrlInput.value = imageUrl;
    }

    let imageImg = document.createElement('img'); 
    imageImg.id = "imagePreview";
    imageImg.classList.add("preview");
    if (imageUrl) {
        imageImg.src = imageUrl;
    }

    let updateImageButton = document.createElement('button'); 
    updateImageButton.type = "button";
    updateImageButton.id = "imageUrl";
    updateImageButton.classList.add("btn", "btn-primary");
    updateImageButton.innerHTML = "Update image";
    updateImageButton.addEventListener('click', (el) => updateImageWithButton(el.target));

    let removeButton = document.createElement('button');
    removeButton.type = "button";
    removeButton.classList.add("close", "text-danger");
    removeButton.setAttribute("aria-label", "Close");
    removeButton.innerHTML =
        `<span aria-hidden="true">&times;</span>`;
    removeButton.addEventListener('click', (el) => deleteRow(el.target.parentNode.parentNode.parentNode));

    titleRow.appendChild(titleInput);
    urlRow.appendChild(urlInput);
    imageUrlRow.appendChild(imageUrlInput);
    imagePreviewRow.appendChild(imageImg);
    updateImageRow.appendChild(updateImageButton);
    removeRow.appendChild(removeButton);
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
    console.log(document.getElementById('items').getElementsByTagName('tr'));
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