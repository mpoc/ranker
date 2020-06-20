const fetchGame = () => {
    const path = window.location.pathname.split('/'); 
    const gameId = path[path.length - 1];

    const options = {
        method: 'GET',
        redirect: 'follow'
    };

    fetch('/api/games?id=' + gameId, options)
        .then(res => res.json())
        .then(data => { if (data.success) populateTable(data.data.items) })
        .catch(err => console.error(err));
}

let lowestRank = 1;

const populateTable = (items) => {
    const table = document.getElementById("items");
    items.forEach(item => {
        let row = table.insertRow();

        let rank = row.insertCell(0);
        let title = row.insertCell(1);
        let elo = row.insertCell(2);
        let image = row.insertCell(3);

        let img = document.createElement('img');
        img.src = item.imageUrl;
        img.loading = "lazy";

        let a = document.createElement('a');
        a.href = item.url;
        a.innerHTML = item.title;

        rank.innerHTML = lowestRank++;
        title.appendChild(a);
        //- elo.innerHTML = item.rating.rating + "<br>" + item.rating.ratingDeviation;
        elo.innerHTML = item.rating.rating;
        image.appendChild(img);
    });
}

window.onload = () => {
    fetchGame();
}