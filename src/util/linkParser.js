import { mangaLinks } from '../util/static.js';

export let linkParser = (links,id) => {
    let official = [];
    let retail = [];
    let information = [];

    if(!links){
        return {
            official: official,
            retail: retail,
            information: information,
        }
    }

    Object.keys(links).map(function(key){
        switch(key){
            case "al":
                information.push({
                    name: mangaLinks[key],
                    url: "https://anilist.co/manga/" + links[key],
                });
            break;
            case "ap":
                information.push({
                    name: mangaLinks[key],
                    url: "https://www.anime-planet.com/manga/" + links[key],
                });
            break;
            case "bw":
                retail.push({
                    name: mangaLinks[key],
                    url: "https://bookwalker.jp/" + links[key],
                });
            break;
            case "mu":
                information.push({
                    name: mangaLinks[key],
                    url: "https://www.mangaupdates.com/series.html?id=" + links[key],
                });
            break;
            case "nu":
                information.push({
                    name: mangaLinks[key],
                    url: "https://www.novelupdates.com/series/" + links[key],
                });
            break;
            case "kt":
                information.push({
                    name: mangaLinks[key],
                    url: "https://kitsu.io/manga/" + links[key],
                });
            break;
            case "amz":
                retail.push({
                    name: mangaLinks[key],
                    url: links[key],
                });
            break;
            case "ebj":
                retail.push({
                    name: mangaLinks[key],
                    url: links[key],
                });
            break;
            case "mal":
                information.push({
                    name: mangaLinks[key],
                    url: "https://myanimelist.net/manga/" + links[key],
                });
            break;
            case "raw":
                official.push({
                    name: mangaLinks[key],
                    url: links[key],
                });
            break;
            case "engtl":
                official.push({
                    name: mangaLinks[key],
                    url: links[key],
                });
            break;
        }
    });
    
    official.push({
        name: "MangaDex",
        url: "https://mangadex.org/title/" + id,
    });

    official.push({
        name: "Cubari",
        url: "https://cubari.moe/read/mangadex/" + id,
    });

    return {
        official: official,
        retail: retail,
        information: information,
    }
}

