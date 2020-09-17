const fetchGame = () => {
    const path = window.location.pathname.split('/'); 
    const gameId = path[path.length - 1];

    const options = {
        method: 'GET',
        redirect: 'follow'
    };

    fetch('/api/games?id=' + gameId, options)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                populateTable(data.data.items);
                setTitle(data.data.title);
            }
        })
        .catch(err => console.error(err));
}

const createItemTitle = (title, url) => {
    const titleLink = document.createElement("a");
    titleLink.href = url;
    titleLink.innerHTML = title;
    return titleLink;
}

const createItemImage = (imageUrl, url) => {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.loading = "lazy";

    const imageLink = document.createElement("a");
    imageLink.href = url;
    imageLink.appendChild(image);

    return imageLink;
}

let nextRank = 1;

const populateTable = (items) => {
    const table = document.getElementById("items");
    items.forEach(item => {
        const row = table.insertRow();

        const rankCell = row.insertCell(0);
        const titleCell = row.insertCell(1);
        const ratingCell = row.insertCell(2);
        const imageCell = row.insertCell(3);
        
        rankCell.innerHTML = nextRank++;
        titleCell.appendChild(createItemTitle(item.title, item.url));
        ratingCell.innerHTML = item.rating.rating;
        //- ratingCell.innerHTML = item.rating.rating + "<br>" + item.rating.ratingDeviation;
        imageCell.appendChild(createItemImage(item.imageUrl, item.url));
    });
}

const setTitle = (title) => {
    document.title = title + " - Ratings - Ranker";
};

window.onload = () => {
    fetchGame();
}
