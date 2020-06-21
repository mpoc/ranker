let itemIdArray;

const makeImagesClickable = () => {
    Array.prototype.forEach.call(
        document.getElementsByClassName("choice"),
        img => img.addEventListener("click", () => vote(img.getAttribute("item-id")))
    );
}

const clearChoiceImagesSrc = () => {
    Array.prototype.forEach.call(
        document.getElementsByClassName("choice"),
        img => img.src = ""
    );
}

const removeElement = (element) => {
    element.parentNode.removeChild(element);
}

const createSpinner = () => {
    const spinner = document.createElement("div");
    spinner.classList.add("spinner-border", "loading-image");
    spinner.style = "width: 3rem; height: 3rem;";
    spinner.setAttribute("role", "status");
    spinner.innerHTML = `<span class="sr-only">Loading...</span>`;
    return spinner;
}

const setImagesLoading = (loading) => {
    if (loading) {
        const choiceImages = document.querySelectorAll(".choice");
        choiceImages.forEach(img => img.parentNode.appendChild(createSpinner()));
    } else {
        const loadingImageDivs = document.querySelectorAll(".loading-image");
        loadingImageDivs.forEach(el => removeElement(el));
    }
}

const vote = (winnerId) => {
    const json = {
        "itemIds": itemIdArray,
        "winnerId": winnerId
    };

    const options = {
        method: 'POST',
        body: JSON.stringify(json),
        headers: {
            'Content-Type': 'application/json'
        }
    }

    clearChoiceImagesSrc();
    clearItemTitles();
    setImagesLoading(true);

    fetch('/api/matches', options)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setAccuracy(data.data.accuracy);
                fetchImagesForMatch();
            }
        })
        .catch(err => console.error(err));
}

const setAccuracy = (accuracy) => {
    document.getElementById('accuracy').textContent =
        "Accuracy: " + Math.round(accuracy * 100) + "%";
}

const fetchImagesForMatch = () => {
    const path = window.location.pathname.split('/'); 
    const gameId = path[path.length - 1];

    const options = {
        method: 'GET',
        redirect: 'follow'
    };

    fetch('/api/matches/new?gameId=' + gameId, options)
        .then(res => res.json())
        .then(data => {
            setImagesLoading(false);
            if (data.success) {
                setImages(data.data.items);
                setAccuracy(data.data.accuracy);
            }
        })
        .catch(err => {
            setImagesLoading(false);
            console.error(err);
        });
}

const storeItemIds = (items) => {
    itemIdArray = items.map((item) => item._id);
}

const setItemImage = (element, itemId, imageUrl) => {
    element.setAttribute("item-id", itemId);
    element.src = imageUrl;
}

const clearItemTitles = () => {
    document.getElementById("firstTitle").innerHTML = "";
    document.getElementById("secondTitle").innerHTML = "";
}

const setItemTitle = (item, title, url) => {
    const itemLink = document.createElement("a");
    itemLink.href = url;
    itemLink.innerHTML = title;

    item.innerHTML = "";
    item.appendChild(itemLink);
}

const setImages = (items) => {
    storeItemIds(items);

    setItemImage(document.getElementById("firstChoice"), items[0]._id, items[0].imageUrl);
    setItemImage(document.getElementById("secondChoice"), items[1]._id, items[1].imageUrl);

    setItemTitle(document.getElementById("firstTitle"), items[0].title, items[0].url);
    setItemTitle(document.getElementById("secondTitle"), items[1].title, items[1].url);

    // document.getElementById('firstRating').innerHTML = "Rating: " + items[0].rating.rating;
    // document.getElementById('secondRating').innerHTML = "Rating: " + items[1].rating.rating;

    // document.getElementById('firstDeviation').innerHTML = "Rating deviation: " + items[0].rating.ratingDeviation;
    // document.getElementById('secondDeviation').innerHTML = "Rating deviation: " + items[1].rating.ratingDeviation;
}

document.addEventListener('keydown', (e) => {
    if (e.code == "ArrowLeft") {
        vote(document.getElementById('firstChoice').getAttribute("item-id"));
    } else if (e.code == "ArrowRight") {
        vote(document.getElementById('secondChoice').getAttribute("item-id"));
    }
});

window.onload = () => {
    makeImagesClickable();
    fetchImagesForMatch();
}
