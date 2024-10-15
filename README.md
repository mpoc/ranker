# Ranker

A web app for ranking items through pairwise comparisons using ELO and Glicko-2 algorithms.

## Features

* Web UI for creating lists, voting and viewing rankings
* Automatic metadata retrieval from URLs for comparison of products, movies, foods, etc.
* ELO and Glicko-2 ranking algorithms
* RESTful API

## Usage

### Docker

```
wget "https://raw.githubusercontent.com/mpoc/ranker/master/docker-compose.yml"
docker-compose up -d
```

### Local

```
yarn install
yarn prod
```
