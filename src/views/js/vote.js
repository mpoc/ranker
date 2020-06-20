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

const setImagesLoading = (loading) => {
    if (loading) {
        const choiceImages = document.querySelectorAll(".choice");
        choiceImages.forEach(img => {
            const spinner = document.createElement('div');
            spinner.classList.add("spinner-border", "loading-image");
            spinner.style = "width: 3rem; height: 3rem;";
            spinner.setAttribute("role", "status");
            spinner.innerHTML = `<span class="sr-only">Loading...</span>`;
            img.parentNode.appendChild(spinner);
        });
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

const setImages = (items) => {
    itemIdArray = items.map(item => item._id);

    const firstChoice = document.getElementById('firstChoice');
    firstChoice.setAttribute('item-id', items[0]._id);
    firstChoice.setAttribute('src', items[0].imageUrl);

    const secondChoice = document.getElementById('secondChoice');
    secondChoice.setAttribute('item-id', items[1]._id);
    secondChoice.setAttribute('src', items[1].imageUrl);

    const firstTitle = document.getElementById('firstTitle');
    const firstTitleA = document.createElement('a');
    firstTitleA.href = items[0].url;
    firstTitleA.innerHTML = items[0].title;
    firstTitle.innerHTML = "";
    firstTitle.appendChild(firstTitleA);

    const secondTitle = document.getElementById('secondTitle');
    const secondTitleA = document.createElement('a');
    secondTitleA.href = items[1].url;
    secondTitleA.innerHTML = items[1].title;
    secondTitle.innerHTML = "";
    secondTitle.appendChild(secondTitleA);

    //- const firstRating = document.getElementById('firstRating');
    //- firstRating.innerHTML = "Rating: " + items[0].rating.rating;

    //- const secondRating = document.getElementById('secondRating');
    //- secondRating.innerHTML = "Rating: " + items[1].rating.rating;

    const firstDeviation = document.getElementById('firstDeviation');
    firstDeviation.innerHTML = "Rating deviation: " + items[0].rating.ratingDeviation;

    const secondDeviation = document.getElementById('secondDeviation');
    secondDeviation.innerHTML = "Rating deviation: " + items[1].rating.ratingDeviation;
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