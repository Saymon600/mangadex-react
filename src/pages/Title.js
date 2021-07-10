import React from "react";
import axios from 'axios';
import { withRouter } from "react-router";
import { demographic,mangaStatus,mangaContentRating } from '../util/static.js';
import { linkParser } from '../util/linkParser.js';
import { Link } from "react-router-dom";
import Tags from '../component/Tags.js';
import LanguageFlag  from '../component/LanguageFlag.js';
import TitleTableRow from '../component/TitleTableRow.js';
import Header from '../component/Header.js';
import Footer from '../component/Footer.js';
import toast, { Toaster } from 'react-hot-toast';
import { colorTheme } from "../util/colorTheme";
import { isLogged } from "../util/loginUtil.js";
import Loading from '../component/Loading.js';

class Title extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            id: '',
            coverFile: '',
            author: [],
            artist: [],
            title: '',
            demo: '',
            status: '',
            description: '',
            originalLanguage: '',
            altTitles: [],
            genre: [],
            theme: [],
            contentRating: '',
            official: [],
            retail: [],
            information: [],
            offset: 0,
            chapterList: [],
            coverList: [],
            chapterRead: [],
            chapterOffset: 0,
            chapterShowMore: false,
            coverOffset: 0,
            coverShowMore: false,

            tabControl: {
                active: "chapter",
                btnChapter: "text-center px-3 py-1 mr-3 mb-3 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                btnCover: "text-center px-3 py-1 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                contentChapter: "w-full p-3 border-2 border-gray-200 dark:border-gray-900",
                contentCover: "w-full hidden p-3 border-2 border-gray-200 dark:border-gray-900"
            },
            loadChapterControl: {
                btnClass: "text-center px-3 py-1 focus:outline-none border-2 border-gray-200 dark:border-gray-900 mt-4",
                btnLabel: "Load More"
            },
            loadCoverControl: {
                btnClass: "text-center px-3 py-1 focus:outline-none border-2 border-gray-200 dark:border-gray-900 mt-4",
                btnLabel: "Load More"
            }
        };
    }

    componentDidMount = () => {
        document.title = "Manga - Mangadex";
        const id = this.props.match.params.id;
        this.setState({id:id},() => this.init());
        
        
    }

    init = () => {
        this.getMangaInfo();
        this.getCoverList();

        let logged = isLogged();
        if(logged){
            this.getChapterRead();
        }else{
            this.getChapterList();
        }
    }

    getMangaInfo = () => {
        var $this = this;
        axios.get('https://api.mangadex.org/manga/' + this.state.id + '?includes[]=author&includes[]=artist&includes[]=cover_art')
        .then(function(response){
            let authors = [];
            let artists = [];
            response.data.relationships.map((relation) => {
                switch(relation.type){
                    case "artist":
                        artists.push({id:relation.id,name:relation.attributes.name});
                    break;
                    case "author":
                        authors.push({id:relation.id,name:relation.attributes.name});
                    break;
                    case "cover_art":
                        let coverFile = "https://uploads.mangadex.org/covers/" +  $this.state.id + "/" + relation.attributes.fileName + ".512.jpg";
                        $this.setState({coverFile:coverFile});
                    break;
                } 
            });
            $this.setState({
                artist:artists,
                author:authors
            });

            let title = "";
            Object.keys(response.data.data.attributes.title).map(function(key){
                if(key == "en" || title == ""){
                    title = response.data.data.attributes.title[key];
                }
            });

            let altTitles = [];
            for(let i = 0; i < response.data.data.attributes.altTitles.length; i++){
                Object.keys(response.data.data.attributes.altTitles[i]).map(function(key){
                    altTitles.push(response.data.data.attributes.altTitles[i][key]);
                });
            }

            let genre = [];
            let theme = [];
            for(let i = 0; i < response.data.data.attributes.tags.length; i++){
                let tempTag = "";
                Object.keys(response.data.data.attributes.tags[i].attributes.name).map(function(key){
                    tempTag = {id: response.data.data.attributes.tags[i].id, name: response.data.data.attributes.tags[i].attributes.name[key]};
                });
                switch(response.data.data.attributes.tags[i].attributes.group){
                    case "genre":
                        genre.push(tempTag);
                    break;
                    case "theme":
                        theme.push(tempTag);
                    break;
                }
            }

            let parsedLinks = linkParser(response.data.data.attributes.links);

            let originalLanguage = response.data.data.attributes.originalLanguage;
            let contentRating = response.data.data.attributes.contentRating;
            let demo = response.data.data.attributes.publicationDemographic;
            let status = mangaStatus[response.data.data.attributes.status];
            let description = "";
            Object.keys(response.data.data.attributes.description).map(function(key){
                if(key == "en" || description == ""){
                    description = response.data.data.attributes.description[key];
                }
            });

            $this.setState({
                title:title,
                demo:demo,
                status: status,
                description: description,
                originalLanguage: originalLanguage,
                altTitles: altTitles,
                genre: genre,
                theme: theme,
                contentRating: contentRating,
                official: parsedLinks.official,
                retail: parsedLinks.retail,
                information: parsedLinks.information,
            });
            document.title = title + " - Mangadex";
        })
        .catch(function(error){
            toast.error('Error retrieving manga data.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getChapterRead = () => {
        var $this = this;
        var bearer = "Bearer " + localStorage.authToken;
        axios.get('https://api.mangadex.org/manga/read',{
            params: {
                ids: [this.state.id],
                grouped: true
            },
            headers: {  
                Authorization: bearer
            }
        })
        .then(function(response){
            if(Object.keys(response.data.data).length > 0){
                $this.setState({
                    chapterRead: response.data.data[$this.state.id]
                },$this.getChapterList());
            }else{
                $this.getChapterList()
            }
        })
        .catch(function(error){
            toast.error('Error retrieving read markers list.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getChapterList = () => {
        this.setState({
            loadChapterControl: {
                btnClass: "text-center px-3 py-1 focus:outline-none border-2 border-gray-200 dark:border-gray-900 mt-4",
                btnLabel:  
                <div className="inline-flex">
                    <span className="mr-2">Loading</span> 
                    <img className="w-6 h-6" alt="Loading" src={process.env.PUBLIC_URL + '/spin.svg'} />
                </div>
            }
        });
        var translatedLanguage = ["en"];
        if(localStorage.language){
            translatedLanguage = JSON.parse(localStorage.language);
        }
        var $this = this;
        axios.get('https://api.mangadex.org/chapter?order[chapter]=desc',{
            params: {
                manga: this.state.id,
                translatedLanguage: translatedLanguage,
                includes: ["scanlation_group","user"],
                offset: this.state.chapterOffset,
                limit: 100
            }
        })
        .then(function(response){
            let list = $this.state.chapterList;
            for(let i = 0; i < response.data.results.length; i++){
                response.data.results[i].read = false;
                if($this.state.chapterRead.indexOf(response.data.results[i].data.id) > -1){
                    response.data.results[i].read = true;
                }
                list.push(<TitleTableRow data={response.data.results[i]}/>)
            }

            let offset = parseInt($this.state.chapterOffset) + 100;
            let showMore = true;
            if(offset >= response.data.total){
                showMore = false;
            }

            $this.setState({
                chapterList: list,
                chapterOffset: offset,
                chapterLoadMore: showMore,
                loadChapterControl: {
                    btnClass: "text-center px-3 py-1 focus:outline-none border-2 border-gray-200 dark:border-gray-900 mt-4",
                    btnLabel: "Load More"
                }
            });
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving chapter list.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getCoverList = () => {
        this.setState({
            loadCoverControl: {
                btnClass: "text-center px-3 py-1 focus:outline-none border-2 border-gray-200 dark:border-gray-900 mt-4",
                btnLabel:  
                <div className="inline-flex">
                    <span className="mr-2">Loading</span> 
                    <img className="w-6 h-6" alt="Loading" src={process.env.PUBLIC_URL + '/spin.svg'} />
                </div>
            }
        });
        var $this = this;
        axios.get('https://api.mangadex.org/cover?order[volume]=desc',{
            params: {
                manga: [this.state.id],
                limit: 100,
                offset: this.state.coverOffset
            }
        })
        .then(function(response){
            let list = $this.state.coverList;
            for(let i = 0; i < response.data.results.length; i++){
                let fileFull = "https://uploads.mangadex.org/covers/" +  $this.state.id + "/" + response.data.results[i].data.attributes.fileName;
                let file = "https://uploads.mangadex.org/covers/" +  $this.state.id + "/" + response.data.results[i].data.attributes.fileName + ".512.jpg";
                let title = (response.data.results[i].data.attributes.volume) ? "Volume " + response.data.results[i].data.attributes.volume : "Cover"; 
                list.push(
                    <a href={fileFull} target="_blank"  className="w-1/5 content object-contain m-2" style={{cursor: "zoom-in"}}>
                        <img 
                            src={file}                            
                            alt={title}
                            title={title} />
                    </a>
                );
            }

            let offset = parseInt($this.state.coverOffset) + 100;
            let showMore = true;
            if(offset >= response.data.total){
                showMore = false;
            }
            $this.setState({
                coverList: list,
                coverOffset: offset,
                coverLoadMore: showMore,
                loadCoverControl: {
                    btnClass: "text-center px-3 py-1 focus:outline-none border-2 border-gray-200 dark:border-gray-900 mt-4",
                    btnLabel: "Load More"
                }
            });
        })
        .catch(function(error){
            console.log(error)
            toast.error('Error retrieving covers.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    changeTabs = (tab) => {
        switch(tab){
            case "chapter":
                this.setState({tabControl: {
                    active: "chapter",
                    btnChapter: "text-center px-3 py-1 mr-3 mb-3 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                    btnCover: "text-center px-3 py-1 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                    contentChapter: "w-full p-3 border-2 border-gray-200 dark:border-gray-900",
                    contentCover: "w-full hidden p-3 border-2 border-gray-200 dark:border-gray-900"
                }});
                
            break;
            case "cover":
                this.setState({tabControl: {
                    active: "cover",
                    btnChapter: "text-center px-3 py-1 mr-3 mb-3 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                    btnCover: "text-center px-3 py-1 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                    contentChapter: "w-full hidden p-3 border-2 border-gray-200 dark:border-gray-900",
                    contentCover: "w-full p-3 border-2 border-gray-200 dark:border-gray-900"
                }});
            break;
        }
    }

    render = () => {
        var altTitles = this.state.altTitles.map((alt) => <li>{alt}</li>);
        var genre = this.state.genre.map((g) => <Tags name={g.name} url={"/search?tag=" + g.id + "&tagName=" + g.name} />);
        var theme = this.state.theme.map((t) => <Tags name={t.name} url={"/search?tag=" + t.id + "&tagName=" + t.name}/>);
        var official = this.state.official.map((o) => <Tags name={o.name} url={o.url}/>);
        var retail = this.state.retail.map((r) => <Tags name={r.name}  url={r.url}/>);
        var information = this.state.information.map((i) => <Tags name={i.name}  url={i.url}/>);

        var authors = this.state.author.map((au) => 
            <Link className={"mr-4 " + colorTheme(500).text} to={"/search?author="+au.id}>{au.name}</Link>
        );
        var artists = this.state.artist.map((ar) => 
            <Link className={"mr-4 " + colorTheme(500).text} to={"/search?artist="+ar.id}>{ar.name}</Link>
        );


        var trAltTitles = "";
        var trAuthor = "";
        var trArtist = "";
        var trDemographic = "";
        var trGenre = "";
        var trTheme = "";
        var trContentRating = "";
        var trOfficial = "";
        var trRetail = "";
        var trInformation = "";
        if(altTitles.length > 0){
            trAltTitles = 
            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                <td width="20%" className="font-semibold">Alt name(s):</td>
                <td width="80%">
                    <ul className="list-disc">{altTitles}</ul>
                </td>
            </tr>;
        }
        if(authors.length > 0){
            trAuthor = 
            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                <td width="20%" className="font-semibold">Author:</td>
                <td width="80%">{authors}</td>
            </tr>;
        }
        if(artists.length > 0){
            trArtist = 
            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                <td width="20%" className="font-semibold">Artist:</td>
                <td width="80%">{artists}</td>
            </tr>;
        }
        if(this.state.demo){
            trDemographic = 
            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                <td width="20%" className="font-semibold">Demographic:</td>
                <td width="80%"><Tags name={demographic[this.state.demo]} url={"/search?demographic=" + this.state.demo}/></td>
            </tr>;
        }
        if(genre.length > 0){
            trGenre = 
            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                <td width="20%" className="font-semibold">Genre:</td>
                <td width="80%">{genre}</td>
            </tr>;
        }
        if(theme.length > 0){
            trTheme = 
            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                <td width="20%" className="font-semibold">Theme:</td>
                <td width="80%">{theme}</td>
            </tr>;
        }
        if(this.state.contentRating.length > 0){
            trContentRating = 
            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                <td width="20%" className="font-semibold">Content Rating:</td>
                <td width="80%"><Tags name={mangaContentRating[this.state.contentRating]} url={"/search?rating=" + this.state.contentRating}/></td>
            </tr>;
        }
        if(official.length > 0){
            trOfficial = 
            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                <td width="20%" className="font-semibold">Official:</td>
                <td width="80%">{official}</td>
            </tr>;
        }
        if(retail.length > 0){
            trRetail = 
            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                <td width="20%" className="font-semibold">Retail:</td>
                <td width="80%">{retail}</td>
            </tr>;
        }
        if(information.length > 0){
            trInformation = 
            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                <td width="20%" className="font-semibold">Information:</td>
                <td width="80%">{information}</td>
            </tr>;
        }

        var chapterLoading = (this.state.chapterList.length <= 0) ? <Loading /> : "";
        var coverLoading = (this.state.coverList.length <= 0) ? <Loading /> : "";
        var chapterLoadMore = (this.state.chapterLoadMore) ? 
        <button 
            onClick={this.getChapterList} 
            className={this.state.loadChapterControl.btnClass} >
            {this.state.loadChapterControl.btnLabel}
        </button> : "";
        var coverLoadMore = (this.state.coverLoadMore) ? 
        <button 
            onClick={this.getCoverList} 
            className={this.state.loadCoverControl.btnClass} >
            {this.state.loadCoverControl.btnLabel}
        </button> : "";

        return (
            <div class="flex flex-col justify-between">
                <Toaster />
                <Header />
                <div className="h-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-100">
                    <div className="container mx-auto px-4 flex flex-wrap justify-between">
                        <div className="box-border w-full py-2 mt-6 mb-2 mr-1 border-2 border-gray-200 dark:border-gray-900">
                            <div className="text-left text-lg flex flex-wrap border-b-2 pb-1 px-3 border-gray-200 dark:border-gray-900">
                                <span className="mr-2">{this.state.title}</span> <LanguageFlag language={this.state.originalLanguage} />
                            </div>
                            <div className="flex flex-wrap">
                                <div className="content flex w-full mt-2">
                                    <img 
                                        className="object-contain title-img-height flex items-start w-full sm:w-1/4 p-3"
                                        alt={this.state.title}
                                        src={this.state.coverFile} />
                                    <div className="item-body w-full sm:w-3/4 p-3">
                                        <table class="table-auto w-full p-2">
                                            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                                                <td width="20%" className="font-semibold">Title ID:</td>
                                                <td width="80%">{this.state.id}</td>
                                            </tr>
                                            {trAltTitles}
                                            {trAuthor}
                                            {trArtist}
                                            {trDemographic}
                                            {trGenre}
                                            {trTheme}
                                            {trContentRating}
                                            <tr className="text-left hidden border-b border-gray-200 dark:border-gray-900">
                                                <td width="20%" className="font-semibold">Rating:</td>
                                                <td width="80%">Coming soon (?)</td>
                                            </tr>
                                            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                                                <td width="20%" className="font-semibold">Pub. status:</td>
                                                <td width="80%">{this.state.status}</td>
                                            </tr>
                                            <tr className="text-left hidden border-b border-gray-200 dark:border-gray-900">
                                                <td width="20%" className="font-semibold">Stats:</td>
                                                <td width="80%">Coming soon (?)</td>
                                            </tr>
                                            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                                                <td width="20%" className="font-semibold">Description:</td>
                                                <td width="80%" className="text-justify">{this.state.description}</td>
                                            </tr>
                                            {trOfficial}
                                            {trRetail}
                                            {trInformation}
                                            <tr className="text-left hidden border-b border-gray-200 dark:border-gray-900">
                                                <td width="20%" className="font-semibold">Reading progress:</td>
                                                <td width="80%">Coming soon (?)</td>
                                            </tr>
                                            <tr className="text-left hidden">
                                                <td width="20%" className="font-semibold">Actions:</td>
                                                <td width="80%">Coming soon (?)</td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="box-border w-full py-2 mb-6 mr-1 border-gray-200 dark:border-gray-900">
                            <button onClick={() => this.changeTabs("chapter")} className={this.state.tabControl.btnChapter} >
                                Chapters
                            </button>
                            <button onClick={() => this.changeTabs("cover")} className={this.state.tabControl.btnCover}>
                                Covers
                            </button>

                            <div className={this.state.tabControl.contentChapter}>
                                {chapterLoading}
                                <table class="table-auto w-full p-2">
                                    <thead className="h-8 border-b-2 border-gray-200 dark:border-gray-900">
                                        <th title="Read">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </th>
                                        <th title="Chapter">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </th>
                                        <th title="Language">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                            </svg>
                                        </th>
                                        <th title="Group">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </th>
                                        <th title="Uploader">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </th>
                                        <th className="hidden" title="Views">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </th>
                                        <th title="Age">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-right" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </th>
                                    </thead>
                                    <tbody>
                                        {this.state.chapterList}
                                    </tbody>
                                    {chapterLoadMore}
                                </table>
                            </div>
                        
                            <div className={this.state.tabControl.contentCover}>
                                {coverLoading}
                                <div className="flex flex-wrap mx-auto content-center">
                                    {this.state.coverList}
                                </div>
                                {coverLoadMore}                               
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }
}

export default withRouter(Title);